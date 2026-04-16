import mongoose, { Document } from 'mongoose';

export interface IWaterEntry extends Document {
  user: mongoose.Schema.Types.ObjectId;
  amount: number; // in milliliters
  date: Date;
}

const waterEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'waterentries'
});

// Create an index on user and date for fast lookups
waterEntrySchema.index({ user: 1, date: 1 });

export const WaterEntry = mongoose.model<IWaterEntry>('WaterEntry', waterEntrySchema); 