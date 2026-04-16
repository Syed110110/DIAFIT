import { Request, Response } from 'express';
import { WaterEntry } from '../models/WaterTracker';
import { Profile } from '../models/Profile';

// Add water intake
export const addWaterIntake = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { amount } = req.body; // amount in milliliters
    
    console.log(`Adding water intake: ${amount}ml for user: ${userId}`);
    
    if (!userId) {
      console.error('No user ID found in the request');
      return res.status(401).json({ message: 'User not authenticated properly' });
    }
    
    if (!amount || amount <= 0) {
      console.error(`Invalid water amount: ${amount}`);
      return res.status(400).json({ message: 'Please provide a valid amount' });
    }
    
    const waterEntry = new WaterEntry({
      user: userId,
      amount,
      date: new Date()
    });
    
    console.log('Saving water entry:', JSON.stringify(waterEntry));
    const savedEntry = await waterEntry.save();
    console.log('Water entry saved successfully:', savedEntry._id);
    
    res.status(201).json(savedEntry);
  } catch (error) {
    console.error('Error adding water intake:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
  }
};

// Get today's water intake
export const getTodayWaterIntake = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    console.log(`Getting today's water intake for user: ${userId}`);
    
    if (!userId) {
      console.error('No user ID found in the request');
      return res.status(401).json({ message: 'User not authenticated properly' });
    }
    
    // Get start and end of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log(`Querying water entries between ${today.toISOString()} and ${tomorrow.toISOString()}`);
    
    // Find all water entries for today
    const waterEntries = await WaterEntry.find({
      user: userId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    console.log(`Found ${waterEntries.length} water entries for today`);
    
    // Calculate total water intake for today
    const totalWaterIntake = waterEntries.reduce((sum, entry) => sum + entry.amount, 0);
    
    // Get user's daily water goal
    const profile = await Profile.findOne({ user: userId });
    const dailyWaterGoal = profile ? profile.dailyWaterGoal * 1000 : 2000; // Convert L to mL
    
    console.log(`User's daily water goal: ${dailyWaterGoal}ml, Current intake: ${totalWaterIntake}ml`);
    
    res.status(200).json({
      waterEntries,
      totalWaterIntake,
      dailyWaterGoal,
      progress: (totalWaterIntake / dailyWaterGoal) * 100
    });
  } catch (error) {
    console.error('Error getting water intake:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
  }
};

// Delete water entry
export const deleteWaterEntry = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { entryId } = req.params;
    
    console.log(`Deleting water entry: ${entryId} for user: ${userId}`);
    
    if (!userId) {
      console.error('No user ID found in the request');
      return res.status(401).json({ message: 'User not authenticated properly' });
    }
    
    const waterEntry = await WaterEntry.findOne({
      _id: entryId,
      user: userId
    });
    
    if (!waterEntry) {
      console.log(`Water entry not found with ID: ${entryId}`);
      return res.status(404).json({ message: 'Water entry not found' });
    }
    
    await waterEntry.deleteOne();
    console.log('Water entry deleted successfully');
    
    res.status(200).json({ message: 'Water entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting water entry:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
  }
}; 