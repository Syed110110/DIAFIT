import mongoose, { Document } from 'mongoose';

export interface INutritionEntry extends Document {
  user: mongoose.Schema.Types.ObjectId;
  meal: string;
  foods: Array<{
    name: string;
    carbohydrates: number;
    protein: number;
    fat: number;
    calories: number;
  }>;
  date: Date;
}

const nutritionEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  meal: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  },
  foods: [{
    name: {
      type: String,
      required: true
    },
    carbohydrates: {
      type: Number,
      default: 0
    },
    protein: {
      type: Number,
      default: 0
    },
    fat: {
      type: Number,
      default: 0
    },
    calories: {
      type: Number,
      default: 0
    }
  }],
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'nutritionentries'
});

// Create an index on user and date for fast lookups
nutritionEntrySchema.index({ user: 1, date: 1 });

export const NutritionEntry = mongoose.model<INutritionEntry>('NutritionEntry', nutritionEntrySchema); 