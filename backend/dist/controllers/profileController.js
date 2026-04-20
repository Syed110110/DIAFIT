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
exports.updateProfile = exports.getUserProfile = void 0;
const Profile_1 = require("../models/Profile");
// Get user profile
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        console.log(`Getting profile for user: ${userId}`);
        let profile = yield Profile_1.Profile.findOne({ user: userId });
        if (!profile) {
            // Create a default profile if none exists
            console.log(`No profile found for user ${userId}, creating one`);
            profile = yield Profile_1.Profile.create({
                user: userId
            });
        }
        console.log(`Profile found/created for user ${userId}`);
        res.status(200).json(profile);
    }
    catch (error) {
        console.error('Error in getUserProfile:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getUserProfile = getUserProfile;
// Update user profile
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        console.log(`Updating profile for user: ${userId}`);
        console.log('Update profile data received:', req.body);
        // Extract all possible fields from the request body
        const { 
        // Basic info
        height, weight, age, gender, diabetesType, diagnosisDate, 
        // Goals
        dailyWaterGoal, dailyCarbohydrateGoal, dailyProteinGoal, dailyExerciseGoal, 
        // Contact info
        phone, birthdate, emergencyContact, 
        // Medical info
        primaryDoctor, nextAppointment, allergies, healthMetrics } = req.body;
        let profile = yield Profile_1.Profile.findOne({ user: userId });
        if (!profile) {
            console.log(`No profile found for user ${userId}, creating one with provided data`);
            // Create a new profile with all fields
            profile = new Profile_1.Profile({
                user: userId,
                height,
                weight,
                age,
                gender,
                diabetesType,
                diagnosisDate,
                dailyWaterGoal,
                dailyCarbohydrateGoal,
                dailyProteinGoal,
                dailyExerciseGoal,
                phone,
                birthdate,
                emergencyContact,
                primaryDoctor,
                nextAppointment,
                allergies,
                healthMetrics
            });
        }
        else {
            console.log(`Updating existing profile for user ${userId}`);
            // Update all fields if provided
            if (height !== undefined)
                profile.height = height;
            if (weight !== undefined)
                profile.weight = weight;
            if (age !== undefined)
                profile.age = age;
            if (gender !== undefined)
                profile.gender = gender;
            if (diabetesType !== undefined)
                profile.diabetesType = diabetesType;
            if (diagnosisDate !== undefined)
                profile.diagnosisDate = diagnosisDate;
            // Goals
            if (dailyWaterGoal !== undefined)
                profile.dailyWaterGoal = dailyWaterGoal;
            if (dailyCarbohydrateGoal !== undefined)
                profile.dailyCarbohydrateGoal = dailyCarbohydrateGoal;
            if (dailyProteinGoal !== undefined)
                profile.dailyProteinGoal = dailyProteinGoal;
            if (dailyExerciseGoal !== undefined)
                profile.dailyExerciseGoal = dailyExerciseGoal;
            // Contact info
            if (phone !== undefined)
                profile.phone = phone;
            if (birthdate !== undefined)
                profile.birthdate = birthdate;
            if (emergencyContact !== undefined)
                profile.emergencyContact = emergencyContact;
            // Medical info
            if (primaryDoctor !== undefined)
                profile.primaryDoctor = primaryDoctor;
            if (nextAppointment !== undefined)
                profile.nextAppointment = nextAppointment;
            if (allergies !== undefined)
                profile.allergies = allergies;
            // Health metrics
            if (healthMetrics) {
                console.log('Updating health metrics:', healthMetrics);
                // Create a new healthMetrics object if it doesn't exist
                if (!profile.healthMetrics) {
                    profile.healthMetrics = {};
                }
                // Only update provided metrics
                if (healthMetrics.a1c) {
                    console.log('Updating a1c:', healthMetrics.a1c);
                    profile.healthMetrics.a1c = healthMetrics.a1c;
                }
                if (healthMetrics.bloodPressure) {
                    console.log('Updating bloodPressure:', healthMetrics.bloodPressure);
                    profile.healthMetrics.bloodPressure = healthMetrics.bloodPressure;
                }
                if (healthMetrics.weight) {
                    console.log('Updating weight metric:', healthMetrics.weight);
                    profile.healthMetrics.weight = healthMetrics.weight;
                }
                if (healthMetrics.cholesterol) {
                    console.log('Updating cholesterol:', healthMetrics.cholesterol);
                    profile.healthMetrics.cholesterol = healthMetrics.cholesterol;
                }
            }
        }
        yield profile.save();
        console.log(`Profile saved successfully for user ${userId}`);
        res.status(200).json(profile);
    }
    catch (error) {
        console.error('Error in updateProfile:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.updateProfile = updateProfile;
