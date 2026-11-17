import express from 'express';
import { addFoodEntry, getTodayNutrition, deleteNutritionEntry } from '../controllers/nutritionController';
import { protect } from '../middleware/auth';
import { requirePatientScope } from '../middleware/authorization';

const router = express.Router();

router.post('/', protect, requirePatientScope('PATIENT', 'CAREGIVER'), addFoodEntry);
router.get('/today', protect, requirePatientScope('PATIENT', 'CAREGIVER', 'FAMILY_COORDINATOR', 'DOCTOR'), getTodayNutrition);
router.delete('/:entryId', protect, requirePatientScope('PATIENT'), deleteNutritionEntry);

export default router; 