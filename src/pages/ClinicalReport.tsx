import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Heart,
  Printer,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface ClinicalReportData {
  patient: {
    id: string;
    name: string;
    email: string;
  };
  reportPeriodDays: number;
  generatedAt: string;
  clinicalSettings: {
    safeGlucoseMin: number;
    safeGlucoseMax: number;
    criticalGlucoseMin: number | null;
    criticalGlucoseMax: number | null;
  };
  adherence: {
    totalScheduled: number;
    totalEvaluated: number;
    adherenceRate: number;
    onTimeRate: number;
    adherenceStatus: 'EXCELLENT' | 'GOOD' | 'AT_RISK';
    counts: {
      taken: number;
      late: number;
      missed: number;
      pending: number;
    };
    recentDoses: Array<{
      id: string;
      medication_name: string;
      scheduled_for: string;
      state: string;
      conflict_state: string;
    }>;
  };
  glucose: {
    totalReadings: number;
    averageMgDl: number | null;
    minMgDl: number | null;
    maxMgDl: number | null;
    timeInRangePercent: number;
    distribution: {
      low: number;
      normal: number;
      high: number;
    };
    contextBreakdown: Record<string, { count: number; total: number; avg: number }>;
    recentReadings: Array<{
      id: string;
      value_mg_dl: string;
      context: string;
      measured_at: string;
      author_role: string;
    }>;
  };
  alerts: {
    totalAlerts: number;
    openAlerts: number;
    escalatedAlerts: number;
    acknowledgedAlerts: number;
    byKind: {
      glucoseOutOfRange: number;
      missedDose: number;
      sos: number;
    };
    recentAlerts: Array<{
      id: string;
      kind: string;
      severity: string;
      state: string;
      latitude: number | null;
      longitude: number | null;
      created_at: string;
      acknowledged_at: string | null;
    }>;
  };
}

export default function ClinicalReport() {
  const { user } = useAuth();
  const [days, setDays] = useState<number>(30);
  const [report, setReport] = useState<ClinicalReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const loadReport = useCallback(async (periodDays: number) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/care/reports/summary', {
        params: { days: periodDays },
      });
      setReport(response.data as ClinicalReportData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load clinical report';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReport(days);
  }, [days, loadReport]);

  const handlePrint = () => {
    window.print();
  };

  const adherenceColor =
    !report ? 'text-gray-900' :
    report.adherence.adherenceStatus === 'EXCELLENT' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
    report.adherence.adherenceStatus === 'GOOD' ? 'text-amber-700 bg-amber-50 border-amber-200' :
    'text-red-700 bg-red-50 border-red-200';

  return (
    <main className="dia-workspace min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Header Controls (Hidden during print) */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-[var(--dia-green)]" />
              <h1 className="text-2xl font-bold text-gray-900">Clinical Consultation Report</h1>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Consolidated adherence, glycemic control, and alert trends for clinician review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Period Selector */}
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1 text-xs font-semibold">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`rounded-md px-3 py-1.5 transition-colors ${
                    days === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>

            {/* Print / Save as PDF Button */}
            <button
              onClick={handlePrint}
              disabled={isLoading || !report}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--dia-green)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Printable Clinical Sheet Header */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm print:border-none print:p-0 print:shadow-none">
          <div className="border-b border-gray-200 pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--dia-green)]">DiaFit Comprehensive Care</p>
                <h2 className="text-3xl font-extrabold text-gray-900">
                  {report?.patient.name || 'Patient'} — Clinical Trend Summary
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Patient Email: {report?.patient.email} · System ID: <code className="text-xs">{report?.patient.id}</code>
                </p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p><span className="font-semibold text-gray-700">Observation Window:</span> Last {days} Days</p>
                <p><span className="font-semibold text-gray-700">Report Generated:</span> {report ? new Date(report.generatedAt).toLocaleString() : '--'}</p>
                <p><span className="font-semibold text-gray-700">Reviewing Clinician:</span> {user?.name} ({user?.role})</p>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="py-12 text-center text-gray-500">
              <Activity className="mx-auto h-8 w-8 animate-spin text-[var(--dia-green)]" />
              <p className="mt-2 text-sm">Aggregating patient adherence and glycemic trends...</p>
            </div>
          )}

          {error && (
            <div className="my-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {report && !isLoading && (
            <div className="mt-6 space-y-8">
              
              {/* Executive KPI Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                
                {/* 1. Adherence Rate */}
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-xs font-semibold uppercase">Overall Adherence</span>
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {report.adherence.adherenceRate}%
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-500">On-Time: {report.adherence.onTimeRate}%</span>
                    <span className={`rounded border px-2 py-0.5 font-bold uppercase ${adherenceColor}`}>
                      {report.adherence.adherenceStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* 2. Glucose Time in Range */}
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-xs font-semibold uppercase">Time in Range (TIR)</span>
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {report.glucose.timeInRangePercent}%
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Safe Target: {report.clinicalSettings.safeGlucoseMin}–{report.clinicalSettings.safeGlucoseMax} mg/dL
                  </p>
                </div>

                {/* 3. Average Glucose */}
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-xs font-semibold uppercase">Average Glucose</span>
                    <Heart className="h-5 w-5 text-rose-500" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {report.glucose.averageMgDl != null ? `${report.glucose.averageMgDl}` : '--'}
                    <span className="ml-1 text-sm font-normal text-gray-500">mg/dL</span>
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Range: {report.glucose.minMgDl ?? '--'} – {report.glucose.maxMgDl ?? '--'} mg/dL ({report.glucose.totalReadings} readings)
                  </p>
                </div>

                {/* 4. Escalations & SOS */}
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="text-xs font-semibold uppercase">Care Escalations</span>
                    <ShieldAlert className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {report.alerts.escalatedAlerts}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Total Alerts: {report.alerts.totalAlerts} · SOS: {report.alerts.byKind.sos}
                  </p>
                </div>

              </div>

              {/* Section 1: Medication Adherence */}
              <div className="rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-base font-bold text-gray-900">1. Medication Adherence Profile</h3>
                  <span className="text-xs text-gray-500">Evaluated doses: {report.adherence.totalEvaluated}</span>
                </div>

                {/* Visual Distribution Bar */}
                <div className="mt-4">
                  <div className="flex h-5 w-full overflow-hidden rounded-full bg-gray-100 text-xs text-white">
                    {report.adherence.totalEvaluated > 0 ? (
                      <>
                        <div
                          style={{ width: `${(report.adherence.counts.taken / report.adherence.totalEvaluated) * 100}%` }}
                          className="bg-emerald-600 flex items-center justify-center font-bold"
                          title="Taken on time"
                        >
                          {report.adherence.counts.taken > 0 ? `${report.adherence.counts.taken}` : ''}
                        </div>
                        <div
                          style={{ width: `${(report.adherence.counts.late / report.adherence.totalEvaluated) * 100}%` }}
                          className="bg-amber-500 flex items-center justify-center font-bold"
                          title="Taken late"
                        >
                          {report.adherence.counts.late > 0 ? `${report.adherence.counts.late}` : ''}
                        </div>
                        <div
                          style={{ width: `${(report.adherence.counts.missed / report.adherence.totalEvaluated) * 100}%` }}
                          className="bg-red-600 flex items-center justify-center font-bold"
                          title="Missed"
                        >
                          {report.adherence.counts.missed > 0 ? `${report.adherence.counts.missed}` : ''}
                        </div>
                      </>
                    ) : (
                      <div className="w-full text-center text-xs text-gray-400">No scheduled dose data in this window</div>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs">
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-600" /> On-time ({report.adherence.counts.taken})</span>
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-500" /> Late ({report.adherence.counts.late})</span>
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-600" /> Missed ({report.adherence.counts.missed})</span>
                    <span className="flex items-center gap-1.5 text-gray-400">Pending ({report.adherence.counts.pending})</span>
                  </div>
                </div>

                {/* Recent Doses Table */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500">
                        <th className="py-2">Medication</th>
                        <th className="py-2">Scheduled For</th>
                        <th className="py-2">Lifecycle State</th>
                        <th className="py-2">Conflict Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.adherence.recentDoses.length === 0 ? (
                        <tr><td colSpan={4} className="py-3 text-center text-gray-400">No dose records</td></tr>
                      ) : (
                        report.adherence.recentDoses.map((d) => (
                          <tr key={d.id}>
                            <td className="py-2 font-medium text-gray-900">{d.medication_name}</td>
                            <td className="py-2 text-gray-600">{new Date(d.scheduled_for).toLocaleString()}</td>
                            <td className="py-2">
                              <span className={`rounded px-2 py-0.5 font-semibold ${
                                d.state === 'TAKEN' ? 'bg-emerald-100 text-emerald-800' :
                                d.state === 'LATE' ? 'bg-amber-100 text-amber-800' :
                                d.state === 'MISSED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {d.state}
                              </span>
                            </td>
                            <td className="py-2 text-gray-500">{d.conflict_state}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Blood Glucose Glycemic Profile */}
              <div className="rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-base font-bold text-gray-900">2. Glycemic Control &amp; Reading Distribution</h3>
                  <span className="text-xs text-gray-500">Total readings: {report.glucose.totalReadings}</span>
                </div>

                {/* Glycemic Distribution Bar */}
                <div className="mt-4">
                  <div className="flex h-5 w-full overflow-hidden rounded-full bg-gray-100 text-xs text-white">
                    {report.glucose.totalReadings > 0 ? (
                      <>
                        <div
                          style={{ width: `${(report.glucose.distribution.low / report.glucose.totalReadings) * 100}%` }}
                          className="bg-blue-600 flex items-center justify-center font-bold"
                          title="Hypoglycemic"
                        >
                          {report.glucose.distribution.low > 0 ? `${report.glucose.distribution.low}` : ''}
                        </div>
                        <div
                          style={{ width: `${(report.glucose.distribution.normal / report.glucose.totalReadings) * 100}%` }}
                          className="bg-emerald-600 flex items-center justify-center font-bold"
                          title="In Range"
                        >
                          {report.glucose.distribution.normal > 0 ? `${report.glucose.distribution.normal}` : ''}
                        </div>
                        <div
                          style={{ width: `${(report.glucose.distribution.high / report.glucose.totalReadings) * 100}%` }}
                          className="bg-orange-500 flex items-center justify-center font-bold"
                          title="Hyperglycemic"
                        >
                          {report.glucose.distribution.high > 0 ? `${report.glucose.distribution.high}` : ''}
                        </div>
                      </>
                    ) : (
                      <div className="w-full text-center text-xs text-gray-400">No glucose readings in this window</div>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs">
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-blue-600" /> Low &lt;{report.clinicalSettings.safeGlucoseMin} mg/dL ({report.glucose.distribution.low})</span>
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-600" /> In Range {report.clinicalSettings.safeGlucoseMin}–{report.clinicalSettings.safeGlucoseMax} mg/dL ({report.glucose.distribution.normal})</span>
                    <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-orange-500" /> High &gt;{report.clinicalSettings.safeGlucoseMax} mg/dL ({report.glucose.distribution.high})</span>
                  </div>
                </div>

                {/* Context Breakdown */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                  {Object.entries(report.glucose.contextBreakdown).map(([ctx, data]) => (
                    <div key={ctx} className="rounded border border-gray-100 bg-gray-50/50 p-2.5">
                      <p className="font-semibold text-gray-700">{ctx.replace('_', ' ')}</p>
                      <p className="mt-1 text-base font-bold text-gray-900">{data.avg} <span className="text-xs font-normal text-gray-500">mg/dL</span></p>
                      <p className="text-[10px] text-gray-500">{data.count} readings</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Safety Alerts & Escalations */}
              <div className="rounded-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-base font-bold text-gray-900">3. Care Alert Escalations &amp; Emergency Log</h3>
                  <span className="text-xs text-gray-500">Escalated: {report.alerts.escalatedAlerts} of {report.alerts.totalAlerts}</span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="rounded bg-gray-50 p-2">
                    <span className="text-gray-500">Glucose Out of Range</span>
                    <p className="text-lg font-bold text-gray-800">{report.alerts.byKind.glucoseOutOfRange}</p>
                  </div>
                  <div className="rounded bg-gray-50 p-2">
                    <span className="text-gray-500">Missed Scheduled Doses</span>
                    <p className="text-lg font-bold text-gray-800">{report.alerts.byKind.missedDose}</p>
                  </div>
                  <div className="rounded bg-red-50 p-2">
                    <span className="text-red-700 font-semibold">Critical SOS Triggers</span>
                    <p className="text-lg font-bold text-red-700">{report.alerts.byKind.sos}</p>
                  </div>
                </div>

                {report.alerts.recentAlerts.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500">
                          <th className="py-2">Event</th>
                          <th className="py-2">Severity</th>
                          <th className="py-2">Status</th>
                          <th className="py-2">Timestamp</th>
                          <th className="py-2">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {report.alerts.recentAlerts.map((a) => (
                          <tr key={a.id}>
                            <td className="py-2 font-medium text-gray-900">{a.kind.replace(/_/g, ' ')}</td>
                            <td className="py-2">
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                a.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {a.severity}
                              </span>
                            </td>
                            <td className="py-2 text-gray-600">{a.state.toLowerCase()}</td>
                            <td className="py-2 text-gray-500">{new Date(a.created_at).toLocaleString()}</td>
                            <td className="py-2 text-gray-500">
                              {a.latitude != null && a.longitude != null ? `${Number(a.latitude).toFixed(4)}, ${Number(a.longitude).toFixed(4)}` : 'None'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Clinician Notes & Consultation Sign-off */}
              <div className="rounded-lg border border-dashed border-gray-300 p-5">
                <h3 className="text-sm font-bold text-gray-800">Clinician Assessment &amp; Recommendations</h3>
                <div className="mt-2 min-h-[80px] rounded border border-gray-200 bg-gray-50/50 p-3 text-xs text-gray-400">
                  Notes / Consultation remarks (Doctor may write physical recommendations upon clinical review)
                </div>
                <div className="mt-6 flex justify-between text-xs text-gray-500">
                  <p>Clinician Signature: _______________________</p>
                  <p>Date: _______________________</p>
                </div>
              </div>

              {/* Medical Disclaimer Footer */}
              <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
                <p>DiaFit Academic Capstone Platform · Not an FDA/CE Medical Device · Does not prescribe or diagnose</p>
              </div>

            </div>
          )}
        </section>

      </div>
    </main>
  );
}
