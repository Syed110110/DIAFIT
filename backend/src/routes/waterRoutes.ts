import express, { Request, Response } from 'express';
import WaterTracker from '../models/WaterTracker';
import { updateActivityStreak } from '../controllers/streakService';

const router = express.Router();

// Route to log water intake
router.post('/log', async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount } = req.body;
    
    // Typecast req to 'any' right at the assignment block to bypass interface collisions safely
    const extendedReq = req as any;
    const userId = extendedReq.user?._id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized profile access' });
      return;
    }

    // 1. Create and save the new water record entry
    const newEntry = new WaterTracker({
      userId,
      amount,
      date: new Date()
    });
    await newEntry.save();

    // 2. Fire the streak calculation engine dynamically
    await updateActivityStreak(userId);

    res.status(201).json({ 
      success: true, 
      message: 'Water log recorded and active streak synchronized successfully',
      data: newEntry 
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
});

export default router;