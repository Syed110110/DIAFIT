import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { postgresPool } from '../config/postgres';
import { auditActionForMethod, isApiRequest } from '../domain/auditPolicy';

export const auditApiRequest = (req: Request, res: Response, next: NextFunction): void => {
  const action = auditActionForMethod(req.method);
  if (!action || !isApiRequest(req.path)) {
    next();
    return;
  }

  const requestId = randomUUID();
  res.setHeader('X-Request-Id', requestId);
  res.on('finish', () => {
    const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path;
    const patientId = req.patientId?.toString() || (req.user?.role === 'PATIENT' ? req.user.id : null);
    void postgresPool.query(
      `INSERT INTO audit_events
         (patient_id, actor_id, actor_role, action, method, route, response_status, request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [patientId, req.user?.id || null, req.user?.role || null, action, req.method, route, res.statusCode, requestId]
    ).catch((error: unknown) => {
      console.error('Audit event write failed:', error);
    });
  });

  next();
};