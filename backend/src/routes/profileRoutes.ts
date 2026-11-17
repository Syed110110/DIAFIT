import express from 'express';
import { getUserProfile, updateProfile } from '../controllers/profileController';
import { protect } from '../middleware/auth';
import { requirePatientScope } from '../middleware/authorization';

const router = express.Router();

router.get('/', protect, requirePatientScope('PATIENT', 'CAREGIVER', 'FAMILY_COORDINATOR', 'DOCTOR'), getUserProfile);
router.put('/', protect, requirePatientScope('PATIENT'), updateProfile);

export default router; 