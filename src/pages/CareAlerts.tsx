import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { careAlertService } from '../services/api';

interface CareAlert {
  id: string;
  kind: 'GLUCOSE_OUT_OF_RANGE' | 'MISSED_DOSE' | 'SOS';
  severity: 'WARNING' | 'CRITICAL';
  state: 'OPEN' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED';
  assigned_caregiver_id: string | null;
  escalated_coordinator_id: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
  medication_name?: string | null;
  value_mg_dl?: string | null;
  glucose_context?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
}

interface InboxItem {
  notification_id: string;
  delivery_state: 'PENDING' | 'DELIVERED' | 'FAILED';
  attempt_count: number;
  delivered_at: string | null;
  alert_id: string;
  kind: CareAlert['kind'];
  severity: CareAlert['severity'];
  alert_state: CareAlert['state'];
  created_at: string;
}

interface WhatsAppPreference {
  whatsapp_number: string | null;
  whatsapp_opt_in: boolean;
}

const alertLabel = (kind: CareAlert['kind']) =>
  ({
    GLUCOSE_OUT_OF_RANGE: 'Glucose outside configured patient range',
    MISSED_DOSE: 'Missed scheduled dose',
    SOS: 'Manual SOS',
  }[kind]);

export default function CareAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<CareAlert[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [isSavingWhatsApp, setIsSavingWhatsApp] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const [alertRows, inboxRows, preference] = await Promise.all([
        careAlertService.getAlerts(),
        careAlertService.getInbox(),
        careAlertService.getWhatsAppPreference(),
      ]);
      setAlerts(alertRows as unknown as CareAlert[]);
      setInbox(inboxRows as unknown as InboxItem[]);
      const savedPreference = preference as unknown as WhatsAppPreference;
      setWhatsappNumber(savedPreference.whatsapp_number || '');
      setWhatsappOptIn(savedPreference.whatsapp_opt_in);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load patient alerts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const acknowledge = async (alertId: string) => {
    setAcknowledgingId(alertId);
    try {
      await careAlertService.acknowledge(alertId);
      setMessage('Alert acknowledged and recorded.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not acknowledge alert.');
    } finally {
      setAcknowledgingId(null);
    }
  };

  const canAcknowledge = (alert: CareAlert) =>
    (user?.role === 'CAREGIVER' && alert.assigned_caregiver_id?.trim() === user._id) ||
    (user?.role === 'FAMILY_COORDINATOR' && alert.escalated_coordinator_id?.trim() === user._id);

  const saveWhatsAppPreference = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingWhatsApp(true);
    try {
      await careAlertService.saveWhatsAppPreference({ whatsappNumber, whatsappOptIn });
      setMessage(
        whatsappOptIn
          ? 'WhatsApp opt-in saved. Delivery also requires the backend Twilio feature flag and valid provider configuration.'
          : 'WhatsApp opt-in removed. Alerts will stay in the in-app inbox.'
      );
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save WhatsApp preference.');
    } finally {
      setIsSavingWhatsApp(false);
    }
  };

  return (
    <main className="dia-workspace mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts &amp; Notifications</h1>
          <p className="mt-1 text-sm text-gray-600">Patient-scoped in-app notices and recorded acknowledgments.</p>
        </div>
        <button
          onClick={() => void load()}
          disabled={isLoading}
          className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
        >
          Refresh
        </button>
      </header>

      <p className="mt-5 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        DiaFit is not a medical device. Alerts reflect configured tracking rules and are not diagnosis or treatment advice. For emergencies, contact local emergency services.
      </p>
      {message && <p role="status" className="mt-4 rounded bg-blue-50 p-3 text-sm text-blue-900">{message}</p>}
      {isLoading && <p className="mt-4 text-sm text-gray-500">Loading alerts...</p>}

      {user && user.role !== 'ADMIN' && (
        <form
          onSubmit={saveWhatsAppPreference}
          className="mt-6 grid gap-3 rounded-md border border-gray-200 bg-white p-5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end"
        >
          <label className="text-sm font-medium text-gray-700">
            WhatsApp number (E.164, e.g. +14155550123)
            <input
              type="tel"
              value={whatsappNumber}
              onChange={(event) => setWhatsappNumber(event.target.value)}
              placeholder="+countrycode and number"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={whatsappOptIn}
              onChange={(event) => setWhatsappOptIn(event.target.checked)}
            />
            I agree to receive DiaFit care alerts on WhatsApp
          </label>
          <button
            disabled={isSavingWhatsApp}
            className="rounded bg-[var(--dia-green)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSavingWhatsApp ? 'Saving...' : 'Save preference'}
          </button>
        </form>
      )}

      <section className="mt-6 rounded-md border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Patient alert history</h2>
        {alerts.length === 0 && !isLoading && (
          <p className="mt-3 text-sm text-gray-600">
            No alerts for the selected patient. Glucose alerting requires clinician-configured ranges.
          </p>
        )}
        <ul className="mt-3 divide-y divide-gray-100">
          {alerts.map((alert) => (
            <li key={alert.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium text-gray-900">
                  {alertLabel(alert.kind)}
                  <span
                    className={`ml-2 rounded px-2 py-0.5 text-xs ${
                      alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {alert.severity}
                  </span>
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {alert.kind === 'MISSED_DOSE' && alert.medication_name ? `${alert.medication_name} · ` : ''}
                  {alert.kind === 'GLUCOSE_OUT_OF_RANGE' && alert.value_mg_dl ? `${alert.value_mg_dl} mg/dL · ` : ''}
                  {alert.kind === 'SOS' && alert.latitude != null && alert.longitude != null ? (
                    <a
                      href={`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 underline hover:text-blue-800"
                    >
                      View GPS Location ·{' '}
                    </a>
                  ) : ''}
                  {new Date(alert.created_at).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Status: {alert.state.replace(/_/g, ' ').toLowerCase()}
                  {alert.acknowledged_at ? ` · acknowledged ${new Date(alert.acknowledged_at).toLocaleString()}` : ''}
                </p>
              </div>
              {canAcknowledge(alert) && (alert.state === 'OPEN' || alert.state === 'ESCALATED') && (
                <button
                  disabled={acknowledgingId === alert.id}
                  onClick={() => void acknowledge(alert.id)}
                  className="rounded bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {acknowledgingId === alert.id ? 'Saving...' : 'Acknowledge'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-md border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">My in-app inbox</h2>
        {inbox.length === 0 && !isLoading && (
          <p className="mt-3 text-sm text-gray-600">No notifications for this account.</p>
        )}
        <ul className="mt-3 divide-y divide-gray-100">
          {inbox.map((item) => (
            <li key={item.notification_id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span>{alertLabel(item.kind)} · {item.severity} · {item.alert_state.toLowerCase()}</span>
              <span className="text-gray-500">
                {item.delivery_state.toLowerCase()} · {new Date(item.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}