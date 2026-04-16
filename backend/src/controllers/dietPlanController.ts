import { Request, Response } from 'express';
import { DietPlan } from '../models/DietPlan';

// Get all diet plans for the authenticated user
export const getUserDietPlans = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    console.log(`Fetching diet plans for user: ${userId}`);
    
    const dietPlans = await DietPlan.find({ user: userId }).sort({ createdAt: -1 });
    
    res.status(200).json(dietPlans);
  } catch (error) {
    console.error('Error fetching diet plans:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get a specific diet plan by ID
export const getDietPlanById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { planId } = req.params;
    
    console.log(`Fetching diet plan ${planId} for user: ${userId}`);
    
    const dietPlan = await DietPlan.findOne({ _id: planId, user: userId });
    
    if (!dietPlan) {
      return res.status(404).json({ message: 'Diet plan not found' });
    }
    
    res.status(200).json(dietPlan);
  } catch (error) {
    console.error('Error fetching diet plan:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Create a new diet plan
export const createDietPlan = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { name, meals, totalCarbs, totalCalories } = req.body;
    
    console.log(`Creating diet plan for user: ${userId}`);
    
    if (!name || !meals || !Array.isArray(meals)) {
      return res.status(400).json({ message: 'Please provide valid name and meals array' });
    }
    
    const dietPlan = new DietPlan({
      user: userId,
      name,
      date: new Date(),
      meals,
      totalCarbs: totalCarbs || 0,
      totalCalories: totalCalories || 0
    });
    
    await dietPlan.save();
    
    res.status(201).json(dietPlan);
  } catch (error) {
    console.error('Error creating diet plan:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update an existing diet plan
export const updateDietPlan = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { planId } = req.params;
    const { name, meals, totalCarbs, totalCalories } = req.body;
    
    console.log(`Updating diet plan ${planId} for user: ${userId}`);
    
    const dietPlan = await DietPlan.findOne({ _id: planId, user: userId });
    
    if (!dietPlan) {
      return res.status(404).json({ message: 'Diet plan not found' });
    }
    
    if (name) dietPlan.name = name;
    if (meals && Array.isArray(meals)) dietPlan.meals = meals;
    if (totalCarbs !== undefined) dietPlan.totalCarbs = totalCarbs;
    if (totalCalories !== undefined) dietPlan.totalCalories = totalCalories;
    
    await dietPlan.save();
    
    res.status(200).json(dietPlan);
  } catch (error) {
    console.error('Error updating diet plan:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete a diet plan
export const deleteDietPlan = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const { planId } = req.params;
    
    console.log(`Deleting diet plan ${planId} for user: ${userId}`);
    
    const dietPlan = await DietPlan.findOne({ _id: planId, user: userId });
    
    if (!dietPlan) {
      return res.status(404).json({ message: 'Diet plan not found' });
    }
    
    await dietPlan.deleteOne();
    
    res.status(200).json({ message: 'Diet plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting diet plan:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 