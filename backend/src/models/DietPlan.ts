import mongoose, { Document } from 'mongoose';

// Define the interfaces for our diet plan schema
export interface IMealEntry {
  foodId: string;
  mealType: string;
  servingSize: number;
}

export interface IDietPlan extends Document {
  user: mongoose.Schema.Types.ObjectId;
  name: string;
  date: Date;
  meals: IMealEntry[];
  totalCarbs: number;
  totalCalories: number;
}

// Define the schema for meal entries (used in diet plans)
const mealEntrySchema = new mongoose.Schema({
  foodId: {
    type: String,
    required: true
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  },
  servingSize: {
    type: Number,
    default: 1,
    min: 0.25
  }
});

// Define the schema for diet plans
const dietPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  meals: [mealEntrySchema],
  totalCarbs: {
    type: Number,
    default: 0
  },
  totalCalories: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'savedDietPlans'
});

// Create an index on user for fast lookups
dietPlanSchema.index({ user: 1 });

// Export the model
export const DietPlan = mongoose.model<IDietPlan>('DietPlan', dietPlanSchema); 