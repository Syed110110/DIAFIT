import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { careDataService } from '../services/api';

type DoseState = 'PENDING' | 'TAKEN' | 'LATE' | 'MISSED';

interface DoseLog {
  id: string;
  authorId: string;
  authorRole: string;
  source: string;
  kind: 'LOG' | 'CORRECTION';
  resultingState: DoseState;
  takenAt: string;
  confirmedAt: string;
  notes: string;
  supersedesLogId?: string | null;
}

interface DoseOccurrence {
  id: string;
  medication_name: string;
  scheduled_for: string;
  state: DoseState;
  conflict_state: string;
  logs: DoseLog[];
}

interface DoseConflict {
  id: string;
  medication_name: string;
  scheduled_for: string;
  logs: DoseLog[];
}

interface GlucoseReading {
  id: string;
  value_mg_dl: string;
  context: string;
  measured_at: string;
  author_role: string;
  source: string;
}

interface CareSettings {
  safe_glucose_min_mg_dl: number | string | null;
  safe_glucose_max_mg_dl: number | string | null;
  critical_glucose_min_mg_dl: number | string | null;
  critical_glucose_max_mg_dl: number | string | null;
  dose_grace_minutes: number;
  dose_miss_after_minutes: number;
  conflict_window_seconds: number;
  alert_ack_window_minutes: number;
  alert_retry_limit: number;
}

type LogTab = 'doses' | 'glucose';

const localDateTime = (date = new Date()) => {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
};

const displayDateTime = (value: string) => new Date(value).toLocaleString();

export default function CareLogs() {
  const { user } = useAuth();
  const [tab, setTab] = useState<LogTab>('doses');
  const [doses, setDoses] = useState<DoseOccurrence[]>([]);
  const [conflicts, setConflicts] = useState<DoseConflict[]>([]);
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [settings, setSettings] = useState<CareSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState({ safeMin: '', safeMax: '', criticalMin: '', criticalMax: '', grace: '15', missAfter: '120', conflictWindow: '300', ackWindow: '10', retryLimit: '3' });
  const [scheduleForm, setScheduleForm] = useState({ medicationName: '', scheduledFor: localDateTime(new Date(Date.now() + 60 * 60_000)) });
  const [glucoseForm, setGlucoseForm] = useState({ valueMgDl: '', context: 'FASTING', measuredAt: localDateTime(), notes: '' });
  const [recordingOccurrence, setRecordingOccurrence] = useState<string | null>(null);
  const [takenAt, setTakenAt] = useState(localDateTime());
  const [correctionTarget, setCorrectionTarget] = useState<{ occurrenceId: string; log: DoseLog } | null>(null);
  const [correctionTime, setCorrectionTime] = useState(localDateTime());
  const [conflictSelections, setConflictSelections] = useState<Record<string, string>>({});
  const [review, setReview] = useState<'schedule' | 'glucose' | 'dose' | 'correction' | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const [settingsResponse, dosesResponse, glucoseResponse] = await Promise.all([
        careDataService.getSettings(),
        careDataService.getDoses(),
        careDataService.getGlucoseReadings(),
      ]);
      const loadedSettings = settingsResponse as CareSettings;
      setSettings(loadedSettings);
      setSettingsForm({
        safeMin: loadedSettings.safe_glucose_min_mg_dl == null ? '' : String(loadedSettings.safe_glucose_min_mg_dl),
        safeMax: loadedSettings.safe_glucose_max_mg_dl == null ? '' : String(loadedSettings.safe_glucose_max_mg_dl),
        criticalMin: loadedSettings.critical_glucose_min_mg_dl == null ? '' : String(loadedSettings.critical_glucose_min_mg_dl),
        criticalMax: loadedSettings.critical_glucose_max_mg_dl == null ? '' : String(loadedSettings.critical_glucose_max_mg_dl),
        grace: String(loadedSettings.dose_grace_minutes),
        missAfter: String(loadedSettings.dose_miss_after_minutes),
        conflictWindow: String(loadedSettings.conflict_window_seconds),
        ackWindow: String(loadedSettings.alert_ack_window_minutes),
        retryLimit: String(loadedSettings.alert_retry_limit),
      });
      setDoses(dosesResponse as DoseOccurrence[]);
      setReadings(glucoseResponse as GlucoseReading[]);
      if (user?.role === 'FAMILY_COORDINATOR') {
        setConflicts(await careDataService.getConflicts() as DoseConflict[]);
      } else {
        setConflicts([]);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load patient records. Select an approved patient in Care Team first.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => { void loadData(); }, [loadData]);

  const saveSchedule = async (event: FormEvent) => {
    event.preventDefault();
    if (!scheduleForm.medicationName.trim() || !scheduleForm.scheduledFor) return;
    setReview('schedule');
  };

  const confirmSchedule = async () => {
    setIsSaving(true);
    try {
      await careDataService.scheduleDose({
        medicationName: scheduleForm.medicationName.trim(),
        scheduledFor: new Date(scheduleForm.scheduledFor).toISOString(),
        confirmed: true,
      });
      setScheduleForm({ medicationName: '', scheduledFor: localDateTime(new Date(Date.now() + 60 * 60_000)) });
      setReview(null);
      setMessage('Scheduled dose saved.');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not schedule dose.');
    } finally {
      setIsSaving(false);
    }
  };

  const beginDoseLog = (occurrenceId: string) => {
    setRecordingOccurrence(occurrenceId);
    setTakenAt(localDateTime());
    setReview(null);
  };

  const reviewDoseLog = (event: FormEvent) => {
    event.preventDefault();
    setReview('dose');
  };

  const confirmDoseLog = async () => {
    if (!recordingOccurrence) return;
    setIsSaving(true);
    try {
      await careDataService.logDose(recordingOccurrence, {
        takenAt: new Date(takenAt).toISOString(),
        source: 'MANUAL',
        notes: '',
        confirmed: true,
      });
      setRecordingOccurrence(null);
      setReview(null);
      setMessage('Dose entry saved with your account and role.');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save dose log.');
    } finally {
      setIsSaving(false);
    }
  };

  const reviewGlucose = (event: FormEvent) => {
    event.preventDefault();
    setReview('glucose');
  };

  const confirmGlucose = async () => {
    setIsSaving(true);
    try {
      await careDataService.logGlucose({
        valueMgDl: Number(glucoseForm.valueMgDl),
        context: glucoseForm.context,
        measuredAt: new Date(glucoseForm.measuredAt).toISOString(),
        source: 'MANUAL',
        notes: glucoseForm.notes,
        confirmed: true,
      });
      setGlucoseForm({ valueMgDl: '', context: 'FASTING', measuredAt: localDateTime(), notes: '' });
      setReview(null);
      setMessage('Glucose reading saved. DiaFit does not interpret this as a diagnosis.');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save glucose reading.');
    } finally {
      setIsSaving(false);
    }
  };

  const beginCorrection = (occurrenceId: string, log: DoseLog) => {
    setCorrectionTarget({ occurrenceId, log });
    setCorrectionTime(localDateTime(new Date(log.takenAt)));
    setReview(null);
  };

  const confirmCorrection = async (event: FormEvent) => {
    event.preventDefault();
    if (!correctionTarget) return;
    setIsSaving(true);
    try {
      await careDataService.correctDose(correctionTarget.occurrenceId, {
        originalLogId: correctionTarget.log.id,
        takenAt: new Date(correctionTime).toISOString(),
        notes: 'Correction; prior version retained',
        confirmed: true,
      });
      setCorrectionTarget(null);
      setReview(null);
      setMessage('Correction saved as a new version; the original entry remains in history.');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save correction.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveSettings = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const saved = await careDataService.updateSettings({
        safeGlucoseMinMgDl: settingsForm.safeMin === '' ? null : Number(settingsForm.safeMin),
        safeGlucoseMaxMgDl: settingsForm.safeMax === '' ? null : Number(settingsForm.safeMax),
        criticalGlucoseMinMgDl: settingsForm.criticalMin === '' ? null : Number(settingsForm.criticalMin),
        criticalGlucoseMaxMgDl: settingsForm.criticalMax === '' ? null : Number(settingsForm.criticalMax),
        doseGraceMinutes: Number(settingsForm.grace),
        doseMissAfterMinutes: Number(settingsForm.missAfter),
        conflictWindowSeconds: Number(settingsForm.conflictWindow),
        alertAckWindowMinutes: Number(settingsForm.ackWindow),
        alertRetryLimit: Number(settingsForm.retryLimit),
      }) as CareSettings;
      setSettings(saved);
      setMessage('Patient monitoring settings updated.');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const resolveConflict = async (conflictId: string) => {
    const selectedLogId = conflictSelections[conflictId];
    if (!selectedLogId) return;
    setIsSaving(true);
    try {
      await careDataService.resolveConflict(conflictId, selectedLogId);
      setMessage('Conflict resolved. Both original entries remain in the audit history.');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not resolve conflict.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="dia-workspace mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Care Logs</h1>
          <p className="mt-1 text-sm text-gray-600">Patient-scoped entries with author, role, source, and timestamp history.</p>
        </div>
        <div className="inline-flex rounded-md border border-gray-300 bg-white p-1" role="tablist" aria-label="Care log type">
          <button role="tab" aria-selected={tab === 'doses'} onClick={() => { setTab('doses'); setReview(null); }} className={`rounded px-4 py-2 text-sm font-medium ${tab === 'doses' ? 'bg-blue-700 text-white' : 'text-gray-700'}`}>Medication doses</button>
          <button role="tab" aria-selected={tab === 'glucose'} onClick={() => { setTab('glucose'); setReview(null); }} className={`rounded px-4 py-2 text-sm font-medium ${tab === 'glucose' ? 'bg-blue-700 text-white' : 'text-gray-700'}`}>Glucose readings</button>
        </div>
      </div>

      <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        DiaFit is not a medical device. It does not diagnose conditions or prescribe treatment. Follow instructions from a qualified clinician.
      </p>
      {message && <p role="status" className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-900">{message}</p>}
      {isLoading && <p className="mt-5 text-sm text-gray-500">Loading care records...</p>}

      {user?.role === 'DOCTOR' && (
        <form onSubmit={saveSettings} className="mt-6 rounded-md border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Patient-configured monitoring settings</h2>
          <p className="mt-1 text-sm text-gray-600">Enter ranges and timing windows provided by the patient’s clinician. Empty glucose limits remain unconfigured.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm text-gray-700">Glucose minimum (mg/dL)<input type="number" min="1" step="0.1" value={settingsForm.safeMin} onChange={(event) => setSettingsForm({ ...settingsForm, safeMin: event.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
            <label className="text-sm text-gray-700">Glucose maximum (mg/dL)<input type="number" min="1" step="0.1" value={settingsForm.safeMax} onChange={(event) => setSettingsForm({ ...settingsForm, safeMax: event.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
            <label className="text-sm text-gray-700">Critical minimum (mg/dL)<input type="number" min="1" step="0.1" value={settingsForm.criticalMin} onChange={(event) => setSettingsForm({ ...settingsForm, criticalMin: event.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
            <label className="text-sm text-gray-700">Critical maximum (mg/dL)<input type="number" min="1" step="0.1" value={settingsForm.criticalMax} onChange={(event) => setSettingsForm({ ...settingsForm, criticalMax: event.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
            <label className="text-sm text-gray-700">Dose grace (minutes)<input type="number" min="0" step="1" value={settingsForm.grace} onChange={(event) => setSettingsForm({ ...settingsForm, grace: event.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
            <label className="text-sm text-gray-700">Miss after (minutes)<input type="number" min="1" step="1" value={settingsForm.missAfter} onChange={(event) => setSettingsForm({ ...settingsForm, missAfter: event.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
            <label className="text-sm text-gray-700">Conflict window (seconds)<input type="number" min="0" step="1" value={settingsForm.conflictWindow} onChange={(event) => setSettingsForm({ ...settingsForm, conflictWindow: event.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
            <label className="text-sm text-gray-700">Alert acknowledgment window (minutes)<input type="number" min="1" step="1" value={settingsForm.ackWindow} onChange={(event) => setSettingsForm({ ...settingsForm, ackWindow: event.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
            <label className="text-sm text-gray-700">In-app retry limit<input type="number" min="0" max="10" step="1" value={settingsForm.retryLimit} onChange={(event) => setSettingsForm({ ...settingsForm, retryLimit: event.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
          </div>
          <button disabled={isSaving} className="mt-4 rounded bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Save settings</button>
        </form>
      )}

      {tab === 'doses' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          {(user?.role === 'PATIENT' || user?.role === 'CAREGIVER') && (
            <section className="h-fit rounded-md border border-gray-200 bg-white p-5">
              <h2 className="font-semibold text-gray-900">Schedule a dose</h2>
              {review === 'schedule' ? (
                <div className="mt-4 space-y-3 text-sm">
                  <p><span className="font-medium">Medication:</span> {scheduleForm.medicationName}</p>
                  <p><span className="font-medium">Scheduled:</span> {displayDateTime(new Date(scheduleForm.scheduledFor).toISOString())}</p>
                  <p className="text-gray-600">Confirm to save this scheduled dose.</p>
                  <div className="flex gap-2"><button disabled={isSaving} onClick={() => void confirmSchedule()} className="rounded bg-blue-700 px-4 py-2 font-semibold text-white">Confirm schedule</button><button onClick={() => setReview(null)} className="rounded border border-gray-300 px-4 py-2">Edit</button></div>
                </div>
              ) : (
                <form onSubmit={saveSchedule} className="mt-4 space-y-4">
                  <label className="block text-sm text-gray-700">Medication or dose name<input required maxLength={120} value={scheduleForm.medicationName} onChange={(event) => setScheduleForm({ ...scheduleForm, medicationName: event.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
                  <label className="block text-sm text-gray-700">Scheduled time<input required type="datetime-local" value={scheduleForm.scheduledFor} onChange={(event) => setScheduleForm({ ...scheduleForm, scheduledFor: event.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
                  <button className="rounded bg-blue-700 px-4 py-2 font-semibold text-white">Review schedule</button>
                </form>
              )}
            </section>
          )}

          <section className="rounded-md border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">Dose history</h2>
            {doses.length === 0 && <p className="mt-4 text-sm text-gray-500">No dose entries for this patient yet.</p>}
            <ul className="mt-4 divide-y divide-gray-100">
              {doses.map((dose) => (
                <li key={dose.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><p className="font-medium text-gray-900">{dose.medication_name}</p><p className="mt-1 text-sm text-gray-500">Scheduled {displayDateTime(dose.scheduled_for)}</p></div>
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${dose.conflict_state === 'OPEN' ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-700'}`}>{dose.conflict_state === 'OPEN' ? 'CONFLICT' : dose.state}</span>
                  </div>
                  {dose.logs.length > 0 && <ul className="mt-3 space-y-2 border-l-2 border-gray-200 pl-3">{dose.logs.map((log) => (
                    <li key={log.id} className="text-sm text-gray-600">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>{log.resultingState} · {log.authorRole.replaceAll('_', ' ')} · {log.source} · {displayDateTime(log.confirmedAt)}{log.kind === 'CORRECTION' ? ' · correction version' : ''}</span>
                        {user && (user.role === 'FAMILY_COORDINATOR' || log.authorId.trim() === user._id) && <button onClick={() => beginCorrection(dose.id, log)} className="text-xs font-medium text-blue-700 underline">Correct</button>}
                      </div>
                    </li>
                  ))}</ul>}
                  {correctionTarget?.occurrenceId === dose.id && (
                    <form onSubmit={(event) => { event.preventDefault(); setReview('correction'); }} className="mt-3 flex flex-wrap items-end gap-3 rounded bg-gray-50 p-3">
                      <label className="text-sm text-gray-700">Corrected time<input required type="datetime-local" value={correctionTime} onChange={(event) => setCorrectionTime(event.target.value)} className="mt-1 block rounded border border-gray-300 px-2 py-1.5" /></label>
                      {review === 'correction' ? <><span className="text-sm text-gray-600">A new version will be appended; the selected original stays unchanged.</span><button type="button" disabled={isSaving} onClick={() => void confirmCorrection()} className="rounded bg-blue-700 px-3 py-2 text-sm font-semibold text-white">Confirm correction</button></> : <button className="rounded border border-gray-300 px-3 py-2 text-sm">Review correction</button>}
                      <button type="button" onClick={() => { setCorrectionTarget(null); setReview(null); }} className="rounded border border-gray-300 px-3 py-2 text-sm">Cancel</button>
                    </form>
                  )}
                  {recordingOccurrence === dose.id && (user?.role === 'PATIENT' || user?.role === 'CAREGIVER') && (
                    <form onSubmit={reviewDoseLog} className="mt-3 flex flex-wrap items-end gap-3 rounded bg-gray-50 p-3">
                      <label className="text-sm text-gray-700">Time taken<input required type="datetime-local" value={takenAt} onChange={(event) => setTakenAt(event.target.value)} className="mt-1 block rounded border border-gray-300 px-2 py-1.5" /></label>
                      {review === 'dose' ? <><span className="text-sm text-gray-600">Save dose entry as your role?</span><button type="button" disabled={isSaving} onClick={() => void confirmDoseLog()} className="rounded bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Confirm log</button></> : <button className="rounded border border-gray-300 px-3 py-2 text-sm">Review log</button>}
                      <button type="button" onClick={() => { setRecordingOccurrence(null); setReview(null); }} className="rounded border border-gray-300 px-3 py-2 text-sm">Cancel</button>
                    </form>
                  )}
                  {(user?.role === 'PATIENT' || user?.role === 'CAREGIVER') && dose.state === 'PENDING' && dose.conflict_state !== 'OPEN' && recordingOccurrence !== dose.id && <button onClick={() => beginDoseLog(dose.id)} className="mt-3 rounded border border-blue-700 px-3 py-1.5 text-sm font-medium text-blue-700">Log dose taken</button>}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {tab === 'doses' && user?.role === 'FAMILY_COORDINATOR' && (
        <section className="mt-6 rounded-md border border-amber-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Open dose conflicts</h2>
          {conflicts.length === 0 && <p className="mt-3 text-sm text-gray-500">No open conflicts.</p>}
          <ul className="mt-3 divide-y divide-gray-100">
            {conflicts.map((conflict) => (
              <li key={conflict.id} className="py-4">
                <p className="font-medium">{conflict.medication_name} · {displayDateTime(conflict.scheduled_for)}</p>
                <div className="mt-2 space-y-2">{conflict.logs.map((log) => (
                  <label key={log.id} className="flex items-start gap-2 rounded bg-gray-50 p-3 text-sm">
                    <input type="radio" name={`conflict-${conflict.id}`} checked={conflictSelections[conflict.id] === log.id} onChange={() => setConflictSelections({ ...conflictSelections, [conflict.id]: log.id })} className="mt-1" />
                    <span>{log.resultingState} by {log.authorRole.replaceAll('_', ' ')} at {displayDateTime(log.confirmedAt)}{log.notes ? ` · ${log.notes}` : ''}</span>
                  </label>
                ))}</div>
                <button disabled={!conflictSelections[conflict.id] || isSaving} onClick={() => void resolveConflict(conflict.id)} className="mt-3 rounded bg-amber-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Confirm selected entry</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'glucose' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          {(user?.role === 'PATIENT' || user?.role === 'CAREGIVER') && (
            <section className="h-fit rounded-md border border-gray-200 bg-white p-5">
              <h2 className="font-semibold text-gray-900">Record a glucose reading</h2>
              {review === 'glucose' ? (
                <div className="mt-4 space-y-3 text-sm">
                  <p><span className="font-medium">Reading:</span> {glucoseForm.valueMgDl} mg/dL</p>
                  <p><span className="font-medium">Context:</span> {glucoseForm.context.replaceAll('_', ' ').toLowerCase()}</p>
                  <p><span className="font-medium">Measured:</span> {displayDateTime(new Date(glucoseForm.measuredAt).toISOString())}</p>
                  <div className="flex gap-2"><button disabled={isSaving} onClick={() => void confirmGlucose()} className="rounded bg-blue-700 px-4 py-2 font-semibold text-white">Confirm and save</button><button onClick={() => setReview(null)} className="rounded border border-gray-300 px-4 py-2">Edit</button></div>
                </div>
              ) : (
                <form onSubmit={reviewGlucose} className="mt-4 space-y-4">
                  <label className="block text-sm text-gray-700">Reading (mg/dL)<input required type="number" min="1" max="2000" step="0.1" value={glucoseForm.valueMgDl} onChange={(event) => setGlucoseForm({ ...glucoseForm, valueMgDl: event.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
                  <label className="block text-sm text-gray-700">Context<select value={glucoseForm.context} onChange={(event) => setGlucoseForm({ ...glucoseForm, context: event.target.value })} className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2">{['FASTING', 'BEFORE_MEAL', 'AFTER_MEAL', 'BEDTIME', 'OTHER'].map((context) => <option key={context}>{context}</option>)}</select></label>
                  <label className="block text-sm text-gray-700">Measured at<input required type="datetime-local" value={glucoseForm.measuredAt} onChange={(event) => setGlucoseForm({ ...glucoseForm, measuredAt: event.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
                  <label className="block text-sm text-gray-700">Note (optional)<input maxLength={500} value={glucoseForm.notes} onChange={(event) => setGlucoseForm({ ...glucoseForm, notes: event.target.value })} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
                  <button className="rounded bg-blue-700 px-4 py-2 font-semibold text-white">Review reading</button>
                </form>
              )}
            </section>
          )}
          <section className="rounded-md border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">Reading history</h2>
            {settings && (settings.safe_glucose_min_mg_dl == null || settings.safe_glucose_max_mg_dl == null) && <p className="mt-2 text-sm text-gray-500">Patient-specific glucose limits are not configured. DiaFit is not classifying readings.</p>}
            {readings.length === 0 && <p className="mt-4 text-sm text-gray-500">No readings for this patient yet.</p>}
            <ul className="mt-4 divide-y divide-gray-100">{readings.map((reading) => <li key={reading.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="font-semibold text-gray-900">{reading.value_mg_dl} mg/dL <span className="font-normal text-gray-500">· {reading.context.replaceAll('_', ' ').toLowerCase()}</span></span><span className="text-gray-500">{displayDateTime(reading.measured_at)} · {reading.author_role.replaceAll('_', ' ')} · {reading.source}</span></li>)}</ul>
          </section>
        </div>
      )}
    </main>
  );
}