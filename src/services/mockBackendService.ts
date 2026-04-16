/**
 * Mock Backend Service
 * 
 * This service provides a fallback implementation of the backend API
 * for development and testing purposes when the real backend is unavailable.
 * It stores data in localStorage and simulates API behavior.
 */

// Helper to get the current user from localStorage
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    return null;
  }
};

// Storage key for local data
const getStorageKey = (): string => {
  const user = getCurrentUser();
  const userId = user?._id || 'guest';
  
  return `diafit_mock_backend_data_${userId}`;
};

// Flag to check if we should use mock backend
export const shouldUseMockBackend = (): boolean => {
  // Check for explicit disable flag
  const useMockFlag = localStorage.getItem('use_mock_backend');
  if (useMockFlag === 'false') return false;

  // Check if we have a stored preference
  if (useMockFlag === 'true') return true;
  
  // Default to using mock backend if no preference is set
  return true;
};

// Utility to enable or disable mock backend
export const setUseMockBackend = (useIt: boolean): void => {
  localStorage.setItem('use_mock_backend', useIt ? 'true' : 'false');
  console.log(`Mock backend ${useIt ? 'enabled' : 'disabled'}. Refresh the page to apply.`);
};

// Get data from local storage
const getStoredData = (): any => {
  try {
    const data = localStorage.getItem(getStorageKey());
    if (!data) {
      // Initialize with empty data if nothing exists
      const initialData = createInitialData();
      saveData(initialData);
      return initialData;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error retrieving mock backend data:', error);
    const initialData = createInitialData();
    saveData(initialData);
    return initialData;
  }
};

// Save data to local storage
const saveData = (data: any): void => {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(data));
  } catch (error) {
    console.error('Error saving mock backend data:', error);
  }
};

// Create initial data structure
const createInitialData = (): any => {
  const today = new Date().toISOString().split('T')[0];
  
  return {
    nutrition: {
      // Initialize with today's date
      [today]: {
        date: today,
        totalCalories: 0,
        totalCarbs: 0,
        totalProtein: 0,
        totalFat: 0,
        entries: []
      }
    },
    exercise: {
      // Initialize with today's date
      [today]: {
        date: today,
        totalDuration: 0,
        totalCaloriesBurned: 0,
        entries: []
      }
    },
    profile: {
      name: 'Demo User',
      email: 'demo@diafit.com',
      height: 175,
      weight: 70,
      age: 35,
      gender: 'other',
      diabetesType: 'Type 2',
      dailyWaterGoal: 2000, // 2L in ml
      dailyCarbohydrateGoal: 150,
      dailyProteinGoal: 80,
      dailyExerciseGoal: 30,
      diagnosisDate: '2020-01-01',
      primaryDoctor: 'Dr. Smith',
      nextAppointment: '2023-12-15',
      healthMetrics: {
        a1c: { value: '6.5%', date: today },
        bloodPressure: { value: '120/80', date: today },
        cholesterol: { value: 'Total: 180, LDL: 100', date: today },
      }
    },
    exerciseTypes: [
      { id: '1', name: 'Walking', caloriesPerMinute: 4, intensity: 'light' },
      { id: '2', name: 'Running', caloriesPerMinute: 10, intensity: 'high' },
      { id: '3', name: 'Cycling', caloriesPerMinute: 7, intensity: 'medium' },
      { id: '4', name: 'Swimming', caloriesPerMinute: 8, intensity: 'medium' },
      { id: '5', name: 'Yoga', caloriesPerMinute: 3, intensity: 'light' },
      { id: '6', name: 'Weight Training', caloriesPerMinute: 6, intensity: 'medium' },
      { id: '7', name: 'HIIT', caloriesPerMinute: 12, intensity: 'high' },
      { id: '8', name: 'Dancing', caloriesPerMinute: 6, intensity: 'medium' },
      { id: '9', name: 'Pilates', caloriesPerMinute: 4, intensity: 'light' },
      { id: '10', name: 'Stretching', caloriesPerMinute: 2, intensity: 'light' }
    ],
    foods: [
      { id: '1', name: 'Oatmeal', calories: 150, carbs: 27, protein: 5, fat: 3, glycemicIndex: 55 },
      { id: '2', name: 'Whole Grain Bread', calories: 80, carbs: 15, protein: 4, fat: 1, glycemicIndex: 51 },
      { id: '3', name: 'Eggs', calories: 70, carbs: 0, protein: 6, fat: 5, glycemicIndex: 0 },
      { id: '4', name: 'Chicken Breast', calories: 165, carbs: 0, protein: 31, fat: 3.6, glycemicIndex: 0 },
      { id: '5', name: 'Brown Rice', calories: 215, carbs: 45, protein: 5, fat: 1.8, glycemicIndex: 50 },
      { id: '6', name: 'Salmon', calories: 206, carbs: 0, protein: 22, fat: 13, glycemicIndex: 0 },
      { id: '7', name: 'Broccoli', calories: 55, carbs: 11, protein: 3.7, fat: 0.6, glycemicIndex: 15 },
      { id: '8', name: 'Greek Yogurt', calories: 130, carbs: 6, protein: 17, fat: 4, glycemicIndex: 11 },
      { id: '9', name: 'Almonds', calories: 164, carbs: 6, protein: 6, fat: 14, glycemicIndex: 15 },
      { id: '10', name: 'Apple', calories: 95, carbs: 25, protein: 0.5, fat: 0.3, glycemicIndex: 36 },
      { id: '11', name: 'Sweet Potato', calories: 112, carbs: 26, protein: 2, fat: 0.1, glycemicIndex: 54 },
      { id: '12', name: 'Quinoa', calories: 120, carbs: 21, protein: 4, fat: 1.9, glycemicIndex: 53 },
      { id: '13', name: 'Avocado', calories: 160, carbs: 9, protein: 2, fat: 15, glycemicIndex: 15 },
      { id: '14', name: 'Lentils', calories: 230, carbs: 40, protein: 18, fat: 0.8, glycemicIndex: 30 },
      { id: '15', name: 'Spinach', calories: 23, carbs: 3.6, protein: 2.9, fat: 0.4, glycemicIndex: 0 }
    ],
    water: {
      [today]: {
        date: today,
        totalWaterIntake: 0,
        dailyWaterGoal: 2000, // 2L in ml
        waterEntries: []
      }
    }
  };
};

// Generate a unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// Add a helper function to format nutrition values
const formatNutritionValue = (value: number): number => {
  return Math.round(value * 10) / 10;
};

// Calculate totals from entries
const calculateTotals = (entries: any[]): any => {
  const totals = entries.reduce((totals, entry) => {
    return {
      totalCalories: totals.totalCalories + (Number(entry.calories) || 0),
      totalCarbs: totals.totalCarbs + (Number(entry.carbs) || 0),
      totalProtein: totals.totalProtein + (Number(entry.protein) || 0),
      totalFat: totals.totalFat + (Number(entry.fat) || 0)
    };
  }, {
    totalCalories: 0,
    totalCarbs: 0,
    totalProtein: 0,
    totalFat: 0
  });
  
  // Format the totals
  return {
    totalCalories: formatNutritionValue(totals.totalCalories),
    totalCarbs: formatNutritionValue(totals.totalCarbs), 
    totalProtein: formatNutritionValue(totals.totalProtein),
    totalFat: formatNutritionValue(totals.totalFat)
  };
};

// Process food entry (moved to a separate function for better organization)
const processFood = (foodEntry: any, mealType: string, data: any) => {
  // Find the food item
  const foodId = foodEntry.foodId || foodEntry.id;
  if (!foodId) {
    console.error('No foodId provided in the food entry:', foodEntry);
    throw new Error('Food ID not provided');
  }
  
  const foodItem = data.foods.find((food: any) => food.id === foodId);
  if (!foodItem) {
    console.error(`Food item with ID ${foodId} not found in database`);
    console.log('Available foods:', data.foods.map((f: any) => ({ id: f.id, name: f.name })));
    throw new Error('Food item not found');
  }
  
  // Use meal from specified level
  const meal = mealType || foodEntry.meal || 'breakfast';
  // Get serving size
  const servingSize = parseFloat(foodEntry.servingSize) || 1;
  
  // Create the entry using provided values with fallbacks
  const newEntry = {
    _id: generateId(),
    meal: meal,
    foodId: foodId,
    servingSize: servingSize,
    foodName: foodEntry.foodName || foodItem.name,
    calories: formatNutritionValue(parseFloat(foodEntry.calories) || (foodItem.calories * servingSize)),
    carbs: formatNutritionValue(parseFloat(foodEntry.carbs) || (foodItem.carbs * servingSize)),
    protein: formatNutritionValue(parseFloat(foodEntry.protein) || (foodItem.protein * servingSize)),
    fat: formatNutritionValue(parseFloat(foodEntry.fat) || (foodItem.fat * servingSize)),
    timestamp: new Date().toISOString()
  };
  
  console.log('Adding food entry:', newEntry);
  return newEntry;
};

// Mock API endpoints
const mockBackendService = {
  /**
   * Reset mock data store (for testing)
   */
  resetMockData: () => {
    const user = getCurrentUser();
    console.log('Resetting mock data to initial state for user:', user?._id || 'guest');
    try {
      const initialData = createInitialData();
      localStorage.setItem(getStorageKey(), JSON.stringify(initialData));
      return true;
    } catch (error) {
      console.error('Error resetting mock data:', error);
      return false;
    }
  },

  /**
   * Get user profile data
   */
  getProfile: async (): Promise<any> => {
    const user = getCurrentUser();
    const userId = user?._id || 'guest';
    console.log('Mock backend: Getting profile data for user:', userId);
    
    try {
      const data = getStoredData();
      
      // Check if profile data exists for this user
      if (!data.profile) {
        // Initialize profile with default values
        data.profile = {
          height: 170,
          weight: 70,
          age: 30,
          gender: 'other',
          diabetesType: 'Type 2',
          phone: '',
          birthdate: '',
          emergencyContact: '',
          dailyWaterGoal: 2000, // in ml
          dailyCarbohydrateGoal: 150,
          dailyProteinGoal: 80,
          dailyExerciseGoal: 30,
          primaryDoctor: '',
          nextAppointment: '',
          allergies: [],
          healthMetrics: {
            a1c: { value: "6.5%", date: new Date().toLocaleDateString() },
            bloodPressure: { value: "120/80", date: new Date().toLocaleDateString() },
            weight: { value: "70 kg", date: new Date().toLocaleDateString() },
            cholesterol: { value: "Total: 180, LDL: 100", date: new Date().toLocaleDateString() }
          }
        };
        
        // Save the initial profile data
        saveData(data);
      }
      
      return data.profile;
    } catch (error) {
      console.error('Error getting profile data from mock backend:', error);
      throw error;
    }
  },
  
  /**
   * Update user profile data
   */
  updateProfile: async (profileData: any): Promise<any> => {
    const user = getCurrentUser();
    const userId = user?._id || 'guest';
    console.log('Mock backend: Updating profile data for user:', userId, profileData);
    
    try {
      const data = getStoredData();
      
      // Initialize profile if it doesn't exist
      if (!data.profile) {
        data.profile = {};
      }
      
      // Update profile with new data
      data.profile = {
        ...data.profile,
        ...profileData
      };
      
      // Save updated data
      saveData(data);
      
      return { 
        success: true, 
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Error updating profile data in mock backend:', error);
      throw error;
    }
  },

  /**
   * Get today's nutrition data
   */
  getTodayNutrition: async (): Promise<any> => {
    const user = getCurrentUser();
    console.log('Mock backend: Getting today\'s nutrition data for user:', user?._id || 'guest');
    const today = new Date().toISOString().split('T')[0];
    const data = getStoredData();
    
    // Create today's entry if it doesn't exist
    if (!data.nutrition[today]) {
      data.nutrition[today] = {
        date: today,
        totalCalories: 0,
        totalCarbs: 0,
        totalProtein: 0,
        totalFat: 0,
        entries: []
      };
      saveData(data);
    }
    
    return data.nutrition[today];
  },
  
  /**
   * Get nutrition data by date
   */
  getNutritionByDate: async (date: string): Promise<any> => {
    const user = getCurrentUser();
    console.log(`Mock backend: Getting nutrition data for ${date} for user:`, user?._id || 'guest');
    const data = getStoredData();
    
    // Create entry for this date if it doesn't exist
    if (!data.nutrition[date]) {
      data.nutrition[date] = {
        date,
        totalCalories: 0,
        totalCarbs: 0,
        totalProtein: 0,
        totalFat: 0,
        entries: []
      };
      saveData(data);
    }
    
    return data.nutrition[date];
  },
  
  /**
   * Add a food entry
   */
  addFoodEntry: async (foodData: any): Promise<any> => {
    const user = getCurrentUser();
    console.log('Mock backend: Adding food entry for user:', user?._id || 'guest', foodData);
    
    try {
      // Get current data
      const data = getStoredData();
      const date = foodData.date || new Date().toISOString().split('T')[0];
      
      // Create entry for this date if it doesn't exist
      if (!data.nutrition[date]) {
        data.nutrition[date] = {
          date,
          totalCalories: 0,
          totalCarbs: 0,
          totalProtein: 0,
          totalFat: 0,
          entries: []
        };
      }
      
      // Process the food entry or entries
      if (Array.isArray(foodData.foods) && foodData.foods.length > 0) {
        const mealType = foodData.meal || 'breakfast';
        const addedEntries = foodData.foods.map(foodEntry => {
          const newEntry = processFood(foodEntry, mealType, data);
          // Add the entry to the data
          data.nutrition[date].entries.push(newEntry);
          return newEntry;
        });
        console.log(`Added ${addedEntries.length} food entries`);
      } else {
        // Handle direct food object
        const newEntry = processFood(foodData, foodData.meal || 'breakfast', data);
        // Add the entry to the data
        data.nutrition[date].entries.push(newEntry);
      }
      
      // Recalculate totals
      const totals = calculateTotals(data.nutrition[date].entries);
      data.nutrition[date] = {
        ...data.nutrition[date],
        ...totals
      };
      
      // Save data
      saveData(data);
      
      // Return updated data for the date
      return data.nutrition[date];
    } catch (error) {
      console.error('Error in mock backend addFoodEntry:', error);
      throw error;
    }
  },
  
  /**
   * Delete a nutrition entry
   */
  deleteNutritionEntry: async (entryId: string): Promise<any> => {
    const user = getCurrentUser();
    console.log('Mock backend: Deleting nutrition entry for user:', user?._id || 'guest', entryId);
    
    // Get current data
    const data = getStoredData();
    const today = new Date().toISOString().split('T')[0];
    
    // Find the entry in any date (usually it will be today)
    let dateWithEntry = today;
    let entryFound = false;
    
    Object.keys(data.nutrition).forEach(date => {
      const entries = data.nutrition[date].entries;
      const entryIndex = entries.findIndex((entry: any) => entry._id === entryId);
      
      if (entryIndex !== -1) {
        dateWithEntry = date;
        entryFound = true;
        
        // Remove the entry
        data.nutrition[date].entries.splice(entryIndex, 1);
        
        // If this was the last entry, explicitly set all values to zero
        if (data.nutrition[date].entries.length === 0) {
          console.log(`Last entry removed for ${date}, setting all values to zero`);
          data.nutrition[date] = {
            ...data.nutrition[date],
            totalCalories: 0,
            totalCarbs: 0,
            totalProtein: 0,
            totalFat: 0,
            entries: []
          };
        } else {
          // Otherwise recalculate totals
          const totals = calculateTotals(data.nutrition[date].entries);
          data.nutrition[date] = {
            ...data.nutrition[date],
            ...totals
          };
        }
      }
    });
    
    if (!entryFound) {
      throw new Error('Entry not found');
    }
    
    // Save data
    saveData(data);
    
    // Return updated data for the date
    return data.nutrition[dateWithEntry];
  },
  
  /**
   * Get the food database
   */
  getFoodDatabase: async (): Promise<any[]> => {
    const user = getCurrentUser();
    console.log('Mock backend: Getting food database for user:', user?._id || 'guest');
    const data = getStoredData();
    return data.foods;
  },
  
  /**
   * Get today's exercise data
   */
  getTodayExercise: async (): Promise<any> => {
    const user = getCurrentUser();
    console.log('Mock backend: Getting today\'s exercise data for user:', user?._id || 'guest');
    const today = new Date().toISOString().split('T')[0];
    const data = getStoredData();
    
    // Create today's entry if it doesn't exist
    if (!data.exercise[today]) {
      data.exercise[today] = {
        date: today,
        totalDuration: 0,
        totalCaloriesBurned: 0,
        entries: []
      };
      saveData(data);
    }
    
    return data.exercise[today];
  },
  
  /**
   * Get exercise types
   */
  getExerciseTypes: async (): Promise<any[]> => {
    const user = getCurrentUser();
    console.log('Mock backend: Getting exercise types for user:', user?._id || 'guest');
    const data = getStoredData();
    
    // Return formatted exercise types with id for proper selection in dropdown
    return data.exerciseTypes.map((type: any) => ({
      id: type.id,
      name: type.name,
      caloriesPerMinute: type.caloriesPerMinute,
      intensity: type.intensity
    }));
  },
  
  /**
   * Add an exercise entry
   */
  addExerciseEntry: async (exerciseData: any): Promise<any> => {
    const user = getCurrentUser();
    console.log('Mock backend: Adding exercise entry for user:', user?._id || 'guest', exerciseData);
    
    try {
      // Get current data
      const data = getStoredData();
      const date = exerciseData.date || new Date().toISOString().split('T')[0];
      
      // Create entry for this date if it doesn't exist
      if (!data.exercise[date]) {
        data.exercise[date] = {
          date,
          totalDuration: 0,
          totalCaloriesBurned: 0,
          entries: []
        };
      }
      
      // Find the exercise type
      const exerciseType = data.exerciseTypes.find((type: any) => type.id === exerciseData.typeId);
      
      if (!exerciseType) {
        console.error(`Exercise type with ID ${exerciseData.typeId} not found`);
        throw new Error('Exercise type not found');
      }
      
      // Calculate calories burned based on duration and exercise type
      const duration = Number(exerciseData.duration) || 0;
      const caloriesBurned = duration * (exerciseType.caloriesPerMinute || 5);
      
      // Create the entry
      const newEntry = {
        _id: generateId(),
        type: exerciseType.name,
        typeId: exerciseData.typeId,
        duration,
        caloriesBurned,
        date: new Date().toISOString(),
        notes: exerciseData.notes || ''
      };
      
      // Add the entry
      data.exercise[date].entries.push(newEntry);
      
      // Update totals
      data.exercise[date].totalDuration += duration;
      data.exercise[date].totalCaloriesBurned += caloriesBurned;
      
      // Save data
      saveData(data);
      
      // Return updated data for the date
      return data.exercise[date];
    } catch (error) {
      console.error('Error in mock backend addExerciseEntry:', error);
      throw error;
    }
  },
  
  /**
   * Delete an exercise entry
   */
  deleteExerciseEntry: async (entryId: string): Promise<any> => {
    const user = getCurrentUser();
    console.log('Mock backend: Deleting exercise entry for user:', user?._id || 'guest', entryId);
    
    // Get current data
    const data = getStoredData();
    const today = new Date().toISOString().split('T')[0];
    
    // Find the entry in any date
    let dateWithEntry = today;
    let entryFound = false;
    let deletedEntry;
    
    Object.keys(data.exercise).forEach(date => {
      const entries = data.exercise[date].entries;
      const entryIndex = entries.findIndex((entry: any) => entry._id === entryId);
      
      if (entryIndex !== -1) {
        dateWithEntry = date;
        entryFound = true;
        deletedEntry = entries[entryIndex];
        
        // Remove the entry
        data.exercise[date].entries.splice(entryIndex, 1);
        
        // Update totals
        data.exercise[date].totalDuration -= deletedEntry.duration || 0;
        data.exercise[date].totalCaloriesBurned -= deletedEntry.caloriesBurned || 0;
        
        // Ensure values don't go negative
        data.exercise[date].totalDuration = Math.max(0, data.exercise[date].totalDuration);
        data.exercise[date].totalCaloriesBurned = Math.max(0, data.exercise[date].totalCaloriesBurned);
      }
    });
    
    if (!entryFound) {
      throw new Error('Entry not found');
    }
    
    // Save data
    saveData(data);
    
    // Return updated data for the date
    return data.exercise[dateWithEntry];
  },
  
  /**
   * Get today's water intake
   */
  getTodayWaterIntake: async (): Promise<any> => {
    const user = getCurrentUser();
    console.log('Mock backend: Getting today\'s water intake for user:', user?._id || 'guest');
    
    const data = getStoredData();
    const today = new Date().toISOString().split('T')[0];
    
    // Create water data for today if it doesn't exist
    if (!data.water) {
      data.water = {};
    }
    
    if (!data.water[today]) {
      const userProfile = data.profile || {};
      const dailyGoal = userProfile.dailyWaterGoal || 2000; // Default to 2000ml (2L)
      
      data.water[today] = {
        date: today,
        totalWaterIntake: 0,
        dailyWaterGoal: dailyGoal,
        waterEntries: []
      };
      
      saveData(data);
    }
    
    return data.water[today];
  },
  
  /**
   * Add water intake
   */
  addWaterIntake: async (amount: number): Promise<any> => {
    const user = getCurrentUser();
    console.log('Mock backend: Adding water intake for user:', user?._id || 'guest', amount);
    
    const data = getStoredData();
    const today = new Date().toISOString().split('T')[0];
    
    // Create water data for today if it doesn't exist
    if (!data.water) {
      data.water = {};
    }
    
    if (!data.water[today]) {
      const userProfile = data.profile || {};
      const dailyGoal = userProfile.dailyWaterGoal || 2000;
      
      data.water[today] = {
        date: today,
        totalWaterIntake: 0,
        dailyWaterGoal: dailyGoal,
        waterEntries: []
      };
    }
    
    // Create new entry
    const newEntry = {
      _id: generateId(),
      amount: amount,
      date: today,
      createdAt: new Date().toISOString()
    };
    
    // Add entry and update total
    data.water[today].waterEntries.push(newEntry);
    data.water[today].totalWaterIntake += amount;
    
    // Save data
    saveData(data);
    
    return {
      success: true,
      message: 'Water intake added successfully',
      entry: newEntry,
      data: data.water[today]
    };
  },
  
  /**
   * Delete water entry
   */
  deleteWaterEntry: async (entryId: string): Promise<any> => {
    const user = getCurrentUser();
    console.log('Mock backend: Deleting water entry for user:', user?._id || 'guest', entryId);
    
    const data = getStoredData();
    const today = new Date().toISOString().split('T')[0];
    
    // Check if water data exists
    if (!data.water || !data.water[today]) {
      return {
        success: false,
        message: 'No water data found for today'
      };
    }
    
    // Find the entry to delete
    const entryIndex = data.water[today].waterEntries.findIndex((entry: any) => entry._id === entryId);
    
    if (entryIndex === -1) {
      return {
        success: false,
        message: 'Water entry not found'
      };
    }
    
    // Get the amount before removing
    const amount = data.water[today].waterEntries[entryIndex].amount;
    
    // Remove the entry
    data.water[today].waterEntries.splice(entryIndex, 1);
    
    // Update total (ensure it doesn't go below 0)
    data.water[today].totalWaterIntake = Math.max(0, data.water[today].totalWaterIntake - amount);
    
    // Save data
    saveData(data);
    
    return {
      success: true,
      message: 'Water entry deleted successfully',
      data: data.water[today]
    };
  },

  /**
   * Update water goal (used by components to sync data)
   */
  updateWaterGoal: async (goal: number): Promise<any> => {
    const user = getCurrentUser();
    console.log('Mock backend: Updating water goal for user:', user?._id || 'guest', goal);
    
    const data = getStoredData();
    const today = new Date().toISOString().split('T')[0];
    
    // Create water data structure if needed
    if (!data.water) {
      data.water = {};
    }
    
    // Create today's entry if needed
    if (!data.water[today]) {
      data.water[today] = {
        date: today,
        totalWaterIntake: 0,
        dailyWaterGoal: goal,
        waterEntries: []
      };
    } else {
      // Update goal in today's data
      data.water[today].dailyWaterGoal = goal;
    }
    
    // Also update the goal in the user profile
    if (data.profile) {
      data.profile.dailyWaterGoal = goal;
    }
    
    // Save data
    saveData(data);
    
    return {
      success: true,
      message: 'Water goal updated successfully',
      data: data.water[today]
    };
  }
};

// Declare window object with our custom properties for TypeScript
declare global {
  interface Window {
    mockBackendService: typeof mockBackendService;
    resetMockData: typeof mockBackendService.resetMockData;
  }
}

// Export the service
export const resetMockData = mockBackendService.resetMockData;
export { mockBackendService };
export default mockBackendService;

// Expose methods for debugging 
// @ts-ignore - Add to window object for debugging
window.mockBackendService = mockBackendService;
// @ts-ignore - Add reset function to window
window.resetMockData = mockBackendService.resetMockData; 