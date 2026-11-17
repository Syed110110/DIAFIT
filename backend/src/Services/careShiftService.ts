import { postgresPool } from '../config/postgres';
import { findIdentityByEmail, hasActivePatientAccess } from './identityService';

export const listCaregiverShifts = async (patientId: string) => {
  const result = await postgresPool.query(
    `SELECT shift.id, shift.patient_id, shift.caregiver_id, member.name AS caregiver_name,
       member.email AS caregiver_email, shift.starts_at, shift.ends_at, shift.created_by, shift.cancelled_at
     FROM caregiver_shifts shift
     JOIN users member ON member.id = shift.caregiver_id
     WHERE shift.patient_id = $1 AND shift.cancelled_at IS NULL
     ORDER BY shift.starts_at DESC LIMIT 100`,
    [patientId]
  );
  return result.rows;
};

export const createCaregiverShift = async (input: {
  patientId: string;
  createdBy: string;
  caregiverEmail: string;
  startsAt: Date;
  endsAt: Date;
}) => {
  const caregiver = await findIdentityByEmail(input.caregiverEmail);
  if (!caregiver || caregiver.role !== 'CAREGIVER') {
    throw Object.assign(new Error('The email must belong to a caregiver account'), { status: 400 });
  }
  const isApproved = await hasActivePatientAccess(caregiver.id.trim(), input.patientId);
  if (!isApproved) {
    throw Object.assign(new Error('The patient must approve this caregiver before scheduling a shift'), { status: 403 });
  }
  if (input.endsAt <= input.startsAt) {
    throw Object.assign(new Error('Shift end must be after its start'), { status: 400 });
  }

  const overlap = await postgresPool.query(
    `SELECT id FROM caregiver_shifts
     WHERE patient_id = $1 AND cancelled_at IS NULL
       AND starts_at < $3 AND ends_at > $2 LIMIT 1`,
    [input.patientId, input.startsAt, input.endsAt]
  );
  if (overlap.rowCount) {
    throw Object.assign(new Error('This shift overlaps another active caregiver shift for the patient'), { status: 409 });
  }

  const result = await postgresPool.query(
    `INSERT INTO caregiver_shifts (patient_id, caregiver_id, starts_at, ends_at, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [input.patientId, caregiver.id.trim(), input.startsAt, input.endsAt, input.createdBy]
  );
  return result.rows[0];
};

export const cancelCaregiverShift = async (shiftId: string, patientId: string) => {
  const result = await postgresPool.query(
    `UPDATE caregiver_shifts SET cancelled_at = now()
     WHERE id = $1 AND patient_id = $2 AND cancelled_at IS NULL RETURNING id`,
    [shiftId, patientId]
  );
  return result.rowCount === 1;
};