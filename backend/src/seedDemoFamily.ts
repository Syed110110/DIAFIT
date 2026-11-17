import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  approvePatientAccess,
  createIdentity,
  createPatientAccessRequest,
  findIdentityByEmail,
  updateIdentityDetails,
  UserRole,
} from './Services/identityService';
import { postgresPool } from './config/postgres';
import { ensureLegacyUserMirror } from './Services/legacyUserMirror';
import { createCareAlert } from './Services/careAlertService';

const seedDemoFamily = async (): Promise<void> => {
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error('Set SEED_DEMO_PASSWORD to a value of at least 12 characters');
  }
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('Set MONGODB_URI to create tracker profiles for demo accounts');
  await mongoose.connect(mongoUri, { dbName: 'diafit' });

  const accounts: Array<{ name: string; email: string; legacyEmail: string; role: UserRole }> = [
    { name: 'Demo Patient', email: 'patient.demo@example.test', legacyEmail: 'patient.asha@example.test', role: 'PATIENT' },
    { name: 'Demo Caregiver', email: 'caregiver.demo@example.test', legacyEmail: 'caregiver.ravi@example.test', role: 'CAREGIVER' },
    { name: 'Demo Family Coordinator', email: 'coordinator.demo@example.test', legacyEmail: 'coordinator.maya@example.test', role: 'FAMILY_COORDINATOR' },
    { name: 'Demo Doctor', email: 'doctor.demo@example.test', legacyEmail: 'doctor.meera@example.test', role: 'DOCTOR' },
  ];

  const identities = new Map<string, { id: string; role: UserRole }>();
  for (const account of accounts) {
    const targetIdentity = await findIdentityByEmail(account.email);
    const legacyIdentity = await findIdentityByEmail(account.legacyEmail);
    if (targetIdentity && legacyIdentity && targetIdentity.id.trim() !== legacyIdentity.id.trim()) {
      throw new Error(`Both old and generic demo accounts exist for role ${account.role}; refusing to merge accounts automatically`);
    }
    let existing = targetIdentity || legacyIdentity;
    if (existing) {
      if (existing.role !== account.role) {
        throw new Error(`Demo email ${account.email} already has a different role`);
      }
      if (existing.name !== account.name || existing.email.toLowerCase() !== account.email.toLowerCase()) {
        existing = await updateIdentityDetails(existing.id.trim(), account.name, account.email);
      }
      await ensureLegacyUserMirror(existing);
      identities.set(account.role, { id: existing.id.trim(), role: existing.role });
      continue;
    }

    const created = await createIdentity({
      id: new mongoose.Types.ObjectId().toString(),
      name: account.name,
      email: account.email,
      passwordHash: await bcrypt.hash(password, 12),
      role: account.role,
    });
    await ensureLegacyUserMirror(created);
    identities.set(account.role, { id: created.id.trim(), role: created.role });
  }

  const patient = identities.get('PATIENT');
  const caregiver = identities.get('CAREGIVER');
  const coordinator = identities.get('FAMILY_COORDINATOR');
  const doctor = identities.get('DOCTOR');
  if (!patient || !caregiver || !coordinator || !doctor) throw new Error('Demo family could not be initialized');

  for (const role of ['CAREGIVER', 'FAMILY_COORDINATOR', 'DOCTOR'] as const) {
    const member = identities.get(role);
    if (!member) continue;
    await createPatientAccessRequest(patient.id, member.id, patient.id);
    await approvePatientAccess(patient.id, member.id);
  }

  await postgresPool.query(
    `INSERT INTO patient_care_settings (patient_id, updated_by)
     VALUES ($1, $2) ON CONFLICT (patient_id) DO NOTHING`,
    [patient.id, doctor.id]
  );

  const activeShift = await postgresPool.query(
    `SELECT id FROM caregiver_shifts
     WHERE patient_id = $1 AND caregiver_id = $2 AND cancelled_at IS NULL
       AND starts_at <= now() AND ends_at > now()
     LIMIT 1`,
    [patient.id, caregiver.id]
  );
  if (activeShift.rowCount === 0) {
    await postgresPool.query(
      `INSERT INTO caregiver_shifts (patient_id, caregiver_id, starts_at, ends_at, created_by)
       VALUES ($1, $2, now() - interval '1 minute', now() + interval '6 hours', $3)`,
      [patient.id, caregiver.id, coordinator.id]
    );
  }

  const missedDose = await postgresPool.query(
    `SELECT id FROM dose_occurrences
     WHERE patient_id = $1 AND medication_name = 'Demo missed medication'
       AND scheduled_for > now() - interval '24 hours'
     ORDER BY created_at DESC LIMIT 1`,
    [patient.id]
  );
  if (missedDose.rowCount === 0) {
    const client = await postgresPool.connect();
    try {
      await client.query('BEGIN');
      const occurrence = await client.query(
        `INSERT INTO dose_occurrences
           (patient_id, medication_name, scheduled_for, state, created_by)
         VALUES ($1, 'Demo missed medication', now() - interval '3 hours', 'MISSED', $2)
         RETURNING id`,
        [patient.id, patient.id]
      );
      await createCareAlert(client, {
        patientId: patient.id,
        kind: 'MISSED_DOSE',
        severity: 'WARNING',
        doseOccurrenceId: occurrence.rows[0].id,
        acknowledgedWindowMinutes: 10,
      });
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  const pendingDose = await postgresPool.query(
    `SELECT id FROM dose_occurrences
     WHERE patient_id = $1 AND medication_name = 'Demo evening medication'
       AND scheduled_for > now() - interval '12 hours'
       AND scheduled_for < now() + interval '12 hours'
     ORDER BY created_at DESC LIMIT 1`,
    [patient.id]
  );
  if (pendingDose.rowCount === 0) {
    await postgresPool.query(
      `INSERT INTO dose_occurrences (patient_id, medication_name, scheduled_for, created_by)
       VALUES ($1, 'Demo evening medication', now() + interval '1 hour', $2)`,
      [patient.id, caregiver.id]
    );
  }

  const conflictDose = await postgresPool.query(
    `SELECT id FROM dose_occurrences
     WHERE patient_id = $1 AND medication_name = 'Demo morning medication'
       AND scheduled_for > now() - interval '12 hours'
       AND scheduled_for < now() + interval '12 hours'
     ORDER BY created_at DESC LIMIT 1`,
    [patient.id]
  );
  if (conflictDose.rowCount === 0) {
    const created = await postgresPool.query(
      `INSERT INTO dose_occurrences
         (patient_id, medication_name, scheduled_for, created_by)
       VALUES ($1, 'Demo morning medication', now() - interval '45 minutes', $2)
       RETURNING id`,
      [patient.id, patient.id]
    );
    const occurrenceId = created.rows[0].id as string;
    const patientLog = await postgresPool.query(
      `INSERT INTO dose_logs
         (occurrence_id, patient_id, author_id, author_role, source, resulting_state, taken_at, notes, confirmed_at)
       VALUES ($1, $2, $2, 'PATIENT', 'MANUAL', 'LATE', now() - interval '40 minutes', 'Synthetic demo log', now() - interval '2 minutes')
       RETURNING id`,
      [occurrenceId, patient.id]
    );
    const caregiverLog = await postgresPool.query(
      `INSERT INTO dose_logs
         (occurrence_id, patient_id, author_id, author_role, source, resulting_state, taken_at, notes, confirmed_at)
       VALUES ($1, $2, $3, 'CAREGIVER', 'MANUAL', 'LATE', now() - interval '39 minutes', 'Synthetic demo log from caregiver', now() - interval '1 minute')
       RETURNING id`,
      [occurrenceId, patient.id, caregiver.id]
    );
    await postgresPool.query(
      `INSERT INTO dose_conflicts (occurrence_id, first_log_id, second_log_id)
       VALUES ($1, $2, $3)`,
      [occurrenceId, patientLog.rows[0].id, caregiverLog.rows[0].id]
    );
    await postgresPool.query(
      `UPDATE dose_occurrences SET state = 'LATE', conflict_state = 'OPEN', updated_at = now()
       WHERE id = $1`,
      [occurrenceId]
    );
  }

  const glucoseSeed = await postgresPool.query(
    `SELECT 1 FROM glucose_readings WHERE patient_id = $1 AND notes = 'Synthetic demo reading' LIMIT 1`,
    [patient.id]
  );
  if (glucoseSeed.rowCount === 0) {
    await postgresPool.query(
      `INSERT INTO glucose_readings
         (patient_id, author_id, author_role, source, value_mg_dl, context, measured_at, notes)
       VALUES ($1, $2, 'CAREGIVER', 'MANUAL', 121, 'FASTING', now() - interval '10 minutes', 'Synthetic demo reading')`,
      [patient.id, caregiver.id]
    );
  }

  console.log('Demo family accounts and approved patient assignments are ready.');
  console.log('Synthetic demo data includes an active caregiver shift, a pending/missed dose, one open conflict, one glucose reading, and a missed-dose alert.');
  console.log('All demo accounts use the password supplied in SEED_DEMO_PASSWORD.');
};

seedDemoFamily()
  .catch((error) => {
    console.error('Demo family seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await postgresPool.end();
    await mongoose.disconnect();
  });