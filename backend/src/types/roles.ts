export const userRoles = [
  'PATIENT',
  'CAREGIVER',
  'FAMILY_COORDINATOR',
  'DOCTOR',
  'ADMIN',
] as const;

export type UserRole = typeof userRoles[number];