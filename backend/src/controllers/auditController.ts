import { Request, Response } from 'express';
import { postgresPool } from '../config/postgres';

export const getPatientAuditEvents = async (req: Request, res: Response) => {
  const patientId = req.patientId?.toString();
  if (!patientId) {
    res.status(400).json({ message: 'Patient scope is required' });
    return;
  }

  try {
    const result = await postgresPool.query(
      `SELECT id, actor_id, actor_role, action, method, route, response_status, request_id, created_at
       FROM audit_events WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [patientId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Audit history query failed:', error);
    res.status(500).json({ message: 'Could not load audit history' });
  }
};