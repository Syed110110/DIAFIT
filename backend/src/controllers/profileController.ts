import { Request, Response } from 'express';
import { Profile } from '../models/Profile';

// Get user profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    console.log(`Getting profile for user: ${userId}`);
    
    let profile = await Profile.findOne({ user: userId });
    
    if (!profile) {
      // Create a default profile if none exists
      console.log(`No profile found for user ${userId}, creating one`);
      profile = await Profile.create({
        user: userId
      });
    }
    
    console.log(`Profile found/created for user ${userId}`);
    res.status(200).json(profile);
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    console.log(`Updating profile for user: ${userId}`);
    console.log('Update profile data received:', req.body);
    
    // Extract all possible fields from the request body
    const {
      // Basic info
      height,
      weight,
      age,
      gender,
      diabetesType,
      diagnosisDate,
      
      // Goals
      dailyWaterGoal,
      dailyCarbohydrateGoal,
      dailyProteinGoal,
      dailyExerciseGoal,
      
      // Contact info
      phone,
      birthdate,
      emergencyContact,
      
      // Medical info
      primaryDoctor,
      nextAppointment,
      allergies,
      healthMetrics
    } = req.body;
    
    let profile = await Profile.findOne({ user: userId });
    
    if (!profile) {
      console.log(`No profile found for user ${userId}, creating one with provided data`);
      // Create a new profile with all fields
      profile = new Profile({
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
    } else {
      console.log(`Updating existing profile for user ${userId}`);
      // Update all fields if provided
      if (height !== undefined) profile.height = height;
      if (weight !== undefined) profile.weight = weight;
      if (age !== undefined) profile.age = age;
      if (gender !== undefined) profile.gender = gender;
      if (diabetesType !== undefined) profile.diabetesType = diabetesType;
      if (diagnosisDate !== undefined) profile.diagnosisDate = diagnosisDate;
      
      // Goals
      if (dailyWaterGoal !== undefined) profile.dailyWaterGoal = dailyWaterGoal;
      if (dailyCarbohydrateGoal !== undefined) profile.dailyCarbohydrateGoal = dailyCarbohydrateGoal;
      if (dailyProteinGoal !== undefined) profile.dailyProteinGoal = dailyProteinGoal;
      if (dailyExerciseGoal !== undefined) profile.dailyExerciseGoal = dailyExerciseGoal;
      
      // Contact info
      if (phone !== undefined) profile.phone = phone;
      if (birthdate !== undefined) profile.birthdate = birthdate;
      if (emergencyContact !== undefined) profile.emergencyContact = emergencyContact;
      
      // Medical info
      if (primaryDoctor !== undefined) profile.primaryDoctor = primaryDoctor;
      if (nextAppointment !== undefined) profile.nextAppointment = nextAppointment;
      if (allergies !== undefined) profile.allergies = allergies;
      
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
    
    await profile.save();
    console.log(`Profile saved successfully for user ${userId}`);
    
    res.status(200).json(profile);
  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}; 