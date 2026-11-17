import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { careShiftService, patientAccessService } from '../services/api';

interface PatientAssignment {
  id: string;
  name: string;
  consented_at: string;
}

interface PatientAccess {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'PENDING' | 'ACTIVE' | 'REVOKED';
  consented_at: string | null;
}

interface CaregiverShift {
  id: string;
  caregiver_id: string;
  caregiver_name: string;
  caregiver_email: string;
  starts_at: string;
  ends_at: string;
}

export default function CareTeam() {
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';
  const [assignments, setAssignments] = useState<PatientAssignment[]>([]);
  const [access, setAccess] = useState<PatientAccess[]>([]);
  const [shifts, setShifts] = useState<CaregiverShift[]>([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [caregiverEmail, setCaregiverEmail] = useState('');
  const [shiftStartsAt, setShiftStartsAt] = useState('');
  const [shiftEndsAt, setShiftEndsAt] = useState('');
  const [isReviewingShift, setIsReviewingShift] = useState(false);
  const [isSavingShift, setIsSavingShift] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(user?._id || '');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setMessage('');
    try {
      if (isPatient && user?._id) {
        setSelectedPatientId(user._id);
        const [rows, shiftRows] = await Promise.all([
          patientAccessService.getPatientAccess(user._id),
          careShiftService.getShifts(),
        ]) as [PatientAccess[], CaregiverShift[]];
        setAccess(rows);
        setShifts(shiftRows);
      } else {
        const rows = await patientAccessService.getAssignments() as PatientAssignment[];
        setAssignments(rows);
        const preferredPatientId = localStorage.getItem('patientId');
        const selected = rows.find((row) => row.id.trim() === preferredPatientId)?.id.trim() || rows[0]?.id.trim() || '';
        setSelectedPatientId(selected);
        if (selected) {
          localStorage.setItem('patientId', selected);
          setShifts(await careShiftService.getShifts() as CaregiverShift[]);
        } else {
          setShifts([]);
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load care-team access.');
    } finally {
      setIsLoading(false);
    }
  }, [isPatient, user?._id]);

  useEffect(() => { void load(); }, [load]);

  const requestAccess = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?._id) return;
    setMessage('');
    try {
      await patientAccessService.requestAccess(user._id, memberEmail);
      setMemberEmail('');
      await load();
      setMessage('Request submitted. It remains pending until you approve it below.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create access request.');
    }
  };

  const approve = async (memberId: string) => {
    if (!user?._id) return;
    try {
      await patientAccessService.approveAccess(user._id, memberId.trim());
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not approve access.');
    }
  };

  const revoke = async (memberId: string) => {
    if (!user?._id) return;
    try {
      await patientAccessService.revokeAccess(user._id, memberId.trim());
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not revoke access.');
    }
  };

  const selectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    localStorage.setItem('patientId', patientId);
    setMessage('Patient selected. Open Dashboard or a tracker to view this patient’s data.');
    void load();
  };

  const createShift = async () => {
    setIsSavingShift(true);
    try {
      await careShiftService.createShift({
        caregiverEmail,
        startsAt: new Date(shiftStartsAt).toISOString(),
        endsAt: new Date(shiftEndsAt).toISOString(),
        confirmed: true,
      });
      setCaregiverEmail('');
      setShiftStartsAt('');
      setShiftEndsAt('');
      setIsReviewingShift(false);
      setMessage('Caregiver shift scheduled. Alerts during this time will route to this caregiver.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not schedule caregiver shift.');
    } finally {
      setIsSavingShift(false);
    }
  };

  const cancelShift = async (shiftId: string) => {
    try {
      await careShiftService.cancelShift(shiftId);
      setMessage('Caregiver shift cancelled.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not cancel caregiver shift.');
    }
  };

  return (
    <main className="dia-workspace mx-auto min-h-screen max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Care Team Access</h1>
      <p className="mt-2 text-sm text-gray-600">Patient approval is required before a care-team member can view clinical records.</p>

      {isPatient && (
        <form onSubmit={requestAccess} className="mt-8 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5 sm:flex-row">
          <input required type="email" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="Care-team member email" className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2" />
          <button className="rounded bg-blue-700 px-4 py-2 font-semibold text-white">Request access</button>
        </form>
      )}

      {!isPatient && (
        <section className="mt-8 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Approved patient assignments</h2>
          {assignments.length === 0 && !isLoading && <p className="mt-3 text-sm text-gray-600">No patient has approved access for this account yet.</p>}
          <ul className="mt-3 divide-y divide-gray-100">
            {assignments.map((patient) => (
              <li key={patient.id.trim()} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="font-medium text-gray-800">{patient.name}</span>
                <button onClick={() => selectPatient(patient.id.trim())} className="rounded border border-blue-700 px-3 py-1.5 text-sm font-medium text-blue-700">
                  {selectedPatientId === patient.id.trim() ? 'Selected' : 'Select patient'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isPatient && (
        <section className="mt-8 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Access requests and members</h2>
          {access.length === 0 && !isLoading && <p className="mt-3 text-sm text-gray-600">No care-team requests yet.</p>}
          <ul className="mt-3 divide-y divide-gray-100">
            {access.map((member) => (
              <li key={member.id.trim()} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-gray-800">{member.name} <span className="font-normal text-gray-500">({member.role.replaceAll('_', ' ')})</span></p>
                  <p className="text-sm text-gray-500">{member.email} · {member.status.toLowerCase()}</p>
                </div>
                {member.status === 'PENDING' && <button onClick={() => void approve(member.id)} className="rounded bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white">Approve</button>}
                {member.status === 'ACTIVE' && <button onClick={() => void revoke(member.id)} className="rounded border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700">Revoke</button>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {selectedPatientId && (
        <section className="mt-8 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Caregiver on-duty roster</h2>
          <p className="mt-1 text-sm text-gray-600">Only patient-approved caregiver accounts can be scheduled. Overlapping active shifts are rejected.</p>
          {(isPatient || user?.role === 'FAMILY_COORDINATOR') && (isReviewingShift ? (
            <div className="mt-4 rounded bg-gray-50 p-4 text-sm">
              <p>Schedule <strong>{caregiverEmail}</strong> from {new Date(shiftStartsAt).toLocaleString()} to {new Date(shiftEndsAt).toLocaleString()}?</p>
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={isSavingShift} onClick={() => void createShift()} className="rounded bg-blue-700 px-3 py-2 font-semibold text-white">Confirm shift</button>
                <button type="button" onClick={() => setIsReviewingShift(false)} className="rounded border border-gray-300 px-3 py-2">Edit</button>
              </div>
            </div>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); setIsReviewingShift(true); }} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input required type="email" value={caregiverEmail} onChange={(event) => setCaregiverEmail(event.target.value)} placeholder="Approved caregiver email" className="rounded border border-gray-300 px-3 py-2" />
              <label className="text-xs text-gray-600">Shift starts<input required type="datetime-local" value={shiftStartsAt} onChange={(event) => setShiftStartsAt(event.target.value)} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></label>
              <label className="text-xs text-gray-600">Shift ends<input required type="datetime-local" value={shiftEndsAt} onChange={(event) => setShiftEndsAt(event.target.value)} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm" /></label>
              <button className="self-end rounded bg-blue-700 px-3 py-2 font-semibold text-white">Review shift</button>
            </form>
          ))}
          {shifts.length === 0 && !isLoading && <p className="mt-4 text-sm text-gray-500">No caregiver shifts scheduled.</p>}
          <ul className="mt-3 divide-y divide-gray-100">
            {shifts.map((shift) => (
              <li key={shift.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span><strong>{shift.caregiver_name}</strong> · {shift.caregiver_email} · {new Date(shift.starts_at).toLocaleString()} – {new Date(shift.ends_at).toLocaleString()}</span>
                {(isPatient || user?.role === 'FAMILY_COORDINATOR') && <button onClick={() => void cancelShift(shift.id)} className="rounded border border-red-300 px-3 py-1.5 font-medium text-red-700">Cancel</button>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {isLoading && <p className="mt-5 text-sm text-gray-500">Loading care-team access...</p>}
      {message && <p role="status" className="mt-5 text-sm text-gray-700">{message}</p>}
    </main>
  );
}