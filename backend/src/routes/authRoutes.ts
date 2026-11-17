import express from 'express';
import { createUser, signup, signin } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { authorizeRoles } from '../middleware/authorization';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/users', protect, authorizeRoles('ADMIN'), createUser);

export default router; 