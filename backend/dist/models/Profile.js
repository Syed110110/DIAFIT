"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profile = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const healthMetricSchema = new mongoose_1.default.Schema({
    value: {
        type: String,
        default: ''
    },
    date: {
        type: String,
        default: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    }
}, { _id: false });
const profileSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
            default: function () {
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
exports.Profile = mongoose_1.default.model('Profile', profileSchema);
