import { PoolClient } from 'pg';
import twilio from 'twilio';
import { postgresPool } from '../config/postgres';
import { shouldEscalateAlert } from '../domain/glucoseAlertPolicy';

type AlertKind = 'GLUCOSE_OUT_OF_RANGE' | 'MISSED_DOSE' | 'SOS';
type AlertSeverity = 'WARNING' | 'CRITICAL';

interface AlertInput {
  patientId: string;
  kind: AlertKind;
  severity: AlertSeverity;
  glucoseReadingId?: string;
  doseOccurrenceId?: string;
  acknowledgedWindowMinutes: number;
  immediateEscalation?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

const findOnDutyCaregiver = async (client: PoolClient, patientId: string, now: Date) => {
  const result = await client.query(
    "SELECT shift.caregiver_id " +
    "     FROM caregiver_shifts shift " +
    "     JOIN users caregiver ON caregiver.id = shift.caregiver_id AND caregiver.role = 'CAREGIVER' " +
    "     JOIN patient_access access ON access.patient_id = shift.patient_id " +
    "       AND access.member_id = shift.caregiver_id " +
    "       AND access.status = 'ACTIVE' AND access.consented_at IS NOT NULL " +
    "     WHERE shift.patient_id = $1 AND shift.cancelled_at IS NULL " +
    "       AND shift.starts_at <= $2 AND shift.ends_at > $2 " +
    "     ORDER BY shift.starts_at DESC " +
    "     LIMIT 1",
    [patientId, now]
  );
  return result.rows[0]?.caregiver_id?.trim() as string | undefined;
};

const findFamilyCoordinator = async (client: PoolClient, patientId: string) => {
  const result = await client.query(
    "SELECT access.member_id " +
    "     FROM patient_access access " +
    "     JOIN users member ON member.id = access.member_id AND member.role = 'FAMILY_COORDINATOR' " +
    "     WHERE access.patient_id = $1 AND access.status = 'ACTIVE' AND access.consented_at IS NOT NULL " +
    "     ORDER BY access.consented_at " +
    "     LIMIT 1",
    [patientId]
  );
  return result.rows[0]?.member_id?.trim() as string | undefined;
};

const queueRecipientNotices = async (client: PoolClient, alertId: string, recipientId: string) => {
  await client.query(
    "INSERT INTO alert_notifications (alert_id, recipient_id, channel, state, next_attempt_at) " +
    "     VALUES ($1, $2, 'IN_APP', 'PENDING', now())",
    [alertId, recipientId]
  );

  if (process.env.ENABLE_WHATSAPP_ALERTS !== 'true') return;
  const preference = await client.query(
    "SELECT whatsapp_number FROM users WHERE id = $1 AND whatsapp_opt_in = true",
    [recipientId]
  );
  if (!preference.rowCount || !preference.rows[0].whatsapp_number) return;
  await client.query(
    "INSERT INTO alert_notifications (alert_id, recipient_id, channel, state, next_attempt_at) " +
    "     VALUES ($1, $2, 'WHATSAPP', 'PENDING', now())",
    [alertId, recipientId]
  );
};

export const createCareAlert = async (client: PoolClient, input: AlertInput) => {
  const now = new Date();
  const caregiverId = await findOnDutyCaregiver(client, input.patientId, now);
  const escalateImmediately = Boolean(input.immediateEscalation || !caregiverId);
  const coordinatorId = escalateImmediately
    ? await findFamilyCoordinator(client, input.patientId)
    : undefined;
  const state = escalateImmediately ? 'ESCALATED' : 'OPEN';
  const ackDueAt = new Date(now.getTime() + input.acknowledgedWindowMinutes * 60_000);

  const inserted = await client.query(
    "INSERT INTO care_alerts " +
    "       (patient_id, kind, severity, state, glucose_reading_id, dose_occurrence_id, " +
    "        assigned_caregiver_id, escalated_coordinator_id, ack_due_at, next_retry_at, " +
    "        latitude, longitude, created_at, updated_at) " +
    "     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), $10, $11, now(), now()) " +
    "     RETURNING *",
    [input.patientId, input.kind, input.severity, state, input.glucoseReadingId || null,
      input.doseOccurrenceId || null, caregiverId || null, coordinatorId || null,
      ackDueAt, input.latitude ?? null, input.longitude ?? null]
  );
  const alert = inserted.rows[0];

  if (caregiverId) await queueRecipientNotices(client, alert.id, caregiverId);
  if (coordinatorId && coordinatorId !== caregiverId) {
    await queueRecipientNotices(client, alert.id, coordinatorId);
  }
  return alert;
};

export const listPatientAlerts = async (patientId: string) => {
  const result = await postgresPool.query(
    "SELECT alert.*, dose.medication_name, " +
    "       reading.value_mg_dl, reading.context AS glucose_context " +
    "     FROM care_alerts alert " +
    "     LEFT JOIN dose_occurrences dose ON dose.id = alert.dose_occurrence_id " +
    "     LEFT JOIN glucose_readings reading ON reading.id = alert.glucose_reading_id " +
    "     WHERE alert.patient_id = $1 ORDER BY alert.created_at DESC LIMIT 100",
    [patientId]
  );
  return result.rows;
};

export const listPatientAlertNotifications = async (patientId: string, recipientId: string) => {
  const result = await postgresPool.query(
    "SELECT notification.id AS notification_id, notification.state AS delivery_state, " +
    "       notification.attempt_count, notification.delivered_at, alert.id AS alert_id, " +
    "       alert.kind, alert.severity, alert.state AS alert_state, alert.created_at " +
    "     FROM alert_notifications notification " +
    "     JOIN care_alerts alert ON alert.id = notification.alert_id " +
    "     WHERE alert.patient_id = $1 AND notification.recipient_id = $2 " +
    "     ORDER BY notification.created_at DESC LIMIT 100",
    [patientId, recipientId]
  );
  return result.rows;
};

export const getWhatsAppPreference = async (userId: string) => {
  const result = await postgresPool.query(
    'SELECT whatsapp_number, whatsapp_opt_in FROM users WHERE id = $1 AND is_active = true',
    [userId]
  );
  return result.rows[0];
};

export const updateWhatsAppPreference = async (
  userId: string,
  whatsappNumber: string | null,
  whatsappOptIn: boolean
) => {
  const result = await postgresPool.query(
    "UPDATE users SET whatsapp_number = $2, whatsapp_opt_in = $3, updated_at = now() " +
    "     WHERE id = $1 AND is_active = true " +
    "     RETURNING whatsapp_number, whatsapp_opt_in",
    [userId, whatsappNumber, whatsappOptIn]
  );
  return result.rows[0];
};

export const acknowledgeCareAlert = async (
  alertId: string,
  patientId: string,
  actorId: string
): Promise<boolean> => {
  const result = await postgresPool.query(
    "UPDATE care_alerts " +
    "     SET state = 'ACKNOWLEDGED', acknowledged_by = $3, acknowledged_at = now(), " +
    "         resolved_at = now(), updated_at = now() " +
    "     WHERE id = $1 AND patient_id = $2 AND state IN ('OPEN', 'ESCALATED') " +
    "       AND (assigned_caregiver_id = $3 OR escalated_coordinator_id = $3) " +
    "     RETURNING id",
    [alertId, patientId, actorId]
  );
  return result.rowCount === 1;
};

export const triggerSosAlert = async (input: AlertInput) => {
  let alert: any;
  const client = await postgresPool.connect();
  try {
    await client.query('BEGIN');
    const settings = await client.query(
      'SELECT alert_ack_window_minutes FROM patient_care_settings WHERE patient_id = $1',
      [input.patientId]
    );
    alert = await createCareAlert(client, {
      ...input,
      kind: 'SOS',
      severity: 'CRITICAL',
      immediateEscalation: true,
      acknowledgedWindowMinutes: Number(settings.rows[0]?.alert_ack_window_minutes || 10),
    });
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  try {
    await processAlertQueue();
  } catch (queueError) {
    console.error('Error processing alert queue after SOS:', queueError);
  }

  const delivery = await postgresPool.query(
    'SELECT channel, state FROM alert_notifications WHERE alert_id = $1',
    [alert.id]
  );
  const whatsappStates = delivery.rows.filter((row) => row.channel === 'WHATSAPP').map((row) => row.state);
  const recipientCount = delivery.rows.filter((row) => row.channel === 'IN_APP').length;
  let whatsappDelivery = 'IN_APP_ONLY';
  if (whatsappStates.includes('DELIVERED')) whatsappDelivery = 'DELIVERED';
  else if (whatsappStates.length > 0) whatsappDelivery = 'FAILED';
  return { ...alert, whatsappDelivery, recipientCount };
};

export const processAlertQueue = async (): Promise<{ delivered: number; escalated: number; missedAlerts: number }> => {
  let delivered = 0;
  let escalated = 0;
  let missedAlerts = 0;

  const missed = await postgresPool.query(
    "SELECT dose.id, dose.patient_id, COALESCE(settings.alert_ack_window_minutes, 10) AS ack_window " +
    "     FROM dose_occurrences dose " +
    "     LEFT JOIN patient_care_settings settings ON settings.patient_id = dose.patient_id " +
    "     LEFT JOIN care_alerts alert ON alert.dose_occurrence_id = dose.id AND alert.kind = 'MISSED_DOSE' " +
    "     WHERE dose.state = 'MISSED' AND alert.id IS NULL " +
    "     LIMIT 100"
  );
  for (const dose of missed.rows) {
    const client = await postgresPool.connect();
    try {
      await client.query('BEGIN');
      await createCareAlert(client, {
        patientId: dose.patient_id.trim(),
        kind: 'MISSED_DOSE',
        severity: 'WARNING',
        doseOccurrenceId: dose.id,
        acknowledgedWindowMinutes: Number(dose.ack_window),
      });
      await client.query('COMMIT');
      missedAlerts += 1;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Could not create missed-dose alert:', error);
    } finally {
      client.release();
    }
  }

  const pending = await postgresPool.query(
    "SELECT notification.id, notification.alert_id, notification.recipient_id, notification.channel, " +
    "       notification.attempt_count, recipient.whatsapp_number, " +
    "       COALESCE(settings.alert_retry_limit, 3) AS retry_limit " +
    "     FROM alert_notifications notification " +
    "     JOIN care_alerts alert ON alert.id = notification.alert_id " +
    "     JOIN users recipient ON recipient.id = notification.recipient_id " +
    "     LEFT JOIN patient_care_settings settings ON settings.patient_id = alert.patient_id " +
    "     WHERE notification.state IN ('PENDING', 'FAILED') AND notification.next_attempt_at <= now() " +
    "       AND notification.attempt_count < COALESCE(settings.alert_retry_limit, 3) + 1 " +
    "     ORDER BY notification.created_at " +
    "     LIMIT 100"
  );
  for (const notification of pending.rows) {
    const client = await postgresPool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query(
        "SELECT id, attempt_count FROM alert_notifications WHERE id = $1 AND state IN ('PENDING', 'FAILED') FOR UPDATE",
        [notification.id]
      );
      if (!current.rowCount) {
        await client.query('ROLLBACK');
        continue;
      }
      const attemptNumber = Number(current.rows[0].attempt_count) + 1;
      let outcome: 'DELIVERED' | 'FAILED' = 'DELIVERED';
      let detail = notification.channel === 'WHATSAPP' ? 'WhatsApp delivery confirmed' : 'In-app inbox delivery';
      let lastError: string | null = null;

      if (notification.channel === 'WHATSAPP') {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const configuredFrom = process.env.TWILIO_WHATSAPP_NUMBER;
        if (!accountSid || !authToken || !configuredFrom || !notification.whatsapp_number) {
          outcome = 'FAILED';
          detail = 'WhatsApp delivery is not fully configured';
          lastError = detail;
        } else {
          try {
            const twilioClient = twilio(accountSid, authToken);
            const from = configuredFrom.startsWith('whatsapp:') ? configuredFrom : 'whatsapp:' + configuredFrom;
            const to = notification.whatsapp_number.startsWith('whatsapp:')
              ? notification.whatsapp_number
              : 'whatsapp:' + notification.whatsapp_number;
            const alertInfo = await client.query(
              'SELECT alert.kind, alert.severity, alert.latitude, alert.longitude, patient.name AS patient_name ' +
              'FROM care_alerts alert JOIN users patient ON patient.id = alert.patient_id WHERE alert.id = $1',
              [notification.alert_id]
            );
            const alert = alertInfo.rows[0];
            let messageBody = 'DiaFit ' + String(alert?.severity || 'WARNING').toLowerCase() + ' alert: ' +
              String(alert?.kind || 'CARE_EVENT').replace(/_/g, ' ').toLowerCase() +
              '. Open DiaFit to review. This is not a diagnosis. For emergencies, contact local emergency services.';
            if (alert?.kind === 'SOS') {
              messageBody = 'DiaFit EMERGENCY SOS from ' + String(alert.patient_name || 'your patient') +
                '. Please contact them immediately. ' +
                (alert.latitude != null && alert.longitude != null
                  ? 'Location: https://maps.google.com/?q=' + Number(alert.latitude) + ',' + Number(alert.longitude)
                  : 'Location was not shared.');
            }
            await twilioClient.messages.create({
              from,
              to,
              body: messageBody,
            });
          } catch (error) {
            outcome = 'FAILED';
            detail = 'WhatsApp provider rejected or could not deliver the message';
            lastError = error instanceof Error ? error.name : 'Provider error';
            console.error('WhatsApp delivery failed for notification:', notification.id);
          }
        }
      }

      const retryMinutes = Math.min(60, 2 ** Math.max(0, attemptNumber - 1));
      await client.query(
        "UPDATE alert_notifications SET state = $2::in_app_delivery_state, attempt_count = $3, " +
        "         delivered_at = CASE WHEN $2::in_app_delivery_state = 'DELIVERED' THEN now() ELSE delivered_at END, " +
        "         last_error = $4, " +
        "         next_attempt_at = CASE WHEN $2::in_app_delivery_state = 'FAILED' THEN now() + make_interval(mins => $5) ELSE next_attempt_at END " +
        "         WHERE id = $1",
        [notification.id, outcome, attemptNumber, lastError, retryMinutes]
      );
      await client.query(
        "INSERT INTO alert_delivery_attempts (notification_id, attempt_number, outcome, detail) " +
        "         VALUES ($1, $2, $3, $4)",
        [notification.id, attemptNumber, outcome, detail]
      );
      await client.query('COMMIT');
      if (outcome === 'DELIVERED') delivered += 1;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('In-app alert delivery failed:', error);
    } finally {
      client.release();
    }
  }

  const overdue = await postgresPool.query(
    "SELECT id, patient_id, kind, state, ack_due_at " +
    "     FROM care_alerts WHERE state = 'OPEN' AND ack_due_at <= now() " +
    "     ORDER BY ack_due_at LIMIT 100"
  );
  for (const alert of overdue.rows) {
    if (!shouldEscalateAlert({ kind: alert.kind, state: alert.state, ackDueAt: alert.ack_due_at, now: new Date() })) continue;
    const coordinatorId = await findFamilyCoordinatorForPatient(alert.patient_id.trim());
    if (!coordinatorId) {
      await postgresPool.query(
        "UPDATE care_alerts SET ack_due_at = now() + interval '1 minute', updated_at = now() " +
        "         WHERE id = $1 AND state = 'OPEN'",
        [alert.id]
      );
      continue;
    }
    const updated = await postgresPool.query(
      "UPDATE care_alerts SET state = 'ESCALATED', escalated_coordinator_id = $2, " +
      "       retry_count = retry_count + 1, ack_due_at = now() + interval '10 minutes', " +
      "       next_retry_at = now() + interval '1 minute', updated_at = now() " +
      "       WHERE id = $1 AND state = 'OPEN' RETURNING id",
      [alert.id, coordinatorId || null]
    );
    if (updated.rowCount && coordinatorId) {
      await postgresPool.query(
        "INSERT INTO alert_notifications (alert_id, recipient_id, state, next_attempt_at) " +
        "         VALUES ($1, $2, 'PENDING', now())",
        [alert.id, coordinatorId]
      );
    }
    escalated += updated.rowCount || 0;
  }

  return { delivered, escalated, missedAlerts };
};

const findFamilyCoordinatorForPatient = async (patientId: string): Promise<string | undefined> => {
  const result = await postgresPool.query(
    "SELECT access.member_id FROM patient_access access " +
    "     JOIN users member ON member.id = access.member_id AND member.role = 'FAMILY_COORDINATOR' " +
    "     WHERE access.patient_id = $1 AND access.status = 'ACTIVE' AND access.consented_at IS NOT NULL " +
    "     ORDER BY access.consented_at LIMIT 1",
    [patientId]
  );
  return result.rows[0]?.member_id?.trim();
};