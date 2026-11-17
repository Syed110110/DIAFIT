import { PoolClient } from 'pg';
import { postgresPool } from '../config/postgres';
import { isConflictingDoseLog } from '../domain/conflictPolicy';
import { DoseState, stateForDoseLog } from '../domain/doseStateMachine';
import { classifyGlucoseReading } from '../domain/glucoseAlertPolicy';
import { UserRole } from '../types/roles';
import { createCareAlert } from './careAlertService';

export interface CareActor {
  id: string;
  role: UserRole;
}

const defaultSettings = {
  safe_glucose_min_mg_dl: null,
  safe_glucose_max_mg_dl: null,
  dose_grace_minutes: 15,
  dose_miss_after_minutes: 120,
  conflict_window_seconds: 300,
  critical_glucose_min_mg_dl: null,
  critical_glucose_max_mg_dl: null,
  alert_ack_window_minutes: 10,
  alert_retry_limit: 3,
};

const getSettingsWithClient = async (client: PoolClient, patientId: string) => {
  const result = await client.query(
    'SELECT * FROM patient_care_settings WHERE patient_id = $1',
    [patientId]
  );
  return result.rows[0] || defaultSettings;
};

export const getCareSettings = async (patientId: string) => {
  const result = await postgresPool.query(
    'SELECT * FROM patient_care_settings WHERE patient_id = $1',
    [patientId]
  );
  return result.rows[0] || defaultSettings;
};

export const updateCareSettings = async (
  patientId: string,
  actorId: string,
  values: {
    safeGlucoseMin?: number | null;
    safeGlucoseMax?: number | null;
    doseGraceMinutes?: number;
    doseMissAfterMinutes?: number;
    conflictWindowSeconds?: number;
    criticalGlucoseMin?: number | null;
    criticalGlucoseMax?: number | null;
    alertAckWindowMinutes?: number;
    alertRetryLimit?: number;
  }
) => {
  const current = await getCareSettings(patientId);
  const safeMin = values.safeGlucoseMin === undefined ? current.safe_glucose_min_mg_dl : values.safeGlucoseMin;
  const safeMax = values.safeGlucoseMax === undefined ? current.safe_glucose_max_mg_dl : values.safeGlucoseMax;
  const grace = values.doseGraceMinutes ?? current.dose_grace_minutes;
  const missAfter = values.doseMissAfterMinutes ?? current.dose_miss_after_minutes;
  const conflictWindow = values.conflictWindowSeconds ?? current.conflict_window_seconds;
  const criticalMin = values.criticalGlucoseMin === undefined ? current.critical_glucose_min_mg_dl : values.criticalGlucoseMin;
  const criticalMax = values.criticalGlucoseMax === undefined ? current.critical_glucose_max_mg_dl : values.criticalGlucoseMax;
  const alertAckWindow = values.alertAckWindowMinutes ?? current.alert_ack_window_minutes;
  const alertRetryLimit = values.alertRetryLimit ?? current.alert_retry_limit;

  const result = await postgresPool.query(
    `INSERT INTO patient_care_settings
       (patient_id, safe_glucose_min_mg_dl, safe_glucose_max_mg_dl,
        critical_glucose_min_mg_dl, critical_glucose_max_mg_dl,
        dose_grace_minutes, dose_miss_after_minutes, conflict_window_seconds,
        alert_ack_window_minutes, alert_retry_limit, updated_by, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now())
     ON CONFLICT (patient_id) DO UPDATE SET
       safe_glucose_min_mg_dl = EXCLUDED.safe_glucose_min_mg_dl,
       safe_glucose_max_mg_dl = EXCLUDED.safe_glucose_max_mg_dl,
       critical_glucose_min_mg_dl = EXCLUDED.critical_glucose_min_mg_dl,
       critical_glucose_max_mg_dl = EXCLUDED.critical_glucose_max_mg_dl,
       dose_grace_minutes = EXCLUDED.dose_grace_minutes,
       dose_miss_after_minutes = EXCLUDED.dose_miss_after_minutes,
       conflict_window_seconds = EXCLUDED.conflict_window_seconds,
       alert_ack_window_minutes = EXCLUDED.alert_ack_window_minutes,
       alert_retry_limit = EXCLUDED.alert_retry_limit,
       updated_by = EXCLUDED.updated_by, updated_at = now()
     RETURNING *`,
    [patientId, safeMin, safeMax, criticalMin, criticalMax, grace, missAfter,
      conflictWindow, alertAckWindow, alertRetryLimit, actorId]
  );
  return result.rows[0];
};

export const createDoseOccurrence = async (
  patientId: string,
  actor: CareActor,
  input: { medicationName: string; scheduledFor: Date; medicationId?: string }
) => {
  const result = await postgresPool.query(
    `INSERT INTO dose_occurrences
       (patient_id, medication_id, medication_name, scheduled_for, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [patientId, input.medicationId || null, input.medicationName.trim(), input.scheduledFor, actor.id]
  );
  return result.rows[0];
};

export const listDoseOccurrences = async (patientId: string) => {
  const result = await postgresPool.query(
    `SELECT d.*, COALESCE(
       json_agg(json_build_object(
         'id', l.id, 'authorId', l.author_id, 'authorRole', l.author_role,
         'source', l.source, 'kind', l.kind, 'resultingState', l.resulting_state,
         'takenAt', l.taken_at, 'confirmedAt', l.confirmed_at,
         'notes', l.notes, 'supersedesLogId', l.supersedes_log_id
       ) ORDER BY l.confirmed_at) FILTER (WHERE l.id IS NOT NULL), '[]'::json
     ) AS logs
     FROM dose_occurrences d
     LEFT JOIN dose_logs l ON l.occurrence_id = d.id
     WHERE d.patient_id = $1
     GROUP BY d.id
     ORDER BY d.scheduled_for DESC
     LIMIT 100`,
    [patientId]
  );
  return result.rows;
};

const addDoseLog = async (
  client: PoolClient,
  occurrence: Record<string, unknown>,
  patientId: string,
  actor: CareActor,
  input: { takenAt: Date; source: 'MANUAL' | 'VOICE'; notes?: string; kind?: 'LOG' | 'CORRECTION'; supersedesLogId?: string }
) => {
  const settings = await getSettingsWithClient(client, patientId);
  const currentState = String(occurrence.state) as DoseState;
  const resultingState = stateForDoseLog(
    input.kind === 'CORRECTION' ? 'PENDING' : currentState,
    new Date(String(occurrence.scheduled_for)),
    input.takenAt,
    Number(settings.dose_grace_minutes)
  );
  const confirmedAt = new Date();
  const previousLogs = await client.query(
    `SELECT id, author_role, confirmed_at FROM dose_logs
     WHERE occurrence_id = $1 ORDER BY confirmed_at DESC LIMIT 50`,
    [occurrence.id]
  );
  const conflictingLog = previousLogs.rows.find((previous) => isConflictingDoseLog(
    previous.author_role as UserRole,
    new Date(previous.confirmed_at),
    actor.role,
    confirmedAt,
    Number(settings.conflict_window_seconds)
  ));

  const inserted = await client.query(
    `INSERT INTO dose_logs
       (occurrence_id, patient_id, author_id, author_role, source, kind,
        resulting_state, taken_at, notes, supersedes_log_id, confirmed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [occurrence.id, patientId, actor.id, actor.role, input.source, input.kind || 'LOG',
      resultingState, input.takenAt, input.notes || '', input.supersedesLogId || null, confirmedAt]
  );
  const log = inserted.rows[0];

  if (conflictingLog) {
    const openConflict = await client.query(
      `SELECT id FROM dose_conflicts WHERE occurrence_id = $1 AND status = 'OPEN' LIMIT 1`,
      [occurrence.id]
    );
    if (openConflict.rowCount === 0) {
      await client.query(
        `INSERT INTO dose_conflicts (occurrence_id, first_log_id, second_log_id)
         VALUES ($1, $2, $3)`,
        [occurrence.id, conflictingLog.id, log.id]
      );
    }
    await client.query(
      `UPDATE dose_occurrences SET conflict_state = 'OPEN', updated_at = now() WHERE id = $1`,
      [occurrence.id]
    );
  } else if (occurrence.conflict_state !== 'OPEN') {
    await client.query(
      `UPDATE dose_occurrences SET state = $2, confirmed_log_id = $3, updated_at = now() WHERE id = $1`,
      [occurrence.id, resultingState, log.id]
    );
  }

  return { log, conflictDetected: Boolean(conflictingLog) };
};

export const logDose = async (
  occurrenceId: string,
  patientId: string,
  actor: CareActor,
  input: { takenAt: Date; source: 'MANUAL' | 'VOICE'; notes?: string }
) => {
  const client = await postgresPool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(
      `SELECT * FROM dose_occurrences WHERE id = $1 AND patient_id = $2 FOR UPDATE`,
      [occurrenceId, patientId]
    );
    if (!found.rowCount) throw Object.assign(new Error('Dose occurrence not found'), { status: 404 });
    const result = await addDoseLog(client, found.rows[0], patientId, actor, input);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const correctDoseLog = async (
  occurrenceId: string,
  patientId: string,
  actor: CareActor,
  input: { originalLogId: string; takenAt: Date; notes?: string }
) => {
  const client = await postgresPool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(
      `SELECT * FROM dose_occurrences WHERE id = $1 AND patient_id = $2 FOR UPDATE`,
      [occurrenceId, patientId]
    );
    if (!found.rowCount) throw Object.assign(new Error('Dose occurrence not found'), { status: 404 });

    const original = await client.query(
      `SELECT id, author_id FROM dose_logs WHERE id = $1 AND occurrence_id = $2`,
      [input.originalLogId, occurrenceId]
    );
    if (!original.rowCount) throw Object.assign(new Error('Dose log not found'), { status: 404 });
    if (actor.role !== 'FAMILY_COORDINATOR' && original.rows[0].author_id.trim() !== actor.id) {
      throw Object.assign(new Error('You can correct only your own dose log'), { status: 403 });
    }

    const result = await addDoseLog(client, found.rows[0], patientId, actor, {
      takenAt: input.takenAt,
      source: 'MANUAL',
      notes: input.notes,
      kind: 'CORRECTION',
      supersedesLogId: input.originalLogId,
    });
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const listDoseConflicts = async (patientId: string) => {
  const result = await postgresPool.query(
    `SELECT c.*, d.medication_name, d.scheduled_for,
       json_agg(json_build_object(
         'id', l.id, 'authorId', l.author_id, 'authorRole', l.author_role,
         'resultingState', l.resulting_state, 'takenAt', l.taken_at,
         'confirmedAt', l.confirmed_at, 'notes', l.notes
       ) ORDER BY l.confirmed_at) AS logs
     FROM dose_conflicts c
     JOIN dose_occurrences d ON d.id = c.occurrence_id
     JOIN dose_logs l ON l.occurrence_id = d.id
     WHERE d.patient_id = $1 AND c.status = 'OPEN'
     GROUP BY c.id, d.id ORDER BY c.detected_at`,
    [patientId]
  );
  return result.rows;
};

export const resolveDoseConflict = async (
  conflictId: string,
  patientId: string,
  actorId: string,
  selectedLogId: string
) => {
  const client = await postgresPool.connect();
  try {
    await client.query('BEGIN');
    const conflict = await client.query(
      `SELECT c.id, c.occurrence_id FROM dose_conflicts c
       JOIN dose_occurrences d ON d.id = c.occurrence_id
       WHERE c.id = $1 AND d.patient_id = $2 AND c.status = 'OPEN' FOR UPDATE`,
      [conflictId, patientId]
    );
    if (!conflict.rowCount) throw Object.assign(new Error('Open dose conflict not found'), { status: 404 });

    const selected = await client.query(
      `SELECT id, resulting_state FROM dose_logs WHERE id = $1 AND occurrence_id = $2`,
      [selectedLogId, conflict.rows[0].occurrence_id]
    );
    if (!selected.rowCount) throw Object.assign(new Error('Selected log is not part of this dose'), { status: 400 });

    await client.query(
      `UPDATE dose_conflicts SET status = 'RESOLVED', resolved_by = $2,
       resolved_log_id = $3, resolved_at = now() WHERE id = $1`,
      [conflictId, actorId, selectedLogId]
    );
    await client.query(
      `UPDATE dose_occurrences SET state = $2, conflict_state = 'RESOLVED',
       confirmed_log_id = $3, updated_at = now() WHERE id = $1`,
      [conflict.rows[0].occurrence_id, selected.rows[0].resulting_state, selectedLogId]
    );

    await client.query('COMMIT');
    return { status: 'RESOLVED', selectedLogId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const createGlucoseReading = async (
  patientId: string,
  actor: CareActor,
  input: { valueMgDl: number; context: string; measuredAt: Date; source: 'MANUAL' | 'VOICE'; notes?: string }
) => {
  const client = await postgresPool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO glucose_readings
         (patient_id, author_id, author_role, source, value_mg_dl, context, measured_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [patientId, actor.id, actor.role, input.source, input.valueMgDl, input.context, input.measuredAt, input.notes || '']
    );
    const reading = result.rows[0];
    const settings = await getSettingsWithClient(client, patientId);
    const severity = classifyGlucoseReading(input.valueMgDl, {
      safeMin: settings.safe_glucose_min_mg_dl == null ? null : Number(settings.safe_glucose_min_mg_dl),
      safeMax: settings.safe_glucose_max_mg_dl == null ? null : Number(settings.safe_glucose_max_mg_dl),
      criticalMin: settings.critical_glucose_min_mg_dl == null ? null : Number(settings.critical_glucose_min_mg_dl),
      criticalMax: settings.critical_glucose_max_mg_dl == null ? null : Number(settings.critical_glucose_max_mg_dl),
    });
    let alert: Record<string, unknown> | null = null;
    if (severity) {
      alert = await createCareAlert(client, {
        patientId,
        kind: 'GLUCOSE_OUT_OF_RANGE',
        severity,
        glucoseReadingId: reading.id,
        acknowledgedWindowMinutes: Number(settings.alert_ack_window_minutes),
      });
    }
    await client.query('COMMIT');
    return { ...reading, alert };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const listGlucoseReadings = async (patientId: string) => {
  const result = await postgresPool.query(
    `SELECT * FROM glucose_readings WHERE patient_id = $1 ORDER BY measured_at DESC LIMIT 100`,
    [patientId]
  );
  return result.rows;
};

export const markOverdueDosesMissed = async (): Promise<number> => {
  const result = await postgresPool.query(
    `UPDATE dose_occurrences d SET state = 'MISSED', updated_at = now()
     WHERE d.state = 'PENDING' AND d.conflict_state <> 'OPEN'
       AND now() >= d.scheduled_for + make_interval(mins => COALESCE(
         (SELECT s.dose_miss_after_minutes FROM patient_care_settings s WHERE s.patient_id = d.patient_id), 120
       ))`
  );
  return result.rowCount || 0;
};