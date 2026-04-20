"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExerciseType = exports.ExerciseEntry = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const exerciseEntrySchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
const exerciseTypeSchema = new mongoose_1.default.Schema({
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
exports.ExerciseEntry = mongoose_1.default.model('ExerciseEntry', exerciseEntrySchema);
exports.ExerciseType = mongoose_1.default.model('ExerciseType', exerciseTypeSchema);
