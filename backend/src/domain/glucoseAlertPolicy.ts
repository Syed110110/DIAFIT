export type AlertSeverity = 'WARNING' | 'CRITICAL';

export interface GlucoseAlertBounds {
  safeMin: number | null;
  safeMax: number | null;
  criticalMin?: number | null;
  criticalMax?: number | null;
}

export const classifyGlucoseReading = (
  valueMgDl: number,
  bounds: GlucoseAlertBounds
): AlertSeverity | null => {
  if (bounds.safeMin === null || bounds.safeMax === null) return null;
  if (valueMgDl >= bounds.safeMin && valueMgDl <= bounds.safeMax) return null;

  const beyondCriticalBound =
    (bounds.criticalMin != null && valueMgDl < bounds.criticalMin) ||
    (bounds.criticalMax != null && valueMgDl > bounds.criticalMax);
  return beyondCriticalBound ? 'CRITICAL' : 'WARNING';
};

export const shouldEscalateAlert = (input: {
  kind: 'GLUCOSE_OUT_OF_RANGE' | 'MISSED_DOSE' | 'SOS';
  state: 'OPEN' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED';
  ackDueAt: Date | null;
  now: Date;
}): boolean => {
  if (input.state !== 'OPEN') return false;
  if (input.kind === 'SOS') return true;
  return input.ackDueAt !== null && input.now.getTime() >= input.ackDueAt.getTime();
};