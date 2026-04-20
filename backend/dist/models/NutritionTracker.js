"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NutritionEntry = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const nutritionEntrySchema = new mongoose_1.default.Schema({
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
exports.NutritionEntry = mongoose_1.default.model('NutritionEntry', nutritionEntrySchema);
