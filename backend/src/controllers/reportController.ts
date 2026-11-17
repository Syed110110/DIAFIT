import { Request, Response } from 'express';
import { generateClinicalReport } from '../Services/reportService';

const sendError = (res: Response, error: unknown) => {
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status: number }).status)
      : 500;
  if (status >= 500) console.error('Clinical report generation failed:', error);
  res.status(status).json({ message: status >= 500 ? 'Server error' : (error as Error).message });
};

export const getClinicalReportSummary = async (req: Request, res: Response) => {
  try {
    const patientId = req.patientId?.toString();
    if (!patientId) {
      return res.status(400).json({ message: 'Patient scope is required to generate a clinical report' });
    }

    const days = req.query.days ? Number(req.query.days) : 30;
    const report = await generateClinicalReport({
      patientId,
      days,
    });

    res.status(200).json(report);
  } catch (error) {
    sendError(res, error);
  }
};
