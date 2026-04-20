"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DietPlan = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Define the schema for meal entries (used in diet plans)
const mealEntrySchema = new mongoose_1.default.Schema({
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
const dietPlanSchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
exports.DietPlan = mongoose_1.default.model('DietPlan', dietPlanSchema);
