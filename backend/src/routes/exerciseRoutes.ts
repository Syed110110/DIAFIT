import express from 'express';
import { addExerciseEntry, getTodayExercise, deleteExerciseEntry, getExerciseTypes } from '../controllers/exerciseController';
import { protect } from '../middleware/auth';
import { authorizeRoles, requirePatientScope } from '../middleware/authorization';

const router = express.Router();

router.post('/', protect, requirePatientScope('PATIENT', 'CAREGIVER'), addExerciseEntry);
router.get('/today', protect, requirePatientScope('PATIENT', 'CAREGIVER', 'FAMILY_COORDINATOR', 'DOCTOR'), getTodayExercise);
router.get('/types', protect, authorizeRoles('PATIENT', 'CAREGIVER', 'FAMILY_COORDINATOR', 'DOCTOR'), getExerciseTypes);
router.delete('/:entryId', protect, requirePatientScope('PATIENT'), deleteExerciseEntry);

export default router;