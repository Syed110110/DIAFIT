import mongoose, { Document } from 'mongoose';

export interface ITip extends Document {
  category: string;
  content: string;
  isActive: boolean;
}

const tipSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['nutrition', 'exercise', 'hydration', 'glucose', 'general'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'tips'
});

export const Tip = mongoose.model<ITip>('Tip', tipSchema); 