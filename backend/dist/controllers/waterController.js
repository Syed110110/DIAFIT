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
exports.deleteWaterEntry = exports.getTodayWaterIntake = exports.addWaterIntake = void 0;
const WaterTracker_1 = require("../models/WaterTracker");
const Profile_1 = require("../models/Profile");
// Add water intake
const addWaterIntake = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { amount } = req.body; // amount in milliliters
        console.log(`Adding water intake: ${amount}ml for user: ${userId}`);
        if (!userId) {
            console.error('No user ID found in the request');
            return res.status(401).json({ message: 'User not authenticated properly' });
        }
        if (!amount || amount <= 0) {
            console.error(`Invalid water amount: ${amount}`);
            return res.status(400).json({ message: 'Please provide a valid amount' });
        }
        const waterEntry = new WaterTracker_1.WaterEntry({
            user: userId,
            amount,
            date: new Date()
        });
        console.log('Saving water entry:', JSON.stringify(waterEntry));
        const savedEntry = yield waterEntry.save();
        console.log('Water entry saved successfully:', savedEntry._id);
        res.status(201).json(savedEntry);
    }
    catch (error) {
        console.error('Error adding water intake:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
    }
});
exports.addWaterIntake = addWaterIntake;
// Get today's water intake
const getTodayWaterIntake = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        console.log(`Getting today's water intake for user: ${userId}`);
        if (!userId) {
            console.error('No user ID found in the request');
            return res.status(401).json({ message: 'User not authenticated properly' });
        }
        // Get start and end of today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        console.log(`Querying water entries between ${today.toISOString()} and ${tomorrow.toISOString()}`);
        // Find all water entries for today
        const waterEntries = yield WaterTracker_1.WaterEntry.find({
            user: userId,
            date: { $gte: today, $lt: tomorrow }
        });
        console.log(`Found ${waterEntries.length} water entries for today`);
        // Calculate total water intake for today
        const totalWaterIntake = waterEntries.reduce((sum, entry) => sum + entry.amount, 0);
        // Get user's daily water goal
        const profile = yield Profile_1.Profile.findOne({ user: userId });
        const dailyWaterGoal = profile ? profile.dailyWaterGoal * 1000 : 2000; // Convert L to mL
        console.log(`User's daily water goal: ${dailyWaterGoal}ml, Current intake: ${totalWaterIntake}ml`);
        res.status(200).json({
            waterEntries,
            totalWaterIntake,
            dailyWaterGoal,
            progress: (totalWaterIntake / dailyWaterGoal) * 100
        });
    }
    catch (error) {
        console.error('Error getting water intake:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
    }
});
exports.getTodayWaterIntake = getTodayWaterIntake;
// Delete water entry
const deleteWaterEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { entryId } = req.params;
        console.log(`Deleting water entry: ${entryId} for user: ${userId}`);
        if (!userId) {
            console.error('No user ID found in the request');
            return res.status(401).json({ message: 'User not authenticated properly' });
        }
        const waterEntry = yield WaterTracker_1.WaterEntry.findOne({
            _id: entryId,
            user: userId
        });
        if (!waterEntry) {
            console.log(`Water entry not found with ID: ${entryId}`);
            return res.status(404).json({ message: 'Water entry not found' });
        }
        yield waterEntry.deleteOne();
        console.log('Water entry deleted successfully');
        res.status(200).json({ message: 'Water entry deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting water entry:', error);
        res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : String(error) });
    }
});
exports.deleteWaterEntry = deleteWaterEntry;
