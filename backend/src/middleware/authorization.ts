import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { hasActivePatientAccess, UserRole } from '../Services/identityService';
import { canAccessPatient } from '../security/accessPolicy';

export const authorizeRoles = (...allowedRoles: UserRole[]) => (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    res.status(403).json({ message: 'You do not have permission to perform this action' });
    return;
  }

  next();
};

export const requirePatientScope = (...allowedRoles: UserRole[]) => async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const actor = req.user;
  if (!actor) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (actor.role === 'ADMIN') {
    res.status(403).json({ message: 'Administrator accounts cannot access clinical data' });
    return;
  }

  if (!allowedRoles.includes(actor.role)) {
    res.status(403).json({ message: 'You do not have permission to access this resource' });
    return;
  }

  const requestedPatientId = String(
    req.params.patientId || req.query.patientId || req.body?.patientId ||
    req.header('x-patient-id') || actor.id
  ).trim();

  if (!/^[a-fA-F0-9]{24}$/.test(requestedPatientId)) {
    res.status(400).json({ message: 'A valid patientId is required for this account' });
    return;
  }

  try {
    const isAssigned = actor.role === 'PATIENT'
      ? false
      : await hasActivePatientAccess(actor.id, requestedPatientId);
    if (!canAccessPatient(actor.role, actor.id, requestedPatientId, isAssigned)) {
      res.status(403).json({ message: 'No active, patient-approved access for this patient' });
      return;
    }
  } catch (error) {
    next(error);
    return;
  }

  req.patientId = new Types.ObjectId(requestedPatientId);
  next();
};