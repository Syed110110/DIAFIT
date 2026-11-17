import express from 'express';
import {
  confirmDoseConflict,
  correctDose,
  getDoseOccurrences,
  getGlucoseReadings,
  getOpenDoseConflicts,
  readCareSettings,
  recordDose,
  recordGlucoseReading,
  saveCareSettings,
  scheduleDose,
} from '../controllers/careDataController';
import { protect } from '../middleware/auth';
import { authorizeRoles, requirePatientScope } from '../middleware/authorization';
import {
  acknowledgeCareAlertRequest,
  getAlertInbox,
  getCareAlerts,
  getMyWhatsAppPreference,
  saveMyWhatsAppPreference,
  triggerSos,
} from '../controllers/careAlertController';
import { addCaregiverShift, getCaregiverShifts, removeCaregiverShift } from '../controllers/careShiftController';
import { getPatientAuditEvents } from '../controllers/auditController';
import { getClinicalReportSummary } from '../controllers/reportController';

const router = express.Router();
const readers = ['PATIENT', 'CAREGIVER', 'FAMILY_COORDINATOR', 'DOCTOR'] as const;
const writers = ['PATIENT', 'CAREGIVER'] as const;

router.get('/settings', protect, requirePatientScope(...readers), readCareSettings);
router.put('/settings', protect, requirePatientScope('DOCTOR'), saveCareSettings);

router.get('/doses', protect, requirePatientScope(...readers), getDoseOccurrences);
router.post('/doses', protect, requirePatientScope(...writers), scheduleDose);
router.post('/doses/:occurrenceId/logs', protect, requirePatientScope(...writers), recordDose);
router.post('/doses/:occurrenceId/corrections', protect, requirePatientScope('PATIENT', 'CAREGIVER', 'FAMILY_COORDINATOR'), correctDose);
router.get('/dose-conflicts', protect, requirePatientScope('PATIENT', 'FAMILY_COORDINATOR'), getOpenDoseConflicts);
router.post('/dose-conflicts/:conflictId/resolve', protect, requirePatientScope('FAMILY_COORDINATOR'), authorizeRoles('FAMILY_COORDINATOR'), confirmDoseConflict);

router.get('/glucose', protect, requirePatientScope(...readers), getGlucoseReadings);
router.post('/glucose', protect, requirePatientScope(...writers), recordGlucoseReading);

router.get('/alerts', protect, requirePatientScope(...readers), getCareAlerts);
router.get('/alerts/inbox', protect, requirePatientScope(...readers), getAlertInbox);
router.post('/alerts/:alertId/acknowledge', protect, requirePatientScope('CAREGIVER', 'FAMILY_COORDINATOR'), acknowledgeCareAlertRequest);
router.post('/alerts/sos', protect, requirePatientScope('PATIENT', 'CAREGIVER'), authorizeRoles('PATIENT', 'CAREGIVER'), triggerSos);
router.get('/alerts/whatsapp-preference', protect, authorizeRoles('PATIENT', 'CAREGIVER', 'FAMILY_COORDINATOR'), getMyWhatsAppPreference);
router.put('/alerts/whatsapp-preference', protect, authorizeRoles('PATIENT', 'CAREGIVER', 'FAMILY_COORDINATOR'), saveMyWhatsAppPreference);

router.get('/shifts', protect, requirePatientScope(...readers), getCaregiverShifts);
router.post('/shifts', protect, requirePatientScope('PATIENT', 'FAMILY_COORDINATOR'), addCaregiverShift);
router.delete('/shifts/:shiftId', protect, requirePatientScope('PATIENT', 'FAMILY_COORDINATOR'), removeCaregiverShift);
router.get('/audit', protect, requirePatientScope('FAMILY_COORDINATOR'), authorizeRoles('FAMILY_COORDINATOR'), getPatientAuditEvents);
router.get('/reports/summary', protect, requirePatientScope(...readers), getClinicalReportSummary);

export default router;