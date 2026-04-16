import mongoose, { Document } from 'mongoose';

// Health metric interface
interface HealthMetric {
  value: string;
  date: string;
}

// Health metrics interface
interface HealthMetrics {
  a1c: HealthMetric;
  bloodPressure: HealthMetric;
  weight: HealthMetric;
  cholesterol: HealthMetric;
}

export interface IProfile extends Document {
  user: mongoose.Schema.Types.ObjectId;
  height: number;
  weight: number;
  age: number;
  gender: string;
  diabetesType: string;
  dailyWaterGoal: number;
  dailyCarbohydrateGoal: number;
  dailyProteinGoal: number;
  dailyExerciseGoal: number;
  phone: string;
  birthdate: string;
  emergencyContact: string;
  primaryDoctor: string;
  nextAppointment: string;
  allergies: string[];
  diagnosisDate: string;
  healthMetrics: HealthMetrics;
}

const healthMetricSchema = new mongoose.Schema({
  value: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    default: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }
}, { _id: false });

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Physical attributes
  height: {
    type: Number,
    default: 170
  },
  weight: {
    type: Number,
    default: 70
  },
  age: {
    type: Number,
    default: 30
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  // Medical information
  diabetesType: {
    type: String,
    enum: ['Type 1', 'Type 2', 'Prediabetes', 'Gestational', 'None'],
    default: 'Type 2'
  },
  diagnosisDate: {
    type: String,
    default: ''
  },
  // Daily goals
  dailyWaterGoal: {
    type: Number,
    default: 2.0 // In liters
  },
  dailyCarbohydrateGoal: {
    type: Number,
    default: 150 // In grams
  },
  dailyProteinGoal: {
    type: Number,
    default: 80 // In grams
  },
  dailyExerciseGoal: {
    type: Number,
    default: 30 // In minutes
  },
  // Contact information
  phone: {
    type: String,
    default: ''
  },
  birthdate: {
    type: String,
    default: ''
  },
  emergencyContact: {
    type: String,
    default: ''
  },
  // Medical care
  primaryDoctor: {
    type: String,
    default: ''
  },
  nextAppointment: {
    type: String,
    default: ''
  },
  allergies: {
    type: [String],
    default: []
  },
  // Health metrics
  healthMetrics: {
    a1c: {
      type: healthMetricSchema,
      default: () => ({
        value: '6.5%',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      })
    },
    bloodPressure: {
      type: healthMetricSchema,
      default: () => ({
        value: '120/80',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      })
    },
    weight: {
      type: healthMetricSchema,
      default: function() {
        return {
          value: `${this.weight || 70} kg`,
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        };
      }
    },
    cholesterol: {
      type: healthMetricSchema,
      default: () => ({
        value: 'Total: 180, LDL: 100',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      })
    }
  }
}, {
  timestamps: true,
  collection: 'profiles'
});

export const Profile = mongoose.model<IProfile>('Profile', profileSchema); 