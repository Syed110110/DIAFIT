import { UserRole } from '../Services/identityService';

export const canAccessPatient = (
  role: UserRole,
  actorId: string,
  patientId: string,
  hasApprovedMembership: boolean
): boolean => {
  if (role === 'ADMIN') return false;
  if (role === 'PATIENT') return actorId.toLowerCase() === patientId.toLowerCase();
  return hasApprovedMembership;
};