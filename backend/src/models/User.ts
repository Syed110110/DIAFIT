import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, userRoles } from '../types/roles';

export interface IUser extends Document {
  name: string;
  email: string;
  username?: string;
  role?: UserRole;
  password?: string;
  phoneNumber?: string;
  whatsappEnabled: boolean;
  reminderTime: string; // Format "HH:mm"
  dailyWaterGoal: number;
  dailyStepsGoal: number;
  // --- ADDED: TypeScript definition for streak data ---
  streakData?: {
    currentStreak: number;
    longestStreak: number;
    lastGoalMetDate: string | null;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String },
  role: { type: String, enum: userRoles, default: 'PATIENT' },
  password: { type: String, required: false },
  phoneNumber: { type: String, default: "" },
  whatsappEnabled: { type: Boolean, default: false },
  reminderTime: { type: String, default: "08:00" },
  dailyWaterGoal: { type: Number, default: 2000 },
  dailyStepsGoal: { type: Number, default: 5000 },
  // --- ADDED: MongoDB schema for streak data ---
  streakData: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastGoalMetDate: { type: String, default: null }
  }
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password || /^\$2[aby]\$\d{2}\$/.test(this.password)) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  const storedPassword = this.password;
  if (!storedPassword) return false;

  if (/^\$2[aby]\$\d{2}\$/.test(storedPassword)) {
    return bcrypt.compare(candidatePassword, storedPassword);
  }

  if (candidatePassword !== storedPassword) return false;

  this.password = await bcrypt.hash(storedPassword, 10);
  await this.save();
  return true;
};

export const User = mongoose.model<IUser>('User', userSchema);