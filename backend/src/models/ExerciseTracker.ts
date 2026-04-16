import mongoose, { Document } from 'mongoose';

export interface IExerciseEntry extends Document {
  user: mongoose.Schema.Types.ObjectId;
  type: string;
  duration: number; // in minutes
  caloriesBurned: number;
  date: Date;
  notes?: string;
}

export interface IExerciseType extends Document {
  name: string;
  caloriesPerMinute: number;
  intensity: 'light' | 'medium' | 'high';
}

const exerciseEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 0
  },
  caloriesBurned: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'exerciseentries'
});

const exerciseTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  caloriesPerMinute: {
    type: Number,
    required: true,
    default: 5
  },
  intensity: {
    type: String,
    enum: ['light', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true,
  collection: 'exercisetypes'
});

// Create an index on user and date for fast lookups
exerciseEntrySchema.index({ user: 1, date: 1 });

export const ExerciseEntry = mongoose.model<IExerciseEntry>('ExerciseEntry', exerciseEntrySchema);
export const ExerciseType = mongoose.model<IExerciseType>('ExerciseType', exerciseTypeSchema); 