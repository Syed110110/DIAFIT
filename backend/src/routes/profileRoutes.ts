import express from 'express';
import { getUserProfile, updateProfile } from '../controllers/profileController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

router.get('/', getUserProfile);
router.put('/', updateProfile);

export default router; 