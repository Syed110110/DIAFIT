import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  whatsappEnabled: boolean;
  reminderTime: string; // Format "HH:00"
  dailyWaterGoal: number;
  dailyStepsGoal: number;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, default: "" },
  whatsappEnabled: { type: Boolean, default: false },
  reminderTime: { type: String, default: "08:00" },
  dailyWaterGoal: { type: Number, default: 2000 },
  dailyStepsGoal: { type: Number, default: 5000 },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', userSchema);