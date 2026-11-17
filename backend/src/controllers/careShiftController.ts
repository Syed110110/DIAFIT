import { Request, Response } from 'express';
import { cancelCaregiverShift, createCaregiverShift, listCaregiverShifts } from '../Services/careShiftService';

const sendError = (res: Response, error: unknown) => {
  const status = typeof error === 'object' && error !== null && 'status' in error
    ? Number((error as { status: number }).status)
    : 500;
  if (status >= 500) console.error('Caregiver shift request failed:', error);
  res.status(status).json({ message: status >= 500 ? 'Server error' : (error as Error).message });
};

export const getCaregiverShifts = async (req: Request, res: Response) => {
  try {
    const patientId = req.patientId?.toString();
    if (!patientId) return res.status(400).json({ message: 'Patient scope is required' });
    res.status(200).json(await listCaregiverShifts(patientId));
  } catch (error) {
    sendError(res, error);
  }
};

export const addCaregiverShift = async (req: Request, res: Response) => {
  try {
    const patientId = req.patientId?.toString();
    if (!patientId || !req.user) return res.status(400).json({ message: 'Patient scope is required' });
    const { caregiverEmail, startsAt, endsAt, confirmed } = req.body;
    if (confirmed !== true) return res.status(400).json({ message: 'Confirm the shift before saving' });
    if (typeof caregiverEmail !== 'string' || Number.isNaN(Date.parse(startsAt)) || Number.isNaN(Date.parse(endsAt))) {
      return res.status(400).json({ message: 'Provide caregiver email and valid shift times' });
    }

    const shift = await createCaregiverShift({
      patientId,
      createdBy: req.user.id,
      caregiverEmail,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
    });
    res.status(201).json(shift);
  } catch (error) {
    sendError(res, error);
  }
};

export const removeCaregiverShift = async (req: Request, res: Response) => {
  try {
    const patientId = req.patientId?.toString();
    if (!patientId) return res.status(400).json({ message: 'Patient scope is required' });
    const cancelled = await cancelCaregiverShift(req.params.shiftId, patientId);
    if (!cancelled) return res.status(404).json({ message: 'Active caregiver shift not found' });
    res.status(200).json({ status: 'CANCELLED' });
  } catch (error) {
    sendError(res, error);
  }
};