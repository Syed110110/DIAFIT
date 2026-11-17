import { postgresPool } from '../config/postgres';
import {
  calculateAdherenceMetrics,
  categorizeGlucoseLevel,
  DoseCounts,
} from '../domain/reportPolicy';

export interface ClinicalReportFilter {
  patientId: string;
  days: number;
}

export const generateClinicalReport = async (filter: ClinicalReportFilter) => {
  const { patientId, days } = filter;
  const daysInt = Math.max(1, Math.min(365, Math.round(days || 30)));

  // 1. Patient identity & settings
  const patientResult = await postgresPool.query(
    'SELECT id, name, email FROM users WHERE id = $1',
    [patientId]
  );
  if (!patientResult.rowCount) {
    throw Object.assign(new Error('Patient not found'), { status: 404 });
  }
  const patient = patientResult.rows[0];

  const settingsResult = await postgresPool.query(
    'SELECT safe_glucose_min_mg_dl, safe_glucose_max_mg_dl, critical_glucose_min_mg_dl, critical_glucose_max_mg_dl, dose_grace_minutes, dose_miss_after_minutes FROM patient_care_settings WHERE patient_id = $1',
    [patientId]
  );
  const settings = settingsResult.rows[0] || {};
  const safeMin = settings.safe_glucose_min_mg_dl ? Number(settings.safe_glucose_min_mg_dl) : 70;
  const safeMax = settings.safe_glucose_max_mg_dl ? Number(settings.safe_glucose_max_mg_dl) : 180;

  // 2. Dose adherence breakdown
  const doseRows = await postgresPool.query(
    `SELECT state, count(*)::int as count 
     FROM dose_occurrences 
     WHERE patient_id = $1 AND scheduled_for >= now() - make_interval(days => $2)
     GROUP BY state`,
    [patientId, daysInt]
  );

  const doseCounts: DoseCounts = { taken: 0, late: 0, missed: 0, pending: 0 };
  for (const row of doseRows.rows) {
    const st = String(row.state).toUpperCase();
    if (st === 'TAKEN') doseCounts.taken = row.count;
    else if (st === 'LATE') doseCounts.late = row.count;
    else if (st === 'MISSED') doseCounts.missed = row.count;
    else if (st === 'PENDING') doseCounts.pending = row.count;
  }
  const adherenceMetrics = calculateAdherenceMetrics(doseCounts);

  const recentDoses = await postgresPool.query(
    `SELECT id, medication_name, scheduled_for, state, conflict_state 
     FROM dose_occurrences 
     WHERE patient_id = $1 AND scheduled_for >= now() - make_interval(days => $2)
     ORDER BY scheduled_for DESC LIMIT 10`,
    [patientId, daysInt]
  );

  // 3. Glucose readings breakdown (low / normal / high)
  const glucoseRows = await postgresPool.query(
    `SELECT id, value_mg_dl, context, measured_at, author_role, source 
     FROM glucose_readings 
     WHERE patient_id = $1 AND measured_at >= now() - make_interval(days => $2)
     ORDER BY measured_at DESC`,
    [patientId, daysInt]
  );

  let lowCount = 0;
  let normalCount = 0;
  let highCount = 0;
  let totalGlucose = 0;
  let minGlucose: number | null = null;
  let maxGlucose: number | null = null;
  const contextBreakdown: Record<string, { count: number; total: number; avg: number }> = {};

  for (const row of glucoseRows.rows) {
    const val = Number(row.value_mg_dl);
    totalGlucose += val;
    if (minGlucose === null || val < minGlucose) minGlucose = val;
    if (maxGlucose === null || val > maxGlucose) maxGlucose = val;

    const cat = categorizeGlucoseLevel(val, safeMin, safeMax);
    if (cat === 'LOW') lowCount += 1;
    else if (cat === 'HIGH') highCount += 1;
    else normalCount += 1;

    const ctx = row.context || 'OTHER';
    if (!contextBreakdown[ctx]) {
      contextBreakdown[ctx] = { count: 0, total: 0, avg: 0 };
    }
    contextBreakdown[ctx].count += 1;
    contextBreakdown[ctx].total += val;
  }

  const glucoseCount = glucoseRows.rows.length;
  const avgGlucose = glucoseCount > 0 ? Math.round((totalGlucose / glucoseCount) * 10) / 10 : null;
  const timeInRangePercent = glucoseCount > 0 ? Math.round((normalCount / glucoseCount) * 100) : 0;

  for (const ctx of Object.keys(contextBreakdown)) {
    contextBreakdown[ctx].avg = Math.round((contextBreakdown[ctx].total / contextBreakdown[ctx].count) * 10) / 10;
  }

  // 4. Alerts and escalations summary
  const alertStats = await postgresPool.query(
    `SELECT kind, severity, state, count(*)::int as count 
     FROM care_alerts 
     WHERE patient_id = $1 AND created_at >= now() - make_interval(days => $2)
     GROUP BY kind, severity, state`,
    [patientId, daysInt]
  );

  let openAlerts = 0;
  let escalatedAlerts = 0;
  let acknowledgedAlerts = 0;
  let glucoseAlerts = 0;
  let missedDoseAlerts = 0;
  let sosAlerts = 0;

  for (const row of alertStats.rows) {
    if (row.state === 'OPEN') openAlerts += row.count;
    if (row.state === 'ESCALATED') escalatedAlerts += row.count;
    if (row.state === 'ACKNOWLEDGED' || row.state === 'RESOLVED') acknowledgedAlerts += row.count;

    if (row.kind === 'GLUCOSE_OUT_OF_RANGE') glucoseAlerts += row.count;
    if (row.kind === 'MISSED_DOSE') missedDoseAlerts += row.count;
    if (row.kind === 'SOS') sosAlerts += row.count;
  }

  const recentAlerts = await postgresPool.query(
    `SELECT id, kind, severity, state, latitude, longitude, created_at, acknowledged_at 
     FROM care_alerts 
     WHERE patient_id = $1 AND created_at >= now() - make_interval(days => $2)
     ORDER BY created_at DESC LIMIT 10`,
    [patientId, daysInt]
  );

  return {
    patient: {
      id: patient.id.trim(),
      name: patient.name,
      email: patient.email,
    },
    reportPeriodDays: daysInt,
    generatedAt: new Date().toISOString(),
    clinicalSettings: {
      safeGlucoseMin: safeMin,
      safeGlucoseMax: safeMax,
      criticalGlucoseMin: settings.critical_glucose_min_mg_dl ? Number(settings.critical_glucose_min_mg_dl) : null,
      criticalGlucoseMax: settings.critical_glucose_max_mg_dl ? Number(settings.critical_glucose_max_mg_dl) : null,
    },
    adherence: {
      ...adherenceMetrics,
      counts: doseCounts,
      recentDoses: recentDoses.rows,
    },
    glucose: {
      totalReadings: glucoseCount,
      averageMgDl: avgGlucose,
      minMgDl: minGlucose,
      maxMgDl: maxGlucose,
      timeInRangePercent,
      distribution: {
        low: lowCount,
        normal: normalCount,
        high: highCount,
      },
      contextBreakdown,
      recentReadings: glucoseRows.rows.slice(0, 10),
    },
    alerts: {
      totalAlerts: openAlerts + escalatedAlerts + acknowledgedAlerts,
      openAlerts,
      escalatedAlerts,
      acknowledgedAlerts,
      byKind: {
        glucoseOutOfRange: glucoseAlerts,
        missedDose: missedDoseAlerts,
        sos: sosAlerts,
      },
      recentAlerts: recentAlerts.rows,
    },
  };
};
