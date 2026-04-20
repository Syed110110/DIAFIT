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
exports.getExerciseTypes = exports.deleteExerciseEntry = exports.getTodayExercise = exports.addExerciseEntry = void 0;
const ExerciseTracker_1 = require("../models/ExerciseTracker");
const Profile_1 = require("../models/Profile");
// Add exercise entry
const addExerciseEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        console.log('Adding exercise entry for user:', userId);
        const { type, duration, caloriesBurned, notes } = req.body;
        if (!type || !duration || duration <= 0) {
            return res.status(400).json({ message: 'Please provide valid exercise details' });
        }
        const exerciseEntry = new ExerciseTracker_1.ExerciseEntry({
            user: userId,
            type,
            duration,
            caloriesBurned: caloriesBurned || 0,
            date: new Date(),
            notes: notes || ''
        });
        yield exerciseEntry.save();
        console.log('Exercise entry saved:', exerciseEntry._id);
        res.status(201).json(exerciseEntry);
    }
    catch (error) {
        console.error('Error in addExerciseEntry:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.addExerciseEntry = addExerciseEntry;
// Get today's exercise data
const getTodayExercise = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        console.log(`Getting exercise data for user: ${userId}`);
        // Get start and end of today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Find all exercise entries for today
        const exerciseEntries = yield ExerciseTracker_1.ExerciseEntry.find({
            user: userId,
            date: { $gte: today, $lt: tomorrow }
        }).sort({ date: -1 });
        console.log(`Found ${exerciseEntries.length} exercise entries for today`);
        // Calculate totals
        const totalDuration = exerciseEntries.reduce((sum, entry) => sum + entry.duration, 0);
        const totalCaloriesBurned = exerciseEntries.reduce((sum, entry) => sum + entry.caloriesBurned, 0);
        // Get user's daily exercise goal
        const profile = yield Profile_1.Profile.findOne({ user: userId });
        const dailyExerciseGoal = profile ? profile.dailyExerciseGoal : 30; // Default 30 minutes
        res.status(200).json({
            entries: exerciseEntries,
            totalDuration,
            totalCaloriesBurned,
            dailyExerciseGoal,
            progress: (totalDuration / dailyExerciseGoal) * 100
        });
    }
    catch (error) {
        console.error('Error in getTodayExercise:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getTodayExercise = getTodayExercise;
// Delete exercise entry
const deleteExerciseEntry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { entryId } = req.params;
        console.log(`Deleting exercise entry ${entryId} for user ${userId}`);
        const exerciseEntry = yield ExerciseTracker_1.ExerciseEntry.findOne({
            _id: entryId,
            user: userId
        });
        if (!exerciseEntry) {
            return res.status(404).json({ message: 'Exercise entry not found' });
        }
        yield exerciseEntry.deleteOne();
        console.log('Exercise entry deleted successfully');
        res.status(200).json({ message: 'Exercise entry deleted successfully' });
    }
    catch (error) {
        console.error('Error in deleteExerciseEntry:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.deleteExerciseEntry = deleteExerciseEntry;
// Get exercise types
const getExerciseTypes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('Getting exercise types');
        // Check if exercise types exist
        let exerciseTypes = yield ExerciseTracker_1.ExerciseType.find();
        // If no exercise types exist, create default ones
        if (exerciseTypes.length === 0) {
            console.log('No exercise types found, creating defaults');
            const defaultTypes = [
                { id: '1', name: 'Walking', caloriesPerMinute: 4, intensity: 'light' },
                { id: '2', name: 'Running', caloriesPerMinute: 10, intensity: 'high' },
                { id: '3', name: 'Cycling', caloriesPerMinute: 7, intensity: 'medium' },
                { id: '4', name: 'Swimming', caloriesPerMinute: 8, intensity: 'medium' },
                { id: '5', name: 'Yoga', caloriesPerMinute: 3, intensity: 'light' }
            ];
            // Create default exercise types
            yield ExerciseTracker_1.ExerciseType.insertMany(defaultTypes.map(type => ({
                name: type.name,
                caloriesPerMinute: type.caloriesPerMinute,
                intensity: type.intensity
            })));
            // Get the newly created exercise types
            exerciseTypes = yield ExerciseTracker_1.ExerciseType.find();
        }
        // Format exercise types to match frontend expectations
        const formattedTypes = exerciseTypes.map(type => ({
            id: type._id.toString(),
            name: type.name,
            caloriesPerMinute: type.caloriesPerMinute,
            intensity: type.intensity
        }));
        console.log(`Returning ${formattedTypes.length} exercise types`);
        res.status(200).json(formattedTypes);
    }
    catch (error) {
        console.error('Error in getExerciseTypes:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getExerciseTypes = getExerciseTypes;
