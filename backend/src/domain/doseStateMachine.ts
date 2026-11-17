export type DoseState = 'PENDING' | 'TAKEN' | 'LATE' | 'MISSED';

export const markDoseMissed = (
  state: DoseState,
  scheduledFor: Date,
  now: Date,
  missAfterMinutes: number
): DoseState => {
  if (state !== 'PENDING') return state;
  const missAt = scheduledFor.getTime() + missAfterMinutes * 60_000;
  return now.getTime() >= missAt ? 'MISSED' : 'PENDING';
};

export const stateForDoseLog = (
  currentState: DoseState,
  scheduledFor: Date,
  takenAt: Date,
  graceMinutes: number
): DoseState => {
  if (currentState !== 'PENDING') return currentState === 'MISSED' ? 'LATE' : currentState;
  const graceEndsAt = scheduledFor.getTime() + graceMinutes * 60_000;
  return takenAt.getTime() <= graceEndsAt ? 'TAKEN' : 'LATE';
};