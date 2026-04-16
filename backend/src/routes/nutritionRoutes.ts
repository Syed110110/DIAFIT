import express from 'express';
import { addFoodEntry, getTodayNutrition, deleteNutritionEntry } from '../controllers/nutritionController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

router.post('/', addFoodEntry);
router.get('/today', getTodayNutrition);
router.delete('/:entryId', deleteNutritionEntry);

export default router; 