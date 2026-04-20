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
exports.deleteDietPlan = exports.updateDietPlan = exports.createDietPlan = exports.getDietPlanById = exports.getUserDietPlans = void 0;
const DietPlan_1 = require("../models/DietPlan");
// Get all diet plans for the authenticated user
const getUserDietPlans = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        console.log(`Fetching diet plans for user: ${userId}`);
        const dietPlans = yield DietPlan_1.DietPlan.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json(dietPlans);
    }
    catch (error) {
        console.error('Error fetching diet plans:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getUserDietPlans = getUserDietPlans;
// Get a specific diet plan by ID
const getDietPlanById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { planId } = req.params;
        console.log(`Fetching diet plan ${planId} for user: ${userId}`);
        const dietPlan = yield DietPlan_1.DietPlan.findOne({ _id: planId, user: userId });
        if (!dietPlan) {
            return res.status(404).json({ message: 'Diet plan not found' });
        }
        res.status(200).json(dietPlan);
    }
    catch (error) {
        console.error('Error fetching diet plan:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getDietPlanById = getDietPlanById;
// Create a new diet plan
const createDietPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { name, meals, totalCarbs, totalCalories } = req.body;
        console.log(`Creating diet plan for user: ${userId}`);
        if (!name || !meals || !Array.isArray(meals)) {
            return res.status(400).json({ message: 'Please provide valid name and meals array' });
        }
        const dietPlan = new DietPlan_1.DietPlan({
            user: userId,
            name,
            date: new Date(),
            meals,
            totalCarbs: totalCarbs || 0,
            totalCalories: totalCalories || 0
        });
        yield dietPlan.save();
        res.status(201).json(dietPlan);
    }
    catch (error) {
        console.error('Error creating diet plan:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.createDietPlan = createDietPlan;
// Update an existing diet plan
const updateDietPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { planId } = req.params;
        const { name, meals, totalCarbs, totalCalories } = req.body;
        console.log(`Updating diet plan ${planId} for user: ${userId}`);
        const dietPlan = yield DietPlan_1.DietPlan.findOne({ _id: planId, user: userId });
        if (!dietPlan) {
            return res.status(404).json({ message: 'Diet plan not found' });
        }
        if (name)
            dietPlan.name = name;
        if (meals && Array.isArray(meals))
            dietPlan.meals = meals;
        if (totalCarbs !== undefined)
            dietPlan.totalCarbs = totalCarbs;
        if (totalCalories !== undefined)
            dietPlan.totalCalories = totalCalories;
        yield dietPlan.save();
        res.status(200).json(dietPlan);
    }
    catch (error) {
        console.error('Error updating diet plan:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.updateDietPlan = updateDietPlan;
// Delete a diet plan
const deleteDietPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { planId } = req.params;
        console.log(`Deleting diet plan ${planId} for user: ${userId}`);
        const dietPlan = yield DietPlan_1.DietPlan.findOne({ _id: planId, user: userId });
        if (!dietPlan) {
            return res.status(404).json({ message: 'Diet plan not found' });
        }
        yield dietPlan.deleteOne();
        res.status(200).json({ message: 'Diet plan deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting diet plan:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.deleteDietPlan = deleteDietPlan;
