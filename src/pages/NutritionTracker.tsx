import React, { useState, useEffect, useRef } from 'react';
import { 
  Apple, 
  Search, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Calendar,
  Clock,
  AlertCircle,
  Info,
  BarChart4,
  User,
  Pizza,
  ChevronLeft,
  ChevronRight,
  RefreshCcw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { nutritionService, profileService } from '../services/dashboardService';
import { shouldUseMockBackend } from '../services/mockBackendService';

// Safe array access helper to prevent TypeErrors
function safeArrayLength<T>(arr: T[] | null | undefined): number {
  if (!arr) return 0;
  try {
    return Array.isArray(arr) ? arr.length : 0;
  } catch (error) {
    console.error('Error getting array length:', error);
    return 0;
  }
}

// Safe object property access helper
function safeAccess<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  try {
    return obj && obj[key];
  } catch (error) {
    console.error(`Error accessing ${String(key)}:`, error);
    return undefined;
  }
}

// TypeScript interfaces
interface FoodItem {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  glycemicIndex: number | null;
}

interface NutritionEntry {
  _id?: string;
  meal: string;
  foodId: string;
  servingSize: number;
  timestamp?: Date;
  foodName?: string;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
}

interface NutritionSummary {
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  entries: NutritionEntry[];
  carbsGoal: number;
  proteinGoal: number;
}

// Add this helper function near the top with the other helper functions
function formatNutritionValue(value: number): number {
  // Round to 1 decimal place and remove trailing zeros
  return Math.round(value * 10) / 10;
}

const NutritionTracker: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMealType, setSelectedMealType] = useState<string>('breakfast');
  const [servingSize, setServingSize] = useState<number>(1);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>([]);
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [nutritionData, setNutritionData] = useState<NutritionSummary>({
    totalCalories: 0,
    totalCarbs: 0,
    totalProtein: 0,
    totalFat: 0,
    entries: [],
    carbsGoal: 150,
    proteinGoal: 80
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>({
    dailyCarbohydrateGoal: 150,
    dailyProteinGoal: 80
  });

  // Format date for display
  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format date for API
  const formatDateForApi = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Go to previous day
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };

  // Go to next day
  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Don't allow selecting future dates
    if (nextDay <= new Date()) {
      setSelectedDate(nextDay);
    }
  };

  // Go to today
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Check if selected date is today
  const isToday = (): boolean => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  // Filter foods based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFoods([]);
      setShowDropdown(false);
      return;
    }
    
    const filtered = foodDatabase.filter(food => 
      food.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFoods(filtered);
    setShowDropdown(filtered.length > 0);
  }, [searchTerm, foodDatabase]);

  // Load nutrition data for selected date
  useEffect(() => {
    const loadNutritionDataForDate = async () => {
      try {
        setIsLoading(true);

        // Format date for API
        const dateStr = formatDateForApi(selectedDate);
        console.log(`Loading nutrition data for date: ${dateStr}`);

        // If selected date is today, use getTodayNutrition
        let nutritionEntries;
        if (isToday()) {
          nutritionEntries = await nutritionService.getTodayNutrition();
          console.log('Loaded today\'s nutrition data:', nutritionEntries);
        } else {
          // Otherwise use getNutritionByDate
          nutritionEntries = await nutritionService.getNutritionByDate(dateStr);
          console.log(`Loaded nutrition data for ${dateStr}:`, nutritionEntries);
        }

        // Update nutrition state
        if (nutritionEntries) {
          updateNutritionState(nutritionEntries);
        }
      } catch (err) {
        console.error(`Error loading nutrition data for date ${formatDateForApi(selectedDate)}:`, err);
        setError(`Failed to load nutrition data for ${formatDateForDisplay(selectedDate)}. Please try again.`);
      } finally {
        setIsLoading(false);
      }
    };

    loadNutritionDataForDate();
  }, [selectedDate]);

  // Update the updateNutritionState function to handle the API response from MongoDB properly
  const updateNutritionState = (apiResponse: any) => {
    console.log('Updating nutrition state with API response:', apiResponse);
    
    let entries = [];
    
    // Check if response is in the format from the nutritionService processor
    if (apiResponse && Array.isArray(apiResponse.entries)) {
      entries = apiResponse.entries.map((entry: any) => ({
        ...entry,
        calories: formatNutritionValue(entry.calories),
        carbs: formatNutritionValue(entry.carbs),
        protein: formatNutritionValue(entry.protein),
        fat: formatNutritionValue(entry.fat)
      }));
    } 
    // If we have nutritionEntries directly from the backend
    else if (apiResponse?.nutritionEntries && Array.isArray(apiResponse.nutritionEntries)) {
      entries = apiResponse.nutritionEntries.flatMap((entry: any) => {
        if (!entry.foods || !Array.isArray(entry.foods)) return [];
        
        return entry.foods.map((food: any) => ({
          _id: entry._id || `temp-${Date.now()}`,
          meal: entry.meal || 'snack',
          foodId: food._id || 'unknown',
          foodName: food.name,
          calories: formatNutritionValue(food.calories || 0),
          carbs: formatNutritionValue(food.carbohydrates || 0),
          protein: formatNutritionValue(food.protein || 0),
          fat: formatNutritionValue(food.fat || 0),
          timestamp: entry.date || new Date()
        }));
      });
    }
    
    console.log('Processed entries:', entries);
    
    // Calculate totals
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;
    
    // Get totals from the API response if available
    if (apiResponse?.totals) {
      totalCalories = apiResponse.totals.calories || 0;
      totalCarbs = apiResponse.totals.carbohydrates || 0; 
      totalProtein = apiResponse.totals.protein || 0;
      totalFat = apiResponse.totals.fat || 0;
    } 
    // Get totals from direct properties if available
    else if (typeof apiResponse?.totalCalories === 'number') {
      totalCalories = apiResponse.totalCalories;
      totalCarbs = apiResponse.totalCarbs || 0;
      totalProtein = apiResponse.totalProtein || 0;
      totalFat = apiResponse.totalFat || 0;
    }
    // Otherwise calculate totals from entries
    else if (entries.length > 0) {
      totalCalories = entries.reduce((sum: number, entry: any) => sum + (Number(entry.calories) || 0), 0);
      totalCarbs = entries.reduce((sum: number, entry: any) => sum + (Number(entry.carbs) || 0), 0);
      totalProtein = entries.reduce((sum: number, entry: any) => sum + (Number(entry.protein) || 0), 0);
      totalFat = entries.reduce((sum: number, entry: any) => sum + (Number(entry.fat) || 0), 0);
    }
    
    // Get goals from profile or API
    const carbsGoal = userProfile?.dailyCarbohydrateGoal || 
                      (apiResponse?.goals?.carbohydrates || 150);
    const proteinGoal = userProfile?.dailyProteinGoal || 
                        (apiResponse?.goals?.protein || 80);
    
    console.log('Setting nutrition data to:', {
      totalCalories: formatNutritionValue(totalCalories),
      totalCarbs: formatNutritionValue(totalCarbs),
      totalProtein: formatNutritionValue(totalProtein),
      totalFat: formatNutritionValue(totalFat),
      entries,
      carbsGoal,
      proteinGoal
    });
    
    // Set the nutrition data
    setNutritionData({
      totalCalories: formatNutritionValue(totalCalories),
      totalCarbs: formatNutritionValue(totalCarbs),
      totalProtein: formatNutritionValue(totalProtein),
      totalFat: formatNutritionValue(totalFat),
      entries,
      carbsGoal,
      proteinGoal
    });
  };

  // Fetch initial data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // First try to get cached data before API calls
        const cachedData = nutritionService.getFromCache();
        if (cachedData) {
          console.log('Found cached nutrition data on component mount:', cachedData);
          // Pre-populate the state with cached data for immediate UI feedback
          setNutritionData({
            totalCalories: cachedData.totalCalories || 0,
            totalCarbs: cachedData.totalCarbs || 0,
            totalProtein: cachedData.totalProtein || 0,
            totalFat: cachedData.totalFat || 0,
            entries: Array.isArray(cachedData.entries) ? cachedData.entries : [],
            carbsGoal: userProfile?.dailyCarbohydrateGoal || 150,
            proteinGoal: userProfile?.dailyProteinGoal || 80
          });
        }
        
        // Fetch user profile to get goals
        const profileData = await profileService.getProfile();
        setUserProfile(profileData);
        
        // Fetch today's nutrition entries with force fresh parameter
        const nutritionEntries = await nutritionService.getTodayNutrition();
        console.log('Initial nutrition entries:', nutritionEntries);
        
        // Only update from API response if we have valid data
        if (nutritionEntries && (
          (Array.isArray(nutritionEntries.entries) && nutritionEntries.entries.length > 0) ||
          nutritionEntries.totalCalories > 0 ||
          nutritionEntries.totalCarbs > 0 ||
          nutritionEntries.totalProtein > 0
        )) {
          console.log('Updating with fresh API data');
          updateNutritionState(nutritionEntries);
        } else if (!cachedData) {
          // Only set empty state if we have no cached data and no API data
          console.log('No API data and no cached data, using empty state');
          setNutritionData({
            totalCalories: 0,
            totalCarbs: 0,
            totalProtein: 0,
            totalFat: 0,
            entries: [],
            carbsGoal: profileData?.dailyCarbohydrateGoal || 150,
            proteinGoal: profileData?.dailyProteinGoal || 80
          });
        }
        
        // Fetch food database
        const foods = await nutritionService.getFoodDatabase();
        if (Array.isArray(foods)) {
          setFoodDatabase(foods);
          console.log('Loaded food database from API:', foods.length, 'items');
        } else {
          console.error('Failed to load food database from API');
          setError('Failed to load food database');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load nutrition data. Please try again.');
        
        // Only set default values if we don't have cached data
        const cachedData = nutritionService.getFromCache();
        if (!cachedData) {
          setNutritionData({
            totalCalories: 0,
            totalCarbs: 0,
            totalProtein: 0,
            totalFat: 0,
            entries: [],
            carbsGoal: 150,
            proteinGoal: 80
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Save data before user navigates away
  useEffect(() => {
    const saveBeforeUnload = () => {
      console.log('User navigating away, saving nutrition data');
      nutritionService.saveToCache({
        ...nutritionData,
        timestamp: new Date().toISOString()
      });
    };
    
    // Add event listener
    window.addEventListener('beforeunload', saveBeforeUnload);
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', saveBeforeUnload);
    };
  }, [nutritionData]);

  // Get food details by ID
  const getFoodById = (id: string): FoodItem | undefined => {
    return foodDatabase.find(food => food.id === id);
  };
  
  // Update the addFoodToMeal function to format the data correctly for the backend
  const addFoodToMeal = async (food: FoodItem) => {
    try {
      // Only allow adding food for today
      if (!isToday()) {
        setError("You can only add food entries for today's date.");
        return;
      }

      setIsLoading(true); // Show loading state
      
      // Calculate nutritional values with formatting
      const calories = formatNutritionValue(food.calories * servingSize);
      const carbs = formatNutritionValue(food.carbs * servingSize);
      const protein = formatNutritionValue(food.protein * servingSize);
      const fat = formatNutritionValue(food.fat * servingSize);
      
      // Create the entry for optimistic UI update and the backend
      const newEntry = {
        _id: `temp-${Date.now()}`,
        meal: selectedMealType,
        foodId: food.id,
        servingSize: servingSize,
        foodName: food.name,
        calories,
        carbs,
        protein,
        fat,
        timestamp: new Date()
      };
      
      // Optimistically update UI
      setNutritionData(prevNutrition => {
        const newEntries = [...prevNutrition.entries, newEntry];
        
        // Calculate new totals
        const newTotalCalories = formatNutritionValue(
          prevNutrition.totalCalories + (calories || 0)
        );
        const newTotalCarbs = formatNutritionValue(
          prevNutrition.totalCarbs + (carbs || 0)
        );
        const newTotalProtein = formatNutritionValue(
          prevNutrition.totalProtein + (protein || 0)
        );
        const newTotalFat = formatNutritionValue(
          prevNutrition.totalFat + (fat || 0)
        );
        
        return {
          ...prevNutrition,
          totalCalories: newTotalCalories,
          totalCarbs: newTotalCarbs,
          totalProtein: newTotalProtein,
          totalFat: newTotalFat,
          entries: newEntries
        };
      });
      
      // Show immediate feedback
      setSuccessMessage(`Added ${food.name} to ${selectedMealType}`);
      
      // Reset search after adding food
      setSearchTerm('');
      setShowDropdown(false);
      
      // Try to update the backend
      try {
        console.log('Sending food data to backend:', newEntry);
        
        // Call API to add the entry
        const updatedData = await nutritionService.addFoodEntry(newEntry);
        console.log('Backend response:', updatedData);
        
        // Update with backend data if available
        if (updatedData) {
          updateNutritionState(updatedData);
        }
        
        setSuccessMessage(`${food.name} added to ${selectedMealType}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error: any) {
        console.error('Error saving to backend:', error);
        // We keep the optimistic update but show an error message
        setError(`Food was added locally but couldn't be saved to server. Please try again.`);
      }
    } catch (err) {
      console.error('Error adding food:', err);
      setError('Failed to add food. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove a food entry
  const removeFoodEntry = async (entryId: string) => {
    try {
      // Only allow deleting entries for today
      if (!isToday()) {
        setError("You can only remove food entries for today's date.");
        return;
      }

      setIsLoading(true); // Show loading state
      
      // Find the entry before deleting for optimistic UI update
      const entryToRemove = nutritionData.entries.find(e => e._id === entryId);
      
      if (!entryToRemove) {
        setError("Could not find the entry to remove.");
        setIsLoading(false);
        return;
      }
      
      // Update UI immediately (optimistic update)
      setNutritionData(prevState => {
        // Filter out the deleted entry
        const updatedEntries = prevState.entries.filter(entry => entry._id !== entryId);
        
        // If this was the last entry, explicitly set all values to exactly zero
        if (updatedEntries.length === 0) {
          console.log('This was the last entry, setting all values to exactly zero');
          return {
            ...prevState,
            totalCalories: 0,
            totalCarbs: 0,
            totalProtein: 0,
            totalFat: 0,
            entries: []
          };
        }
        
        // Otherwise calculate new totals as usual
        let newTotalCalories = Math.max(0, prevState.totalCalories - (Number(entryToRemove.calories) || 0));
        let newTotalCarbs = Math.max(0, prevState.totalCarbs - (Number(entryToRemove.carbs) || 0));
        let newTotalProtein = Math.max(0, prevState.totalProtein - (Number(entryToRemove.protein) || 0));
        let newTotalFat = Math.max(0, prevState.totalFat - (Number(entryToRemove.fat) || 0));
        
        return {
          ...prevState,
          totalCalories: formatNutritionValue(newTotalCalories),
          totalCarbs: formatNutritionValue(newTotalCarbs),
          totalProtein: formatNutritionValue(newTotalProtein),
          totalFat: formatNutritionValue(newTotalFat),
          entries: updatedEntries
        };
      });
      
      // Show immediate feedback
      setSuccessMessage('Removing food entry...');
      
      // Try to update the backend
      try {
        // Call API to delete the entry
        const updatedData = await nutritionService.deleteNutritionEntry(entryId);
        console.log('Received updated data after deletion:', updatedData);
        
        // Check if the updated data has no entries - if so, force zeros
        if (!updatedData?.entries || updatedData.entries.length === 0) {
          console.log('No entries in backend response, forcing zeros');
          setNutritionData(prevState => ({
            ...prevState,
            totalCalories: 0,
            totalCarbs: 0,
            totalProtein: 0,
            totalFat: 0,
            entries: []
          }));
          setSuccessMessage('Food entry removed');
        } 
        // Otherwise update with backend data
        else if (updatedData) {
          updateNutritionState(updatedData);
          setSuccessMessage('Food entry removed');
        }
      } catch (apiError) {
        console.error('API error during delete:', apiError);
        
        // Log the error but don't change UI since we already did the optimistic update
        setError(`Note: The item was removed locally but not deleted from server. Error: ${apiError.message}`);
        
        // Try to save to local storage as backup
        try {
          nutritionService.saveToCache({
            ...nutritionData,
            timestamp: new Date().toISOString()
          });
          console.log('Saved nutrition data to local cache after delete API error');
        } catch (cacheError) {
          console.error('Failed to save to cache:', cacheError);
        }
      }
    } catch (err) {
      console.error('Error removing food:', err);
      setError('Failed to remove food. Please try again.');
    } finally {
      setIsLoading(false); // Hide loading state
      
      // Clear success message after delay
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    }
  };
  
  // Filter meals by type
  const getMealsByType = (mealType: string): NutritionEntry[] => {
    // Add safety check to prevent TypeError when entries is undefined
    if (!nutritionData.entries || !Array.isArray(nutritionData.entries)) {
      console.log(`No entries found for ${mealType}`);
      return [];
    }
    
    // Debug the entries array
    console.log(`All entries (${nutritionData.entries.length}):`, nutritionData.entries);
    
    // Add logging to debug entries
    const filteredMeals = nutritionData.entries.filter(entry => {
      // Safety check for entry and meal property
      if (!entry) {
        console.log('Undefined entry found');
        return false;
      }
      
      // Debug entry details
      console.log(`Entry for filtering: meal=${entry.meal}, type=${typeof entry.meal}, mealType=${mealType}`);
      
      // Filter by meal type (case-insensitive)
      const entryMeal = (entry.meal || '').toLowerCase();
      const targetMeal = mealType.toLowerCase();
      const isMatch = entryMeal === targetMeal;
      
      if (isMatch) {
        console.log(`Found matching entry for ${mealType}:`, entry);
      }
      
      return isMatch;
    });
    
    console.log(`Found ${filteredMeals.length} entries for ${mealType}:`, filteredMeals);
    return filteredMeals;
  };
  
  // Calculate progress percentage (capped at 100%)
  const calculateProgress = (current: number, goal: number) => {
    return Math.min(Math.round((current / goal) * 100), 100);
  };

  // Add a function to refresh data from the backend
  const refreshData = async () => {
    try {
      console.log('Refreshing nutrition data from backend');
      setIsLoading(true);
      
      // Fetch fresh data from the backend
      const nutritionEntries = await nutritionService.getTodayNutrition();
      
      if (nutritionEntries) {
        console.log('Refreshed nutrition data:', nutritionEntries);
        updateNutritionState(nutritionEntries);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add an effect to refresh data when tab becomes active
  useEffect(() => {
    // Function to handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, refreshing data');
        refreshData();
      }
    };
    
    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 border-opacity-50 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading nutrition data...</p>
        </div>
      </div>
    );
  }

  // At the start of your render function, add this debugging code
  console.log('CURRENT NUTRITION DATA STATE:', nutritionData);
  console.log('ENTRY COUNT:', nutritionData.entries.length);
  console.log('ENTRIES:', nutritionData.entries);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 mr-4"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-3xl font-bold flex items-center">
                <Apple className="mr-3" size={28} /> 
                Nutrition Tracker
              </h1>
            </div>
          </div>
          
          <p className="text-white/80 max-w-2xl">
            Track your daily food intake, monitor your nutrition goals, and maintain a healthy diet for better diabetes management.
          </p>
          
          {/* Date Navigation */}
          <div className="mt-6 flex items-center">
            <div className="flex items-center bg-white/20 rounded-lg p-1">
              <button 
                onClick={goToPreviousDay}
                className="p-2 rounded-full hover:bg-white/30 flex items-center justify-center"
                aria-label="Previous day"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div 
                className="flex items-center mx-2 cursor-pointer"
                onClick={goToToday}
              >
                <Calendar className="mr-2" size={18} />
                <span className="font-medium">
                  {formatDateForDisplay(selectedDate)}
                  {!isToday() && (
                    <button 
                      onClick={goToToday}
                      className="ml-2 text-xs bg-white/30 px-2 py-1 rounded-full hover:bg-white/40"
                    >
                      Today
                    </button>
                  )}
                </span>
              </div>
              
              <button 
                onClick={goToNextDay}
                className={`p-2 rounded-full flex items-center justify-center ${
                  isToday() ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-white/30'
                }`}
                disabled={isToday()}
                aria-label="Next day"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <button
              onClick={refreshData}
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 ml-4"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 mt-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
            <div className="mr-2 flex-shrink-0">✓</div>
            <span>{successMessage}</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <AlertCircle className="mr-2 flex-shrink-0" size={18} />
            <span>{error}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Add Food Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                <Plus className="text-green-500 mr-2" size={20} /> 
                Add Food
              </h2>
              
              {/* Meal Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meal Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((meal) => (
                    <button
                      key={meal}
                      type="button"
                      onClick={() => setSelectedMealType(meal.toLowerCase())}
                      className={`py-2 px-3 rounded-lg text-sm font-medium ${
                        selectedMealType === meal.toLowerCase()
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {meal}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Food Search */}
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Food
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Type to search foods..."
                    className="w-full p-3 border border-gray-300 rounded-lg pl-10"
                  />
                  <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                </div>
                
                {/* Search Results Dropdown */}
                {showDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredFoods.map((food) => (
                      <div
                        key={food.id}
                        className="p-3 hover:bg-gray-100 cursor-pointer flex justify-between items-center border-b border-gray-100"
                        onClick={() => {
                          setSearchTerm(food.name);
                          setShowDropdown(false);
                        }}
                      >
                        <div>
                          <div className="font-medium">{food.name}</div>
                          <div className="text-sm text-gray-500">
                            {Math.round(food.calories)} cal, {Math.round(food.carbs)}g carbs, {Math.round(food.protein)}g protein
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addFoodToMeal(food);
                          }}
                          className="bg-green-500 text-white p-1 rounded-full hover:bg-green-600"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Serving Size */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serving Size
                </label>
                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={servingSize}
                  onChange={(e) => setServingSize(parseFloat(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Adjust serving size based on portion consumed
                </p>
              </div>

              {/* Selected Food Preview */}
              {searchTerm && !showDropdown && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{searchTerm}</h3>
                      {filteredFoods.length > 0 && (
                        <p className="text-sm text-gray-500">
                          {Math.round(filteredFoods[0].calories * servingSize)} cal, 
                          {Math.round(filteredFoods[0].carbs * servingSize)}g carbs
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => filteredFoods.length > 0 && addFoodToMeal(filteredFoods[0])}
                      className="bg-green-500 text-white py-1 px-3 rounded-lg hover:bg-green-600 flex items-center"
                    >
                      <Plus size={16} className="mr-1" /> Add
                    </button>
                  </div>
                </div>
              )}
              
              {/* Tips */}
              <div className="bg-blue-50 rounded-lg p-4 mt-2">
                <div className="flex">
                  <Info className="text-blue-500 mr-2 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-sm text-blue-800">
                      Tracking what you eat helps understand how different foods affect your blood sugar levels.
                    </p>
                    <Link 
                      to="/diet-planner" 
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                    >
                      View diet planner →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Nutrition Summary */}
          <div className="lg:col-span-2">
            {/* Summary Stats */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                <BarChart4 className="text-blue-500 mr-2" size={20} />
                Today's Nutrition
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-blue-800 text-2xl font-bold">
                    {Math.round(nutritionData.totalCalories)}
                  </div>
                  <div className="text-sm text-blue-600">Calories</div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="flex justify-center items-end">
                    <span className="text-purple-800 text-2xl font-bold">
                      {Math.round(nutritionData.totalCarbs)}g
                    </span>
                    <span className="text-purple-600 ml-1 text-xs mb-1">
                      / {nutritionData.carbsGoal}g
                    </span>
                  </div>
                  <div className="text-sm text-purple-600">Carbs</div>
                  <div className="w-full h-1 bg-purple-200 rounded-full mt-2">
                    <div 
                      className="h-full bg-purple-500 rounded-full" 
                      style={{ width: `${calculateProgress(nutritionData.totalCarbs, nutritionData.carbsGoal)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="flex justify-center items-end">
                    <span className="text-green-800 text-2xl font-bold">
                      {Math.round(nutritionData.totalProtein)}g
                    </span>
                    <span className="text-green-600 ml-1 text-xs mb-1">
                      / {nutritionData.proteinGoal}g
                    </span>
                  </div>
                  <div className="text-sm text-green-600">Protein</div>
                  <div className="w-full h-1 bg-green-200 rounded-full mt-2">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ width: `${calculateProgress(nutritionData.totalProtein, nutritionData.proteinGoal)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-orange-800 text-2xl font-bold">
                    {Math.round(nutritionData.totalFat)}g
                  </div>
                  <div className="text-sm text-orange-600">Fat</div>
                </div>
              </div>
            </div>
            
            {/* Meals List */}
            <div className="space-y-6">
              {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((mealType) => {
                const meals = getMealsByType(mealType.toLowerCase());
                console.log(`Rendering ${mealType} section with ${meals.length} entries`);
                
                return (
                  <div key={mealType} className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">{mealType}</h3>
                      <span className="text-sm text-gray-500">
                        {Math.round(meals.reduce((sum, entry) => {
                          return sum + (Number(entry.calories) || 0);
                        }, 0))} cal
                      </span>
                    </div>
                    
                    {meals.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <Pizza className="mx-auto mb-2 text-gray-300" size={32} />
                        <p>No {mealType.toLowerCase()} foods added yet</p>
                        <button 
                          onClick={() => setSelectedMealType(mealType.toLowerCase())}
                          className="mt-2 text-blue-500 text-sm hover:text-blue-700"
                        >
                          + Add {mealType.toLowerCase()} food
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {meals.map((entry) => {
                          console.log(`Rendering entry: ${entry.foodName}`, entry);
                          
                          return (
                            <div key={entry._id} className="p-4 flex justify-between items-center">
                              <div>
                                <div className="font-medium">{entry.foodName || 'Unknown Food'}</div>
                                <div className="text-sm text-gray-500">
                                  {entry.servingSize > 1 ? `${entry.servingSize} servings` : '1 serving'} • 
                                  {Math.round(Number(entry.calories) || 0)} cal, 
                                  {Math.round(Number(entry.carbs) || 0)}g carbs, 
                                  {Math.round(Number(entry.protein) || 0)}g protein
                                </div>
                              </div>
                              
                              <button
                                onClick={() => entry._id && removeFoodEntry(entry._id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionTracker; 