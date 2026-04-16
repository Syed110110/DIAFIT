import express from 'express';
import { 
  getUserDietPlans, 
  getDietPlanById, 
  createDietPlan, 
  updateDietPlan, 
  deleteDietPlan 
} from '../controllers/dietPlanController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Routes for diet plans
router.get('/', getUserDietPlans);
router.get('/:planId', getDietPlanById);
router.post('/', createDietPlan);
router.put('/:planId', updateDietPlan);
router.delete('/:planId', deleteDietPlan);

export default router; 