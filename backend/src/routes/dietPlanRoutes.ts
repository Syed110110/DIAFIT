import express from 'express';
import { 
  getUserDietPlans, 
  getDietPlanById, 
  createDietPlan, 
  updateDietPlan, 
  deleteDietPlan 
} from '../controllers/dietPlanController';
import { protect } from '../middleware/auth';
import { requirePatientScope } from '../middleware/authorization';

const router = express.Router();

// Routes for diet plans
router.get('/', protect, requirePatientScope('PATIENT', 'CAREGIVER', 'FAMILY_COORDINATOR', 'DOCTOR'), getUserDietPlans);
router.get('/:planId', protect, requirePatientScope('PATIENT', 'CAREGIVER', 'FAMILY_COORDINATOR', 'DOCTOR'), getDietPlanById);
router.post('/', protect, requirePatientScope('PATIENT', 'FAMILY_COORDINATOR'), createDietPlan);
router.put('/:planId', protect, requirePatientScope('PATIENT', 'FAMILY_COORDINATOR'), updateDietPlan);
router.delete('/:planId', protect, requirePatientScope('PATIENT'), deleteDietPlan);

export default router; 