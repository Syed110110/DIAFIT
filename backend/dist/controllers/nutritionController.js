"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNutritionEntry = exports.getTodayNutrition = exports.addFoodEntry = void 0;
const NutritionTracker_1 = require("../models/NutritionTracker");
const Profile_1 = require("../models/Profile");
// Add food entry
const addFoodEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { meal, foods } = req.body;
        if (!meal || !foods || !Array.isArray(foods) || foods.length === 0) {
            return res.status(400).json({ message: 'Please provide valid meal and foods' });
        }
        const nutritionEntry = new NutritionTracker_1.NutritionEntry({
            user: userId,
            meal,
            foods,
            date: new Date()
        });
        yield nutritionEntry.save();
        res.status(201).json(nutritionEntry);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.addFoodEntry = addFoodEntry;
// Get today's nutrition data
const getTodayNutrition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // Get start and end of today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Find all nutrition entries for today
        const nutritionEntries = yield NutritionTracker_1.NutritionEntry.find({
            user: userId,
            date: { $gte: today, $lt: tomorrow }
        });
        // Calculate nutrition totals
        let totalCarbs = 0;
        let totalProtein = 0;
        let totalFat = 0;
        let totalCalories = 0;
        nutritionEntries.forEach(entry => {
            entry.foods.forEach(food => {
                totalCarbs += food.carbohydrates;
                totalProtein += food.protein;
                totalFat += food.fat;
                totalCalories += food.calories;
            });
        });
        // Get user's daily nutrition goals
        const profile = yield Profile_1.Profile.findOne({ user: userId });
        const dailyCarbGoal = profile ? profile.dailyCarbohydrateGoal : 150;
        const dailyProteinGoal = profile ? profile.dailyProteinGoal : 80;
        res.status(200).json({
            nutritionEntries,
            totals: {
                carbohydrates: totalCarbs,
                protein: totalProtein,
                fat: totalFat,
                calories: totalCalories
            },
            goals: {
                carbohydrates: dailyCarbGoal,
                protein: dailyProteinGoal
            },
            progress: {
                carbohydrates: (totalCarbs / dailyCarbGoal) * 100,
                protein: (totalProtein / dailyProteinGoal) * 100
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getTodayNutrition = getTodayNutrition;
// Delete nutrition entry
const deleteNutritionEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { entryId } = req.params;
        const nutritionEntry = yield NutritionTracker_1.NutritionEntry.findOne({
            _id: entryId,
            user: userId
        });
        if (!nutritionEntry) {
            return res.status(404).json({ message: 'Nutrition entry not found' });
        }
        yield nutritionEntry.deleteOne();
        res.status(200).json({ message: 'Nutrition entry deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.deleteNutritionEntry = deleteNutritionEntry;
