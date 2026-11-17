import { UserRole } from '../types/roles';

export const isConflictingDoseLog = (
  firstRole: UserRole,
  firstLoggedAt: Date,
  secondRole: UserRole,
  secondLoggedAt: Date,
  conflictWindowSeconds: number
): boolean => {
  if (firstRole === secondRole || conflictWindowSeconds < 0) return false;
  const differenceSeconds = Math.abs(firstLoggedAt.getTime() - secondLoggedAt.getTime()) / 1000;
  return differenceSeconds <= conflictWindowSeconds;
};