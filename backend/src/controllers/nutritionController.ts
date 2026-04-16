import { Request, Response } from 'express';
import { NutritionEntry } from '../models/NutritionTracker';
import { Profile } from '../models/Profile';

// Add food entry
export const addFoodEntry = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { meal, foods } = req.body;
    
    if (!meal || !foods || !Array.isArray(foods) || foods.length === 0) {
      return res.status(400).json({ message: 'Please provide valid meal and foods' });
    }
    
    const nutritionEntry = new NutritionEntry({
      user: userId,
      meal,
      foods,
      date: new Date()
    });
    
    await nutritionEntry.save();
    
    res.status(201).json(nutritionEntry);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get today's nutrition data
export const getTodayNutrition = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    // Get start and end of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find all nutrition entries for today
    const nutritionEntries = await NutritionEntry.find({
      user: userId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    // Calculate nutrition totals
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCalories = 0;
    
    nutritionEntries.forEach(entry => {
      entry.foods.forEach(food => {
        totalCarbs += food.carbohydrates;
        totalProtein += food.protein;
        totalFat += food.fat;
        totalCalories += food.calories;
      });
    });
    
    // Get user's daily nutrition goals
    const profile = await Profile.findOne({ user: userId });
    const dailyCarbGoal = profile ? profile.dailyCarbohydrateGoal : 150;
    const dailyProteinGoal = profile ? profile.dailyProteinGoal : 80;
    
    res.status(200).json({
      nutritionEntries,
      totals: {
        carbohydrates: totalCarbs,
        protein: totalProtein,
        fat: totalFat,
        calories: totalCalories
      },
      goals: {
        carbohydrates: dailyCarbGoal,
        protein: dailyProteinGoal
      },
      progress: {
        carbohydrates: (totalCarbs / dailyCarbGoal) * 100,
        protein: (totalProtein / dailyProteinGoal) * 100
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete nutrition entry
export const deleteNutritionEntry = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { entryId } = req.params;
    
    const nutritionEntry = await NutritionEntry.findOne({
      _id: entryId,
      user: userId
    });
    
    if (!nutritionEntry) {
      return res.status(404).json({ message: 'Nutrition entry not found' });
    }
    
    await nutritionEntry.deleteOne();
    
    res.status(200).json({ message: 'Nutrition entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 