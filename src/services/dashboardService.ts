import api, { safeApiCall, ApiError } from './api';
import mockBackendService, { shouldUseMockBackend } from './mockBackendService';

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

// Use real backend by default, force disable mock backend
const useMockBackend = false;

// Helper function to fetch with retry and fallback
const fetchWithRetryAndFallback = async (apiCall: Function, fallbackData: any) => {
  try {
    const response = await apiCall();
    if (response) {
      return response;
    } else {
      console.warn('API call returned empty data, using fallback data');
      return fallbackData;
    }
  } catch (error) {
    console.error('API call failed with error, using fallback data:', error);
    return fallbackData;
  }
};

// Log that we're using the real backend
console.warn('Using real backend for all services. Data will be stored in MongoDB Atlas.');

// Helper function to safely get data with retry logic
const fetchWithRetry = async <T>(
  apiCall: () => Promise<T>,
  fallbackValue: T,
  maxRetries: number = 2,
  retryDelay: number = 1000
): Promise<T> => {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      retries++;
      console.error(`API call failed (attempt ${retries}/${maxRetries + 1}):`, error);
      
      // If we've reached max retries, return fallback
      if (retries > maxRetries) {
        console.warn('Max retries reached, using fallback value', fallbackValue);
        return fallbackValue;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  // This should never be reached due to the return in the catch block
  return fallbackValue;
};

// Profile service
export const profileService = {
  // Get user profile
  getProfile: async () => {
    try {
      const user = getCurrentUser();
      console.log('Fetching profile data for user:', user?._id || 'guest');
      
      // Try real backend
      try {
        const response = await safeApiCall(api.get('/profile'));
        console.log('Real backend profile data:', response);
        
        if (!response) {
          throw new Error('No data received from API');
        }
        
        return response;
      } catch (apiError) {
        console.error('Real backend error:', apiError);
        
        // Return default profile on error
        return { 
          name: user?.name || 'Guest User', 
          age: 30, 
          height: 170, 
          weight: 70, 
          diabetesType: 'Type 2'
        };
      }
    } catch (error) {
      console.error('Profile service error:', error);
      // Return default profile
      return { 
        name: 'Guest User', 
        age: 30, 
        height: 170, 
        weight: 70, 
        diabetesType: 'Type 2'
      };
    }
  },
  
  // Update user profile
  updateProfile: async (profileData: any) => {
    try {
      const user = getCurrentUser();
      console.log('Updating profile for user:', user?._id || 'guest');
      console.log('Profile data to update:', profileData);
      
      // Try real backend
      try {
        const response = await safeApiCall(api.put('/profile', profileData));
        console.log('Real backend profile update result:', response);
        
        if (!response) {
          console.error('No response received from profile update API');
          throw new Error('No data received from API');
        }
        
        // Backend returns the updated profile object, not a success flag
        return {
          ...response,
          success: true
        };
      } catch (apiError) {
        console.error('Real backend error:', apiError);
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile service error:', error);
      return { success: false, message: 'Failed to update profile' };
    }
  }
};

// Water intake service
export const waterService = {
  // Get storage key for water data
  getStorageKey: () => {
    const user = getCurrentUser();
    const userId = user?._id || 'guest';
    return `water_data_${userId}`;
  },
  
  // Get today's water intake
  getTodayWaterIntake: async () => {
    try {
      const user = getCurrentUser();
      console.log('Fetching today\'s water intake for user:', user?._id || 'guest');
      
      // Use mock backend if real backend is unavailable
      if (useMockBackend) {
        console.log('Using mock backend for water intake data');
        try {
          const mockData = await mockBackendService.getTodayWaterIntake();
          console.log('Mock water intake data:', mockData);
          return mockData;
        } catch (mockError) {
          console.error('Error with mock backend:', mockError);
          // Continue to try real backend as fallback
        }
      }
      
      // Try real backend
      try {
        const response = await safeApiCall(api.get('/water/today'));
        console.log('Real backend water intake data:', response);
        
        if (!response) {
          throw new Error('No data received from API');
        }
        
        return response;
      } catch (apiError) {
        console.error('Real backend error:', apiError);
        
        // If real backend fails, try mock backend as fallback
        if (!useMockBackend) {
          console.log('Falling back to mock backend after real backend failure');
          const mockData = await mockBackendService.getTodayWaterIntake();
          return mockData;
        }
        
        // Both backends failed
        throw apiError;
      }
    } catch (error) {
      console.error('All backends failed:', error);
      // Return default data
      return { 
        totalWaterIntake: 0, 
        dailyWaterGoal: 2000, 
        progress: 0,
        waterEntries: []
      };
    }
  },
  
  // Add water intake
  addWaterIntake: async (amount: number) => {
    try {
      const user = getCurrentUser();
      console.log('Adding water intake for user:', user?._id || 'guest', amount);
      
      // Use mock backend if real backend is unavailable
      if (useMockBackend) {
        console.log('Using mock backend for adding water intake');
        try {
          const result = await mockBackendService.addWaterIntake(amount);
          console.log('Mock add water intake result:', result);
          return result;
        } catch (mockError) {
          console.error('Error with mock backend:', mockError);
          // Continue to try real backend as fallback
        }
      }
      
      // Try real backend
      try {
        const response = await safeApiCall(api.post('/water', { amount }));
        console.log('Real backend add water intake result:', response);
        
        if (!response) {
          throw new Error('No data received from API');
        }
        
        return response;
      } catch (apiError) {
        console.error('Real backend error:', apiError);
        
        // If real backend fails, try mock backend as fallback
        if (!useMockBackend) {
          console.log('Falling back to mock backend after real backend failure');
          const result = await mockBackendService.addWaterIntake(amount);
          return result;
        }
        
        // Both backends failed
        throw apiError;
      }
    } catch (error) {
      console.error('All backends failed:', error);
      return { success: false, message: 'Failed to add water intake' };
    }
  },
  
  // Delete water entry
  deleteWaterEntry: async (entryId: string) => {
    try {
      const user = getCurrentUser();
      console.log('Deleting water entry for user:', user?._id || 'guest', entryId);
      
      // Use mock backend if real backend is unavailable
      if (useMockBackend) {
        console.log('Using mock backend for deleting water entry');
        try {
          const result = await mockBackendService.deleteWaterEntry(entryId);
          console.log('Mock delete water entry result:', result);
          return result;
        } catch (mockError) {
          console.error('Error with mock backend:', mockError);
          // Continue to try real backend as fallback
        }
      }
      
      // Try real backend
      try {
        const response = await safeApiCall(api.delete(`/water/${entryId}`));
        console.log('Real backend delete water entry result:', response);
        
        if (!response) {
          throw new Error('No data received from API');
        }
        
        return response;
      } catch (apiError) {
        console.error('Real backend error:', apiError);
        
        // If real backend fails, try mock backend as fallback
        if (!useMockBackend) {
          console.log('Falling back to mock backend after real backend failure');
          const result = await mockBackendService.deleteWaterEntry(entryId);
          return result;
        }
        
        // Both backends failed
        throw apiError;
      }
    } catch (error) {
      console.error('All backends failed:', error);
      return { success: false, message: 'Failed to delete water entry' };
    }
  }
};

// Nutrition service
export const nutritionService = {
  // Cache key for local storage
  CACHE_KEY: 'diafit_nutrition_cache',
  
  // Save current state to cache
  saveToCache: (data: any) => {
    console.log('Saving nutrition data to cache:', data);
    try {
      localStorage.setItem(nutritionService.CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save nutrition data to cache:', error);
    }
  },
  
  // Get data from cache
  getFromCache: () => {
    try {
      const cached = localStorage.getItem(nutritionService.CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Failed to load nutrition data from cache:', error);
    }
    return null;
  },
  
  // Get today's nutrition data
  getTodayNutrition: async () => {
    try {
      const user = getCurrentUser();
      console.log('Fetching today\'s nutrition data for user:', user?._id || 'guest');
      
      // Always use real backend
      const useMockBackend = false;
      
      // Try real backend
      try {
        // JWT token will be added automatically by the API interceptor
        const response = await safeApiCall(api.get('/nutrition/today?fresh=true'));
        console.log('Real backend nutrition data:', response);
        
        if (!response) {
          throw new Error('No data received from API');
        }
        
        return nutritionService.processNutritionData(response);
      } catch (apiError) {
        console.error('Real backend error:', apiError);
        
        // If real backend fails, try mock backend as fallback only in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Falling back to mock backend in development environment');
          const mockData = await mockBackendService.getTodayNutrition();
          return nutritionService.processNutritionData(mockData);
        }
        
        // Both backends failed, return empty data
        throw apiError;
      }
    } catch (error) {
      console.error('Backend failed:', error);
      
      // Return empty data structure
      return { 
        totalCalories: 0,
        totalCarbs: 0,
        totalProtein: 0,
        totalFat: 0,
        entries: []
      };
    }
  },
  
  // Helper function to process nutrition data
  processNutritionData: (data: any) => {
    // Handle the case where data could be in different formats from the backend
    if (!data) return { 
      totalCalories: 0,
      totalCarbs: 0,
      totalProtein: 0,
      totalFat: 0,
      entries: [] 
    };
      
    // Check if data is in the format from the backend
    let entries = [];
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCalories = 0;
    
    // Check if data has nutritionEntries (from backend controller)
    if (data.nutritionEntries && Array.isArray(data.nutritionEntries)) {
      console.log('Processing data with nutritionEntries format');
      
      // Map each entry to a consistent format
      entries = data.nutritionEntries.flatMap(entry => {
        if (!entry.foods || !Array.isArray(entry.foods)) return [];
        
        return entry.foods.map(food => ({
          _id: entry._id || `temp-${Date.now()}`,
          meal: entry.meal || 'snack',
          foodId: food._id || 'unknown',
          servingSize: 1,
          foodName: food.name,
          calories: food.calories || 0,
          carbs: food.carbohydrates || 0,
          protein: food.protein || 0,
          fat: food.fat || 0,
          timestamp: entry.date || new Date()
        }));
      });
      
      // Use the totals from the API if available
      if (data.totals) {
        totalCarbs = data.totals.carbohydrates || 0;
        totalProtein = data.totals.protein || 0;
        totalFat = data.totals.fat || 0;
        totalCalories = data.totals.calories || 0;
      }
    }
    // If we have entries directly in the data
    else if (data.entries && Array.isArray(data.entries)) {
      console.log('Processing data with entries array');
      entries = data.entries;
      
      // Ensure entries have consistent property names
      entries = entries.map((entry) => {
        // Ensure the entry has foodName property
        if (!entry.foodName && entry.name) {
          entry.foodName = entry.name;
        }
        
        // Convert string numbers to actual numbers
        if (entry.calories) entry.calories = Number(entry.calories);
        if (entry.carbs) entry.carbs = Number(entry.carbs);
        if (entry.protein) entry.protein = Number(entry.protein);
        if (entry.fat) entry.fat = Number(entry.fat);
        
        return entry;
      });
      
      // Get totals
      totalCalories = data.totalCalories || 0;
      totalCarbs = data.totalCarbs || 0;
      totalProtein = data.totalProtein || 0;
      totalFat = data.totalFat || 0;
    }
    
    // Calculate totals from entries if we don't have them yet
    if ((totalCalories === 0 && totalCarbs === 0 && totalProtein === 0) && entries.length > 0) {
      entries.forEach(entry => {
        totalCarbs += Number(entry.carbs) || 0;
        totalProtein += Number(entry.protein) || 0;
        totalFat += Number(entry.fat) || 0;
        totalCalories += Number(entry.calories) || 0;
      });
    }
    
    return {
      totalCalories,
      totalCarbs,
      totalProtein,
      totalFat,
      entries
    };
  },
  
  // Get nutrition data by date
  getNutritionByDate: async (date: string) => {
    try {
      const user = getCurrentUser();
      console.log(`Fetching nutrition data for date: ${date} for user:`, user?._id || 'guest');
      
      // Always use real backend
      const useMockBackend = false;
      
      // Try real backend
      try {
        // JWT token will be added automatically by the API interceptor
        const response = await safeApiCall(api.get(`/nutrition/date/${date}`));
        console.log(`Real backend nutrition data for ${date}:`, response);
        
        if (response) {
          return nutritionService.processNutritionData(response);
        }
      } catch (apiError) {
        console.error(`Real backend error for ${date}:`, apiError);
        
        // If real backend fails, try mock backend as fallback only in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Falling back to mock backend in development environment');
          const mockData = await mockBackendService.getNutritionByDate(date);
          return nutritionService.processNutritionData(mockData);
        }
        
        throw apiError;
      }
      
      // Return empty data if no data from any backend
      return { 
        date,
        totalCalories: 0,
        totalCarbs: 0,
        totalProtein: 0,
        totalFat: 0,
        entries: []
      };
    } catch (error) {
      console.error(`Error fetching nutrition data for date ${date}:`, error);
      
      // Return empty data structure
      return { 
        date,
        totalCalories: 0,
        totalCarbs: 0,
        totalProtein: 0,
        totalFat: 0,
        entries: []
      };
    }
  },
  
  // Add food entry with direct saving to the backend
  addFoodEntry: async (foodData: any) => {
    try {
      const user = getCurrentUser();
      console.log('Sending food data to API for user:', user?._id || 'guest', foodData);
      
      // Make sure to include the date for proper backend processing
      if (!foodData.date) {
        foodData.date = new Date().toISOString().split('T')[0];
      }
      
      // Format the data for the backend
      const backendData = {
        meal: foodData.meal || 'snack',
        foods: [{
          name: foodData.foodName,
          carbohydrates: parseFloat(foodData.carbs) || 0,
          protein: parseFloat(foodData.protein) || 0,
          fat: parseFloat(foodData.fat) || 0,
          calories: parseFloat(foodData.calories) || 0
        }]
      };
      
      console.log('Formatted data for backend:', backendData);
      
      // Always use real backend
      const useMockBackend = false;
      
      // Try real backend
      try {
        // JWT token will be added automatically by the API interceptor
        const response = await safeApiCall(api.post('/nutrition', backendData));
        console.log('Real backend add food response:', response);
        
        // After successful addition, get the updated data
        try {
          const updatedData = await safeApiCall(api.get('/nutrition/today?fresh=true'));
          console.log('Updated nutrition data from API:', updatedData);
          
          if (updatedData) {
            return nutritionService.processNutritionData(updatedData);
          }
        } catch (refreshError) {
          console.warn('Could not refresh data after adding entry:', refreshError);
          // Continue despite refresh error - the entry was added successfully
        }
        
        // If we couldn't refresh data, return the response
        return response;
      } catch (apiError) {
        console.error('Real backend error for addFoodEntry:', apiError);
        
        // If real backend fails, try mock backend as fallback only in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Falling back to mock backend in development environment');
          const mockResponse = await mockBackendService.addFoodEntry(foodData);
          return nutritionService.processNutritionData(mockResponse);
        }
        
        throw apiError;
      }
    } catch (error) {
      console.error('Error adding food entry:', error);
      throw error;
    }
  },
  
  // Delete nutrition entry
  deleteNutritionEntry: async (entryId: string) => {
    try {
      const user = getCurrentUser();
      console.log('Deleting nutrition entry for user:', user?._id || 'guest', 'Entry ID:', entryId);
      
      // Always use real backend
      const useMockBackend = false;
      
      // Try real backend
      try {
        // JWT token will be added automatically by the API interceptor
        const response = await safeApiCall(api.delete(`/nutrition/${entryId}`));
        console.log('Real backend delete nutrition entry response:', response);
        
        // After successful deletion, get the updated data
        try {
          const updatedData = await safeApiCall(api.get('/nutrition/today?fresh=true'));
          console.log('Updated nutrition data from API after deletion:', updatedData);
          
          if (updatedData) {
            return nutritionService.processNutritionData(updatedData);
          }
        } catch (refreshError) {
          console.warn('Could not refresh data after deleting entry:', refreshError);
          // Continue despite refresh error - the entry was deleted successfully
        }
        
        // If we couldn't refresh data, return empty data
        return { 
          totalCalories: 0,
          totalCarbs: 0,
          totalProtein: 0,
          totalFat: 0,
          entries: []
        };
      } catch (apiError) {
        console.error('Real backend error for deleteNutritionEntry:', apiError);
        
        // If real backend fails, try mock backend as fallback only in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Falling back to mock backend in development environment');
          const mockResponse = await mockBackendService.deleteNutritionEntry(entryId);
          return nutritionService.processNutritionData(mockResponse);
        }
        
        throw apiError;
      }
    } catch (error) {
      console.error('Error deleting nutrition entry:', error);
      // Create a meaningful error message
      const errorMessage = error instanceof Error ? 
        error.message : 
        'Failed to delete food entry. Please try again.';
      
      throw new Error(errorMessage);
    }
  },
  
  // Get food database
  getFoodDatabase: async () => {
    // Always use real backend
    const useMockBackend = false;
    
    // Try real backend first, fall back to hardcoded data if needed
    try {
      // JWT token will be added automatically by the API interceptor
      const response = await safeApiCall(api.get('/nutrition/foods'));
      console.log('Food database from API:', response);
      
      if (response && Array.isArray(response)) {
        return response;
      }
    } catch (apiError) {
      console.error('Error fetching food database from API:', apiError);
    }
    
    // Fallback food database if API fails
    console.log('Using fallback food database');
    return [
      { id: '1', name: 'Oatmeal', calories: 150, carbs: 27, protein: 5, fat: 3, glycemicIndex: 55 },
      { id: '2', name: 'Whole Grain Bread', calories: 80, carbs: 15, protein: 4, fat: 1, glycemicIndex: 51 },
      { id: '3', name: 'Eggs', calories: 70, carbs: 0, protein: 6, fat: 5, glycemicIndex: 0 },
      { id: '4', name: 'Chicken Breast', calories: 165, carbs: 0, protein: 31, fat: 3.6, glycemicIndex: 0 },
      { id: '5', name: 'Brown Rice', calories: 215, carbs: 45, protein: 5, fat: 1.8, glycemicIndex: 50 },
      { id: '6', name: 'Salmon', calories: 206, carbs: 0, protein: 22, fat: 13, glycemicIndex: 0 },
      { id: '7', name: 'Broccoli', calories: 55, carbs: 11, protein: 3.7, fat: 0.6, glycemicIndex: 15 },
      { id: '8', name: 'Greek Yogurt', calories: 130, carbs: 6, protein: 17, fat: 4, glycemicIndex: 11 },
      { id: '9', name: 'Almonds', calories: 164, carbs: 6, protein: 6, fat: 14, glycemicIndex: 15 },
      { id: '10', name: 'Apple', calories: 95, carbs: 25, protein: 0.5, fat: 0.3, glycemicIndex: 36 }
    ];
  }
};

// Exercise service
export const exerciseService = {
  // Get today's exercise data
  getTodayExercise: async () => {
    try {
      const user = getCurrentUser();
      console.log('Fetching today\'s exercise data for user:', user?._id || 'guest');
      
      // Use mock backend if real backend is unavailable
      if (useMockBackend) {
        console.log('Using mock backend for exercise data');
        try {
          const mockData = await mockBackendService.getTodayExercise();
          console.log('Mock exercise data:', mockData);
          return mockData;
        } catch (mockError) {
          console.error('Error with mock backend:', mockError);
          // Continue to try real backend as fallback
        }
      }
      
      // Try real backend
      try {
        const response = await safeApiCall(api.get('/exercise/today'));
        console.log('Real backend exercise data:', response);
        
        if (!response) {
          throw new Error('No data received from API');
        }
        
        // The backend should now be returning entries directly, but we'll handle both formats
        const entries = Array.isArray(response.entries) 
          ? response.entries 
          : (Array.isArray(response.exerciseEntries) ? response.exerciseEntries : []);
        
        return {
          totalDuration: response.totalDuration || 0,
          totalCaloriesBurned: response.totalCaloriesBurned || 0,
          entries: entries
        };
      } catch (apiError) {
        console.error('Real backend error:', apiError);
        
        // If real backend fails, try mock backend as fallback
        if (!useMockBackend) {
          console.log('Falling back to mock backend after real backend failure');
          const mockData = await mockBackendService.getTodayExercise();
          return mockData;
        }
        
        // Both backends failed
        throw apiError;
      }
    } catch (error) {
      console.error('All backends failed:', error);
      // Return default data
      return { 
        totalDuration: 0,
        totalCaloriesBurned: 0,
        entries: []
      };
    }
  },
  
  // Add exercise entry
  addExerciseEntry: async (exerciseData: any) => {
    try {
      const user = getCurrentUser();
      console.log('Adding exercise entry for user:', user?._id || 'guest', exerciseData);
      
      // Use mock backend if real backend is unavailable
      if (useMockBackend) {
        console.log('Using mock backend for adding exercise entry');
        try {
          const result = await mockBackendService.addExerciseEntry(exerciseData);
          console.log('Mock add exercise entry result:', result);
          return result;
        } catch (mockError) {
          console.error('Error with mock backend:', mockError);
          // Continue to try real backend as fallback
        }
      }
      
      // Try real backend
      try {
        const exercisePayload = {
          type: exerciseData.type,
          duration: Number(exerciseData.duration),
          caloriesBurned: Number(exerciseData.caloriesBurned) || Math.round(Number(exerciseData.duration) * (exerciseData.caloriesPerMinute || 5)),
          notes: exerciseData.notes || ''
        };
        
        console.log('Sending exercise data to API:', exercisePayload);
        const response = await safeApiCall(api.post('/exercise', exercisePayload));
        console.log('Real backend add exercise result:', response);
        
        if (!response) {
          throw new Error('No data received from API');
        }
        
        // After successful addition, get the updated data
        return await exerciseService.getTodayExercise();
      } catch (apiError) {
        console.error('Real backend error:', apiError);
        
        // If real backend fails, try mock backend as fallback
        if (!useMockBackend) {
          console.log('Falling back to mock backend after real backend failure');
          const result = await mockBackendService.addExerciseEntry(exerciseData);
          return result;
        }
        
        // Both backends failed
        throw apiError;
      }
    } catch (error) {
      console.error('All backends failed:', error);
      return { success: false, message: 'Failed to add exercise entry' };
    }
  },
  
  // Delete exercise entry
  deleteExerciseEntry: async (entryId: string) => {
    try {
      const user = getCurrentUser();
      console.log('Deleting exercise entry for user:', user?._id || 'guest', entryId);
      
      // Use mock backend if real backend is unavailable
      if (useMockBackend) {
        console.log('Using mock backend for deleting exercise entry');
        try {
          const result = await mockBackendService.deleteExerciseEntry(entryId);
          console.log('Mock delete exercise entry result:', result);
          return result;
        } catch (mockError) {
          console.error('Error with mock backend:', mockError);
          // Continue to try real backend as fallback
        }
      }
      
      // Try real backend
      try {
        const response = await safeApiCall(api.delete(`/exercise/${entryId}`));
        console.log('Real backend delete exercise entry result:', response);
        
        if (!response) {
          throw new Error('No data received from API');
        }
        
        // After successful deletion, get the updated data
        return await exerciseService.getTodayExercise();
      } catch (apiError) {
        console.error('Real backend error:', apiError);
        
        // If real backend fails, try mock backend as fallback
        if (!useMockBackend) {
          console.log('Falling back to mock backend after real backend failure');
          const result = await mockBackendService.deleteExerciseEntry(entryId);
          return result;
        }
        
        // Both backends failed
        throw apiError;
      }
    } catch (error) {
      console.error('All backends failed:', error);
      return { success: false, message: 'Failed to delete exercise entry' };
    }
  },
  
  // Get exercise types
  getExerciseTypes: async () => {
    // Use mock backend if real backend is unavailable
    if (useMockBackend) {
      console.log('Using mock backend for exercise types');
      return mockBackendService.getExerciseTypes();
    }
    
    // Try the real backend with fallback to hardcoded types
    return fetchWithRetryAndFallback(
      async () => await safeApiCall(api.get('/exercise/types')),
      [
        { id: '1', name: 'Walking', caloriesPerMinute: 4, intensity: 'light' },
        { id: '2', name: 'Running', caloriesPerMinute: 10, intensity: 'high' },
        { id: '3', name: 'Cycling', caloriesPerMinute: 7, intensity: 'medium' },
        { id: '4', name: 'Swimming', caloriesPerMinute: 8, intensity: 'medium' },
        { id: '5', name: 'Yoga', caloriesPerMinute: 3, intensity: 'light' }
      ]
    );
  }
};

// Health tips service
export const tipService = {
  // Get random health tip
  getRandomTip: async (category?: string) => {
    const endpoint = category ? `/tips/random?category=${category}` : '/tips/random';
    
    return fetchWithRetryAndFallback(
      async () => await safeApiCall(api.get(endpoint)),
      { 
        tip: 'Stay hydrated by drinking water throughout the day.',
        category: 'General',
        _id: 'fallback-tip-id'
      }
    );
  }
};

// Diet plan service
export const dietPlanService = {
  // Get all user's diet plans
  getUserDietPlans: async () => {
    try {
      const user = getCurrentUser();
      console.log('Fetching diet plans for user:', user?._id || 'guest');
      
      // Try real backend
      try {
        const response = await safeApiCall(api.get('/dietplans'));
        console.log('Diet plans from backend:', response);
        
        if (!response) {
          throw new Error('No data received from API');
        }
        
        return response;
      } catch (apiError) {
        console.error('Backend error fetching diet plans:', apiError);
        
        // If API fails, return the plans from localStorage as fallback
        console.log('Falling back to localStorage for diet plans');
        const userId = user?._id || 'guest';
        try {
          const savedPlansString = localStorage.getItem(`dietPlans_${userId}`);
          if (savedPlansString) {
            return JSON.parse(savedPlansString);
          }
        } catch (e) {
          console.error('Error accessing localStorage:', e);
        }
        
        // If both backend and localStorage fail, return empty array
        return [];
      }
    } catch (error) {
      console.error('All backends failed:', error);
      return [];
    }
  },
  
  // Save a diet plan to backend
  saveDietPlan: async (planData: any) => {
    try {
      const user = getCurrentUser();
      console.log('Saving diet plan for user:', user?._id || 'guest');
      
      // Format data for the backend
      const backendData = {
        name: planData.name || `Diet Plan - ${new Date().toLocaleDateString()}`,
        meals: planData.meals || [],
        totalCarbs: planData.totalCarbs || 0,
        totalCalories: planData.totalCalories || 0
      };
      
      console.log('Diet plan data to save:', backendData);
      
      // Try real backend
      try {
        // If plan has an _id from MongoDB, update it, otherwise create new
        let response;
        if (planData._id) {
          response = await safeApiCall(api.put(`/dietplans/${planData._id}`, backendData));
          console.log('Updated diet plan in backend:', response);
        } else {
          response = await safeApiCall(api.post('/dietplans', backendData));
          console.log('Created new diet plan in backend:', response);
        }
        
        if (!response) {
          throw new Error('No data received from API');
        }
        
        return response;
      } catch (apiError) {
        console.error('Backend error saving diet plan:', apiError);
        
        // If API fails, save to localStorage as fallback
        console.log('Falling back to localStorage for saving diet plan');
        const userId = user?._id || 'guest';
        try {
          // Get existing plans
          const savedPlansString = localStorage.getItem(`dietPlans_${userId}`);
          let savedPlans = [];
          if (savedPlansString) {
            savedPlans = JSON.parse(savedPlansString);
          }
          
          // Create a new ID if needed
          if (!planData.id) {
            planData.id = Date.now().toString();
          }
          
          // Update or add the plan
          const updatedPlans = [
            ...savedPlans.filter((p: any) => p.id !== planData.id),
            planData
          ];
          
          // Save back to localStorage
          localStorage.setItem(`dietPlans_${userId}`, JSON.stringify(updatedPlans));
          
          return planData;
        } catch (e) {
          console.error('Error saving to localStorage:', e);
          throw e;
        }
      }
    } catch (error) {
      console.error('Error saving diet plan:', error);
      throw error;
    }
  },
  
  // Delete a diet plan
  deleteDietPlan: async (planId: string) => {
    try {
      const user = getCurrentUser();
      console.log('Deleting diet plan for user:', user?._id || 'guest', 'Plan ID:', planId);
      
      // Try real backend
      try {
        const response = await safeApiCall(api.delete(`/dietplans/${planId}`));
        console.log('Delete diet plan response from backend:', response);
        
        if (!response) {
          throw new Error('No data received from API');
        }
        
        return response;
      } catch (apiError) {
        console.error('Backend error deleting diet plan:', apiError);
        
        // If API fails, delete from localStorage as fallback
        console.log('Falling back to localStorage for deleting diet plan');
        const userId = user?._id || 'guest';
        try {
          // Get existing plans
          const savedPlansString = localStorage.getItem(`dietPlans_${userId}`);
          if (savedPlansString) {
            const savedPlans = JSON.parse(savedPlansString);
            const updatedPlans = savedPlans.filter((p: any) => p.id !== planId);
            localStorage.setItem(`dietPlans_${userId}`, JSON.stringify(updatedPlans));
          }
          
          return { success: true, message: 'Diet plan deleted from localStorage' };
        } catch (e) {
          console.error('Error deleting from localStorage:', e);
          throw e;
        }
      }
    } catch (error) {
      console.error('Error deleting diet plan:', error);
      throw error;
    }
  },
  
  // Get a diet plan by ID
  getDietPlanById: async (planId: string) => {
    try {
      const user = getCurrentUser();
      console.log('Fetching diet plan for user:', user?._id || 'guest', 'Plan ID:', planId);
      
      // Try real backend
      try {
        const response = await safeApiCall(api.get(`/dietplans/${planId}`));
        console.log('Diet plan from backend:', response);
        
        if (!response) {
          throw new Error('No data received from API');
        }
        
        return response;
      } catch (apiError) {
        console.error('Backend error fetching diet plan:', apiError);
        
        // If API fails, try localStorage as fallback
        console.log('Falling back to localStorage for diet plan');
        const userId = user?._id || 'guest';
        try {
          const savedPlansString = localStorage.getItem(`dietPlans_${userId}`);
          if (savedPlansString) {
            const savedPlans = JSON.parse(savedPlansString);
            const plan = savedPlans.find((p: any) => p.id === planId);
            if (plan) {
              return plan;
            }
          }
          throw new Error('Diet plan not found in localStorage');
        } catch (e) {
          console.error('Error accessing localStorage:', e);
          throw e;
        }
      }
    } catch (error) {
      console.error('All backends failed:', error);
      throw error;
    }
  }
}; 