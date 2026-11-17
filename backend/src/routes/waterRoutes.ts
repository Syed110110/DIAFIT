import express from 'express';
import { addWaterIntake, deleteWaterEntry, getTodayWaterIntake } from '../controllers/waterController';
import { protect } from '../middleware/auth';
import { requirePatientScope } from '../middleware/authorization';

const router = express.Router();

router.get('/today', protect, requirePatientScope('PATIENT', 'CAREGIVER', 'FAMILY_COORDINATOR', 'DOCTOR'), getTodayWaterIntake);
router.post('/', protect, requirePatientScope('PATIENT', 'CAREGIVER'), addWaterIntake);
router.delete('/:entryId', protect, requirePatientScope('PATIENT'), deleteWaterEntry);

export default router;