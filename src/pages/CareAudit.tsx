import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

interface AuditEvent {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: 'READ' | 'WRITE';
  method: string;
  route: string;
  response_status: number;
  request_id: string;
  created_at: string;
}

export default function CareAudit() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setMessage('');
    try {
      setEvents(await api.get('/care/audit') as AuditEvent[]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load patient audit history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  return (
    <main className="dia-workspace mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Audit History</h1>
          <p className="mt-1 text-sm text-gray-600">Patient-scoped API reads and writes, including actor, role, time, route, and response result.</p>
        </div>
        <button onClick={() => void loadEvents()} disabled={isLoading} className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700">Refresh</button>
      </header>

      <p className="mt-5 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        Request bodies and clinical values are intentionally excluded from this history.
      </p>
      {message && <p role="status" className="mt-4 rounded bg-blue-50 p-3 text-sm text-blue-900">{message}</p>}
      {isLoading && <p className="mt-4 text-sm text-gray-500">Loading audit events...</p>}

      <div className="mt-6 overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-4 py-3">Request ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">{new Date(event.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-800">{event.actor_role?.replaceAll('_', ' ') || 'Unauthenticated'}<span className="block text-xs text-gray-500">{event.actor_id?.trim() || 'No actor ID'}</span></td>
                <td className="px-4 py-3 font-medium text-gray-800">{event.action} · {event.method}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{event.route}</td>
                <td className="px-4 py-3"><span className={`rounded px-2 py-1 text-xs font-semibold ${event.response_status < 400 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{event.response_status}</span></td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{event.request_id}</td>
              </tr>
            ))}
            {!isLoading && events.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No audit events have been recorded for this patient yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}