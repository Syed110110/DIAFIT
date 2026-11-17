import { UserRole } from '../types/roles';

export interface DoseCounts {
  taken: number;
  late: number;
  missed: number;
  pending: number;
}

export interface AdherenceMetrics {
  totalScheduled: number;
  totalEvaluated: number;
  adherenceRate: number;
  onTimeRate: number;
  adherenceStatus: 'EXCELLENT' | 'GOOD' | 'AT_RISK';
}

export type GlucoseCategory = 'LOW' | 'NORMAL' | 'HIGH';

export const canViewClinicalReport = (
  role: UserRole,
  actorId: string,
  patientId: string,
  hasApprovedAccess: boolean
): boolean => {
  if (role === 'ADMIN') return false;
  if (role === 'PATIENT') return actorId.trim().toLowerCase() === patientId.trim().toLowerCase();
  return (role === 'DOCTOR' || role === 'FAMILY_COORDINATOR' || role === 'CAREGIVER') && hasApprovedAccess;
};

export const calculateAdherenceMetrics = (counts: DoseCounts): AdherenceMetrics => {
  const totalScheduled = counts.taken + counts.late + counts.missed + counts.pending;
  const totalEvaluated = counts.taken + counts.late + counts.missed;
  
  if (totalEvaluated === 0) {
    return {
      totalScheduled,
      totalEvaluated: 0,
      adherenceRate: 100,
      onTimeRate: 100,
      adherenceStatus: 'EXCELLENT',
    };
  }

  const adherenceRate = Math.round(((counts.taken + counts.late) / totalEvaluated) * 100);
  const onTimeRate = Math.round((counts.taken / totalEvaluated) * 100);

  let adherenceStatus: AdherenceMetrics['adherenceStatus'] = 'EXCELLENT';
  if (adherenceRate < 70) {
    adherenceStatus = 'AT_RISK';
  } else if (adherenceRate < 85) {
    adherenceStatus = 'GOOD';
  }

  return {
    totalScheduled,
    totalEvaluated,
    adherenceRate,
    onTimeRate,
    adherenceStatus,
  };
};

export const categorizeGlucoseLevel = (
  valueMgDl: number,
  safeMin: number | null = 70,
  safeMax: number | null = 180
): GlucoseCategory => {
  const min = safeMin ?? 70;
  const max = safeMax ?? 180;
  if (valueMgDl < min) return 'LOW';
  if (valueMgDl > max) return 'HIGH';
  return 'NORMAL';
};
