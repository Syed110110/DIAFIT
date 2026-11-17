import { QueryResultRow } from 'pg';
import { postgresPool } from '../config/postgres';
import { UserRole } from '../types/roles';

export { userRoles } from '../types/roles';
export type { UserRole } from '../types/roles';

export interface Identity extends QueryResultRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
}

export const findIdentityByEmail = async (email: string): Promise<Identity | undefined> => {
  const result = await postgresPool.query<Identity>(
    'SELECT id, name, email, password_hash, role, is_active FROM users WHERE lower(email) = lower($1)',
    [email.trim()]
  );
  return result.rows[0];
};

export const findIdentityById = async (id: string): Promise<Identity | undefined> => {
  const result = await postgresPool.query<Identity>(
    'SELECT id, name, email, password_hash, role, is_active FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

export const createIdentity = async (input: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}): Promise<Identity> => {
  const result = await postgresPool.query<Identity>(
    `INSERT INTO users (id, name, email, password_hash, role)
     VALUES ($1, $2, lower($3), $4, $5)
     RETURNING id, name, email, password_hash, role, is_active`,
    [input.id, input.name.trim(), input.email.trim(), input.passwordHash, input.role]
  );
  return result.rows[0];
};

export const updateIdentityDetails = async (
  id: string,
  name: string,
  email: string
): Promise<Identity> => {
  const result = await postgresPool.query<Identity>(
    `UPDATE users SET name = $2, email = lower($3), updated_at = now()
     WHERE id = $1
     RETURNING id, name, email, password_hash, role, is_active`,
    [id, name.trim(), email.trim()]
  );
  if (!result.rowCount) throw new Error('Demo identity not found for rename');
  return result.rows[0];
};

export const hasActivePatientAccess = async (
  memberId: string,
  patientId: string
): Promise<boolean> => {
  const result = await postgresPool.query(
    `SELECT 1 FROM patient_access
     WHERE member_id = $1 AND patient_id = $2
       AND status = 'ACTIVE' AND consented_at IS NOT NULL`,
    [memberId, patientId]
  );
  return result.rowCount === 1;
};

export const createPatientAccessRequest = async (
  patientId: string,
  memberId: string,
  requestedBy: string
): Promise<void> => {
  await postgresPool.query(
    `INSERT INTO patient_access (patient_id, member_id, requested_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (patient_id, member_id)
     DO UPDATE SET status = 'PENDING', consented_at = NULL,
                   requested_by = EXCLUDED.requested_by, updated_at = now()
     WHERE patient_access.status = 'REVOKED'`,
    [patientId, memberId, requestedBy]
  );
};

export const approvePatientAccess = async (
  patientId: string,
  memberId: string
): Promise<boolean> => {
  const result = await postgresPool.query(
    `UPDATE patient_access SET status = 'ACTIVE', consented_at = now(), updated_at = now()
     WHERE patient_id = $1 AND member_id = $2 AND status = 'PENDING'`,
    [patientId, memberId]
  );
  return result.rowCount === 1;
};

export const listPatientAccess = async (patientId: string) => {
  const result = await postgresPool.query(
    `SELECT u.id, u.name, u.email, u.role, pa.status, pa.consented_at
     FROM patient_access pa
     JOIN users u ON u.id = pa.member_id
     WHERE pa.patient_id = $1
     ORDER BY pa.created_at`,
    [patientId]
  );
  return result.rows;
};

export const revokePatientAccess = async (
  patientId: string,
  memberId: string
): Promise<boolean> => {
  const result = await postgresPool.query(
    `UPDATE patient_access SET status = 'REVOKED', consented_at = NULL, updated_at = now()
     WHERE patient_id = $1 AND member_id = $2 AND status = 'ACTIVE'`,
    [patientId, memberId]
  );
  return result.rowCount === 1;
};

export const listMemberPatients = async (memberId: string) => {
  const result = await postgresPool.query(
    `SELECT u.id, u.name, pa.consented_at
     FROM patient_access pa
     JOIN users u ON u.id = pa.patient_id
     WHERE pa.member_id = $1 AND pa.status = 'ACTIVE' AND pa.consented_at IS NOT NULL
     ORDER BY u.name`,
    [memberId]
  );
  return result.rows;
};