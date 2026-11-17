import { Request, Response } from 'express';
import {
  acknowledgeCareAlert,
  getWhatsAppPreference,
  listPatientAlerts,
  listPatientAlertNotifications,
  triggerSosAlert,
  updateWhatsAppPreference,
} from '../Services/careAlertService';

const sendError = (res: Response, error: unknown) => {
  const status = typeof error === 'object' && error !== null && 'status' in error
    ? Number((error as { status: number }).status)
    : 500;
  if (status >= 500) console.error('Care alert request failed:', error);
  res.status(status).json({ message: status >= 500 ? 'Server error' : (error as Error).message });
};

export const getCareAlerts = async (req: Request, res: Response) => {
  try {
    const patientId = req.patientId?.toString();
    if (!patientId) return res.status(400).json({ message: 'Patient scope is required' });
    res.status(200).json(await listPatientAlerts(patientId));
  } catch (error) {
    sendError(res, error);
  }
};

export const getAlertInbox = async (req: Request, res: Response) => {
  try {
    const patientId = req.patientId?.toString();
    if (!patientId || !req.user) return res.status(400).json({ message: 'Patient scope is required' });
    res.status(200).json(await listPatientAlertNotifications(patientId, req.user.id));
  } catch (error) {
    sendError(res, error);
  }
};

export const acknowledgeCareAlertRequest = async (req: Request, res: Response) => {
  try {
    const patientId = req.patientId?.toString();
    if (!patientId || !req.user) return res.status(400).json({ message: 'Patient scope is required' });
    const acknowledged = await acknowledgeCareAlert(req.params.alertId, patientId, req.user.id);
    if (!acknowledged) return res.status(403).json({ message: 'Alert is not assigned to you or is no longer open' });
    res.status(200).json({ status: 'ACKNOWLEDGED' });
  } catch (error) {
    sendError(res, error);
  }
};

export const triggerSos = async (req: Request, res: Response) => {
  try {
    const patientId = req.patientId?.toString();
    if (!patientId || req.body.confirmed !== true) {
      return res.status(400).json({ message: 'Confirm the SOS and provide patient scope' });
    }
    const { latitude, longitude } = req.body;
    const hasLocation = latitude !== undefined || longitude !== undefined;
    if (hasLocation && (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) ||
        Math.abs(Number(latitude)) > 90 || Math.abs(Number(longitude)) > 180)) {
      return res.status(400).json({ message: 'Provide valid coordinates or omit location' });
    }

    const alert = await triggerSosAlert({
      patientId,
      kind: 'SOS',
      severity: 'CRITICAL',
      acknowledgedWindowMinutes: 10,
      immediateEscalation: true,
      latitude: hasLocation ? Number(latitude) : null,
      longitude: hasLocation ? Number(longitude) : null,
    });
    res.status(201).json(alert);
  } catch (error) {
    sendError(res, error);
  }
};

export const getMyWhatsAppPreference = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    res.status(200).json(await getWhatsAppPreference(req.user.id));
  } catch (error) {
    sendError(res, error);
  }
};

export const saveMyWhatsAppPreference = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    const { whatsappNumber, whatsappOptIn } = req.body as { whatsappNumber?: unknown; whatsappOptIn?: unknown };
    if (typeof whatsappOptIn !== 'boolean') {
      return res.status(400).json({ message: 'Choose whether to opt in to WhatsApp alerts' });
    }
    const cleanNumber = typeof whatsappNumber === 'string' ? whatsappNumber.trim() : '';
    if (whatsappOptIn && !/^\+[1-9]\d{7,14}$/.test(cleanNumber)) {
      return res.status(400).json({ message: 'Enter an E.164 phone number (for example, +14155550123) to opt in' });
    }
    if (!whatsappOptIn && cleanNumber && !/^\+[1-9]\d{7,14}$/.test(cleanNumber)) {
      return res.status(400).json({ message: 'Enter a valid E.164 phone number or leave it blank' });
    }

    const result = await updateWhatsAppPreference(
      req.user.id,
      cleanNumber || null,
      whatsappOptIn
    );
    res.status(200).json(result);
  } catch (error) {
    sendError(res, error);
  }
};