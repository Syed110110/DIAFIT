import { Request, Response } from 'express';
import { Tip } from '../models/Tip';

// Get random active tip
export const getRandomTip = async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    
    // Build query
    const query: any = { isActive: true };
    if (category) {
      query.category = category;
    }
    
    // Count total matching tips
    const count = await Tip.countDocuments(query);
    
    if (count === 0) {
      return res.status(404).json({ message: 'No tips found' });
    }
    
    // Get a random tip
    const random = Math.floor(Math.random() * count);
    const tip = await Tip.findOne(query).skip(random);
    
    res.status(200).json(tip);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Create new tip (admin only)
export const createTip = async (req: Request, res: Response) => {
  try {
    const { category, content } = req.body;
    
    if (!category || !content) {
      return res.status(400).json({ message: 'Please provide category and content' });
    }
    
    const tip = new Tip({
      category,
      content,
      isActive: true
    });
    
    await tip.save();
    
    res.status(201).json(tip);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Initialize default tips
export const initializeDefaultTips = async () => {
  try {
    const count = await Tip.countDocuments();
    
    // Only add default tips if none exist
    if (count === 0) {
      const defaultTips = [
        {
          category: 'hydration',
          content: 'Staying hydrated helps maintain blood sugar levels and supports kidney function. Try to drink water before meals.'
        },
        {
          category: 'nutrition',
          content: 'Choose complex carbohydrates over simple ones to help manage blood sugar levels better.'
        },
        {
          category: 'exercise',
          content: 'Regular physical activity can lower your blood sugar for up to 24 hours after you exercise.'
        },
        {
          category: 'glucose',
          content: 'Check your blood sugar before, during, and after exercise, especially if you take insulin.'
        },
        {
          category: 'general',
          content: 'Get enough sleep! Poor sleep can affect insulin sensitivity and make managing diabetes more difficult.'
        }
      ];
      
      await Tip.insertMany(defaultTips);
      console.log('Default tips initialized');
    }
  } catch (error) {
    console.error('Error initializing default tips:', error);
  }
}; 