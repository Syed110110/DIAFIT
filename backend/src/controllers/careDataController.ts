import { Request, Response } from 'express';
import {
  correctDoseLog,
  createDoseOccurrence,
  createGlucoseReading,
  getCareSettings,
  listDoseConflicts,
  listDoseOccurrences,
  listGlucoseReadings,
  logDose,
  resolveDoseConflict,
  updateCareSettings,
} from '../Services/careDataService';

const glucoseContexts = ['FASTING', 'BEFORE_MEAL', 'AFTER_MEAL', 'BEDTIME', 'OTHER'];

const respondWithError = (res: Response, error: unknown) => {
  const status = typeof error === 'object' && error !== null && 'status' in error
    ? Number((error as { status: number }).status)
    : 500;
  const message = error instanceof Error ? error.message : 'Server error';
  if (status >= 500) console.error('Care data request failed:', error);
  res.status(status).json({ message: status >= 500 ? 'Server error' : message });
};

const patientIdForRequest = (req: Request): string | undefined => req.patientId?.toString();

const isDate = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

export const readCareSettings = async (req: Request, res: Response) => {
  try {
    const patientId = patientIdForRequest(req);
    if (!patientId) return res.status(400).json({ message: 'Patient scope is required' });
    res.status(200).json(await getCareSettings(patientId));
  } catch (error) {
    respondWithError(res, error);
  }
};

export const saveCareSettings = async (req: Request, res: Response) => {
  try {
    const patientId = patientIdForRequest(req);
    if (!patientId || !req.user) return res.status(400).json({ message: 'Patient scope is required' });
    const {
      safeGlucoseMinMgDl,
      safeGlucoseMaxMgDl,
      criticalGlucoseMinMgDl,
      criticalGlucoseMaxMgDl,
      doseGraceMinutes,
      doseMissAfterMinutes,
      conflictWindowSeconds,
      alertAckWindowMinutes,
      alertRetryLimit,
    } = req.body;
    if (safeGlucoseMinMgDl === undefined || safeGlucoseMaxMgDl === undefined ||
        (safeGlucoseMinMgDl !== null && !Number.isFinite(Number(safeGlucoseMinMgDl))) ||
        (safeGlucoseMaxMgDl !== null && !Number.isFinite(Number(safeGlucoseMaxMgDl))) ||
        (criticalGlucoseMinMgDl !== undefined && criticalGlucoseMinMgDl !== null && !Number.isFinite(Number(criticalGlucoseMinMgDl))) ||
        (criticalGlucoseMaxMgDl !== undefined && criticalGlucoseMaxMgDl !== null && !Number.isFinite(Number(criticalGlucoseMaxMgDl)))) {
      return res.status(400).json({ message: 'Provide clinician-configured glucose limits, or null to clear them' });
    }
    if (doseGraceMinutes !== undefined && (!Number.isInteger(doseGraceMinutes) || doseGraceMinutes < 0)) {
      return res.status(400).json({ message: 'Dose grace period must be a non-negative whole number of minutes' });
    }
    if (doseMissAfterMinutes !== undefined && (!Number.isInteger(doseMissAfterMinutes) || doseMissAfterMinutes <= (doseGraceMinutes ?? 0))) {
      return res.status(400).json({ message: 'Miss-after must be greater than the configured grace period' });
    }
    if (conflictWindowSeconds !== undefined && (!Number.isInteger(conflictWindowSeconds) || conflictWindowSeconds < 0)) {
      return res.status(400).json({ message: 'Conflict window must be a non-negative whole number of seconds' });
    }
    if (alertAckWindowMinutes !== undefined && (!Number.isInteger(alertAckWindowMinutes) || alertAckWindowMinutes < 1)) {
      return res.status(400).json({ message: 'Alert acknowledgment window must be at least one minute' });
    }
    if (alertRetryLimit !== undefined && (!Number.isInteger(alertRetryLimit) || alertRetryLimit < 0 || alertRetryLimit > 10)) {
      return res.status(400).json({ message: 'Alert retry limit must be between zero and ten' });
    }

    const min = safeGlucoseMinMgDl === null ? null : Number(safeGlucoseMinMgDl);
    const max = safeGlucoseMaxMgDl === null ? null : Number(safeGlucoseMaxMgDl);
    if (min !== null && max !== null && min >= max) {
      return res.status(400).json({ message: 'The configured minimum must be lower than the maximum' });
    }
    const criticalMin = criticalGlucoseMinMgDl === undefined || criticalGlucoseMinMgDl === null ? null : Number(criticalGlucoseMinMgDl);
    const criticalMax = criticalGlucoseMaxMgDl === undefined || criticalGlucoseMaxMgDl === null ? null : Number(criticalGlucoseMaxMgDl);
    if ((criticalMin !== null && (min === null || criticalMin >= min)) ||
        (criticalMax !== null && (max === null || criticalMax <= max))) {
      return res.status(400).json({ message: 'Critical glucose bounds must be outside the configured safe range' });
    }

    const settings = await updateCareSettings(patientId, req.user.id, {
      safeGlucoseMin: min,
      safeGlucoseMax: max,
      criticalGlucoseMin: criticalGlucoseMinMgDl === undefined ? undefined : criticalMin,
      criticalGlucoseMax: criticalGlucoseMaxMgDl === undefined ? undefined : criticalMax,
      doseGraceMinutes,
      doseMissAfterMinutes,
      conflictWindowSeconds,
      alertAckWindowMinutes,
      alertRetryLimit,
    });
    res.status(200).json(settings);
  } catch (error) {
    respondWithError(res, error);
  }
};

export const getDoseOccurrences = async (req: Request, res: Response) => {
  try {
    const patientId = patientIdForRequest(req);
    if (!patientId) return res.status(400).json({ message: 'Patient scope is required' });
    res.status(200).json(await listDoseOccurrences(patientId));
  } catch (error) {
    respondWithError(res, error);
  }
};

export const scheduleDose = async (req: Request, res: Response) => {
  try {
    const patientId = patientIdForRequest(req);
    const { medicationName, scheduledFor, confirmed } = req.body;
    if (!patientId || !req.user) return res.status(400).json({ message: 'Patient scope is required' });
    if (confirmed !== true) return res.status(400).json({ message: 'Confirm the dose schedule before saving' });
    if (typeof medicationName !== 'string' || !medicationName.trim() || !isDate(scheduledFor)) {
      return res.status(400).json({ message: 'Provide a medication name and valid scheduled time' });
    }

    const occurrence = await createDoseOccurrence(patientId, req.user, {
      medicationName: medicationName.trim(),
      scheduledFor: new Date(scheduledFor),
    });
    res.status(201).json(occurrence);
  } catch (error) {
    respondWithError(res, error);
  }
};

export const recordDose = async (req: Request, res: Response) => {
  try {
    const patientId = patientIdForRequest(req);
    const { takenAt, source, notes, confirmed } = req.body;
    if (!patientId || !req.user) return res.status(400).json({ message: 'Patient scope is required' });
    if (confirmed !== true) return res.status(400).json({ message: 'Confirm the dose log before saving' });
    if (!isDate(takenAt) || !['MANUAL', 'VOICE'].includes(source)) {
      return res.status(400).json({ message: 'Provide a valid dose time and source' });
    }

    const result = await logDose(req.params.occurrenceId, patientId, req.user, {
      takenAt: new Date(takenAt),
      source,
      notes: typeof notes === 'string' ? notes.trim() : '',
    });
    res.status(201).json(result);
  } catch (error) {
    respondWithError(res, error);
  }
};

export const correctDose = async (req: Request, res: Response) => {
  try {
    const patientId = patientIdForRequest(req);
    const { originalLogId, takenAt, notes, confirmed } = req.body;
    if (!patientId || !req.user) return res.status(400).json({ message: 'Patient scope is required' });
    if (confirmed !== true) return res.status(400).json({ message: 'Confirm the correction before saving' });
    if (typeof originalLogId !== 'string' || !isDate(takenAt)) {
      return res.status(400).json({ message: 'Provide the original log ID and corrected dose time' });
    }

    const result = await correctDoseLog(req.params.occurrenceId, patientId, req.user, {
      originalLogId,
      takenAt: new Date(takenAt),
      notes: typeof notes === 'string' ? notes.trim() : '',
    });
    res.status(201).json(result);
  } catch (error) {
    respondWithError(res, error);
  }
};

export const getOpenDoseConflicts = async (req: Request, res: Response) => {
  try {
    const patientId = patientIdForRequest(req);
    if (!patientId) return res.status(400).json({ message: 'Patient scope is required' });
    res.status(200).json(await listDoseConflicts(patientId));
  } catch (error) {
    respondWithError(res, error);
  }
};

export const confirmDoseConflict = async (req: Request, res: Response) => {
  try {
    const patientId = patientIdForRequest(req);
    const { selectedLogId, confirmed } = req.body;
    if (!patientId || !req.user) return res.status(400).json({ message: 'Patient scope is required' });
    if (confirmed !== true || typeof selectedLogId !== 'string') {
      return res.status(400).json({ message: 'Select a log and confirm the resolution' });
    }

    const result = await resolveDoseConflict(req.params.conflictId, patientId, req.user.id, selectedLogId);
    res.status(200).json(result);
  } catch (error) {
    respondWithError(res, error);
  }
};

export const getGlucoseReadings = async (req: Request, res: Response) => {
  try {
    const patientId = patientIdForRequest(req);
    if (!patientId) return res.status(400).json({ message: 'Patient scope is required' });
    res.status(200).json(await listGlucoseReadings(patientId));
  } catch (error) {
    respondWithError(res, error);
  }
};

export const recordGlucoseReading = async (req: Request, res: Response) => {
  try {
    const patientId = patientIdForRequest(req);
    const { valueMgDl, context, measuredAt, source, notes, confirmed } = req.body;
    if (!patientId || !req.user) return res.status(400).json({ message: 'Patient scope is required' });
    if (confirmed !== true) return res.status(400).json({ message: 'Confirm the glucose reading before saving' });
    if (!Number.isFinite(Number(valueMgDl)) || Number(valueMgDl) <= 0 || Number(valueMgDl) > 2000 ||
        !glucoseContexts.includes(context) || !isDate(measuredAt) || !['MANUAL', 'VOICE'].includes(source)) {
      return res.status(400).json({ message: 'Provide a valid glucose value, context, time, and source' });
    }

    const reading = await createGlucoseReading(patientId, req.user, {
      valueMgDl: Number(valueMgDl),
      context,
      measuredAt: new Date(measuredAt),
      source,
      notes: typeof notes === 'string' ? notes.trim() : '',
    });
    res.status(201).json(reading);
  } catch (error) {
    respondWithError(res, error);
  }
};