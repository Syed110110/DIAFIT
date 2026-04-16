import express from 'express';
import { addWaterIntake, getTodayWaterIntake, deleteWaterEntry } from '../controllers/waterController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

router.post('/', addWaterIntake);
router.get('/today', getTodayWaterIntake);
router.delete('/:entryId', deleteWaterEntry);

export default router; 