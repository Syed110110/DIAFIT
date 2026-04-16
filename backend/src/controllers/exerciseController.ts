import { Request, Response } from 'express';
import { ExerciseEntry, ExerciseType } from '../models/ExerciseTracker';
import { Profile } from '../models/Profile';

// Add exercise entry
export const addExerciseEntry = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    console.log('Adding exercise entry for user:', userId);
    
    const { type, duration, caloriesBurned, notes } = req.body;
    
    if (!type || !duration || duration <= 0) {
      return res.status(400).json({ message: 'Please provide valid exercise details' });
    }
    
    const exerciseEntry = new ExerciseEntry({
      user: userId,
      type,
      duration,
      caloriesBurned: caloriesBurned || 0,
      date: new Date(),
      notes: notes || ''
    });
    
    await exerciseEntry.save();
    console.log('Exercise entry saved:', exerciseEntry._id);
    
    res.status(201).json(exerciseEntry);
  } catch (error) {
    console.error('Error in addExerciseEntry:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get today's exercise data
export const getTodayExercise = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    console.log(`Getting exercise data for user: ${userId}`);
    
    // Get start and end of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find all exercise entries for today
    const exerciseEntries = await ExerciseEntry.find({
      user: userId,
      date: { $gte: today, $lt: tomorrow }
    }).sort({ date: -1 });
    
    console.log(`Found ${exerciseEntries.length} exercise entries for today`);
    
    // Calculate totals
    const totalDuration = exerciseEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalCaloriesBurned = exerciseEntries.reduce((sum, entry) => sum + entry.caloriesBurned, 0);
    
    // Get user's daily exercise goal
    const profile = await Profile.findOne({ user: userId });
    const dailyExerciseGoal = profile ? profile.dailyExerciseGoal : 30; // Default 30 minutes
    
    res.status(200).json({
      entries: exerciseEntries,
      totalDuration,
      totalCaloriesBurned,
      dailyExerciseGoal,
      progress: (totalDuration / dailyExerciseGoal) * 100
    });
  } catch (error) {
    console.error('Error in getTodayExercise:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete exercise entry
export const deleteExerciseEntry = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { entryId } = req.params;
    
    console.log(`Deleting exercise entry ${entryId} for user ${userId}`);
    
    const exerciseEntry = await ExerciseEntry.findOne({
      _id: entryId,
      user: userId
    });
    
    if (!exerciseEntry) {
      return res.status(404).json({ message: 'Exercise entry not found' });
    }
    
    await exerciseEntry.deleteOne();
    console.log('Exercise entry deleted successfully');
    
    res.status(200).json({ message: 'Exercise entry deleted successfully' });
  } catch (error) {
    console.error('Error in deleteExerciseEntry:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get exercise types
export const getExerciseTypes = async (req: Request, res: Response) => {
  try {
    console.log('Getting exercise types');
    
    // Check if exercise types exist
    let exerciseTypes = await ExerciseType.find();
    
    // If no exercise types exist, create default ones
    if (exerciseTypes.length === 0) {
      console.log('No exercise types found, creating defaults');
      
      const defaultTypes = [
        { id: '1', name: 'Walking', caloriesPerMinute: 4, intensity: 'light' },
        { id: '2', name: 'Running', caloriesPerMinute: 10, intensity: 'high' },
        { id: '3', name: 'Cycling', caloriesPerMinute: 7, intensity: 'medium' },
        { id: '4', name: 'Swimming', caloriesPerMinute: 8, intensity: 'medium' },
        { id: '5', name: 'Yoga', caloriesPerMinute: 3, intensity: 'light' }
      ];
      
      // Create default exercise types
      await ExerciseType.insertMany(defaultTypes.map(type => ({
        name: type.name,
        caloriesPerMinute: type.caloriesPerMinute,
        intensity: type.intensity
      })));
      
      // Get the newly created exercise types
      exerciseTypes = await ExerciseType.find();
    }
    
    // Format exercise types to match frontend expectations
    const formattedTypes = exerciseTypes.map(type => ({
      id: type._id.toString(),
      name: type.name,
      caloriesPerMinute: type.caloriesPerMinute,
      intensity: type.intensity
    }));
    
    console.log(`Returning ${formattedTypes.length} exercise types`);
    res.status(200).json(formattedTypes);
  } catch (error) {
    console.error('Error in getExerciseTypes:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 