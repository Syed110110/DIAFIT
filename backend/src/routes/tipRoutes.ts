import express from 'express';
import { getRandomTip, createTip } from '../controllers/tipController';
import { protect } from '../middleware/auth';
import { authorizeRoles } from '../middleware/authorization';

const router = express.Router();

// Public route for getting a tip
router.get('/random', getRandomTip);

// Protected routes
router.use(protect);
router.post('/', authorizeRoles('ADMIN'), createTip);

export default router; 