import express from 'express';
import { addExerciseEntry, getTodayExercise, deleteExerciseEntry, getExerciseTypes } from '../controllers/exerciseController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

router.post('/', addExerciseEntry);
router.get('/today', getTodayExercise);
router.get('/types', getExerciseTypes);
router.delete('/:entryId', deleteExerciseEntry);

export default router;