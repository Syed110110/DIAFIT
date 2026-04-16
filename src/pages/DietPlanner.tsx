import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockBackendService, shouldUseMockBackend } from '../services/mockBackendService.js';
import { nutritionService, dietPlanService } from '../services/dashboardService';

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

interface MealEntry {
  id: string;
  foodId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  servingSize: number;
}

interface DailyPlan {
  id?: string;
  _id?: string;
  date: string;
  name: string;
  meals: MealEntry[];
  totalCarbs: number;
  totalCalories: number;
}

const DietPlanner: React.FC = () => {
  const { user } = useAuth(); // Get authenticated user
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>([]);
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('breakfast');
  const [servingSize, setServingSize] = useState<number>(1);
  const [planName, setPlanName] = useState<string>(`Diet Plan - ${new Date().toLocaleDateString()}`);
  const [dailyPlan, setDailyPlan] = useState<DailyPlan>({
    id: Date.now().toString(),
    date: new Date().toISOString().split('T')[0],
    name: `Diet Plan - ${new Date().toLocaleDateString()}`,
    meals: [],
    totalCarbs: 0,
    totalCalories: 0,
  });
  const [savedPlans, setSavedPlans] = useState<DailyPlan[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'planner' | 'saved'>('planner');
  const [selectedSavedPlan, setSelectedSavedPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Get user ID for storage
  const getUserId = (): string => {
    return user ? user._id : 'guest';
  };

  // Load food database on component mount
  useEffect(() => {
    const fetchFoodDatabase = async () => {
      try {
        setLoading(true);
        let foods;
        
        if (shouldUseMockBackend()) {
          foods = await mockBackendService.getFoodDatabase();
        } else {
          foods = await nutritionService.getFoodDatabase();
        }
        
        setFoodDatabase(foods);
        console.log('Loaded food database with', foods.length, 'items');
      } catch (error) {
        console.error('Error loading food database:', error);
        // Fallback to empty array if food database can't be loaded
        setFoodDatabase([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFoodDatabase();
  }, []);

  // Load saved plans from backend or localStorage on component mount or when user changes
  useEffect(() => {
    const fetchSavedPlans = async () => {
      try {
        setLoading(true);
        console.log('Loading diet plans from backend');
        const plans = await dietPlanService.getUserDietPlans();
        
        if (Array.isArray(plans)) {
          console.log(`Loaded ${plans.length} diet plans`);
          setSavedPlans(plans);
        } else {
          console.error('Invalid response format from diet plans API', plans);
          setSavedPlans([]);
        }
      } catch (error) {
        console.error('Error loading saved plans:', error);
        setSavedPlans([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSavedPlans();
  }, [user]); // Re-run when user changes

  // Filter foods based on search term
  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = foodDatabase.filter(food => 
        food.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFoods(filtered);
      setShowDropdown(true);
    } else {
      setFilteredFoods([]);
      setShowDropdown(false);
    }
  }, [searchTerm, foodDatabase]);

  // Add a food item to the meal plan
  const addFoodToMeal = (food: FoodItem) => {
    const newMeal: MealEntry = {
      id: Date.now().toString(),
      foodId: food.id,
      mealType: selectedMealType,
      servingSize: servingSize,
    };

    const updatedMeals = [...dailyPlan.meals, newMeal];
    
    // Calculate totals
    const newTotalCarbs = calculateTotalNutrient(updatedMeals, 'carbs');
    const newTotalCalories = calculateTotalNutrient(updatedMeals, 'calories');
    
    setDailyPlan({
      ...dailyPlan,
      meals: updatedMeals,
      totalCarbs: newTotalCarbs,
      totalCalories: newTotalCalories,
    });

    // Reset the search
    setSearchTerm('');
    setServingSize(1);
    setShowDropdown(false);
  };

  // Remove a meal entry
  const removeMealEntry = (mealId: string) => {
    const updatedMeals = dailyPlan.meals.filter(meal => meal.id !== mealId);
    
    // Recalculate totals
    const newTotalCarbs = calculateTotalNutrient(updatedMeals, 'carbs');
    const newTotalCalories = calculateTotalNutrient(updatedMeals, 'calories');
    
    setDailyPlan({
      ...dailyPlan,
      meals: updatedMeals,
      totalCarbs: newTotalCarbs,
      totalCalories: newTotalCalories,
    });
  };

  // Helper function to calculate total nutrients
  const calculateTotalNutrient = (meals: MealEntry[], nutrient: 'carbs' | 'calories'): number => {
    return meals.reduce((total, meal) => {
      const food = foodDatabase.find(f => f.id === meal.foodId);
      if (food) {
        return total + (food[nutrient] * meal.servingSize);
      }
      return total;
    }, 0);
  };

  // Get food details by ID
  const getFoodById = (id: string): FoodItem | undefined => {
    return foodDatabase.find(food => food.id === id);
  };

  // Filter meals by meal type
  const getMealsByType = (mealType: 'breakfast' | 'lunch' | 'dinner', meals: MealEntry[]): MealEntry[] => {
    return meals.filter(meal => meal.mealType === mealType);
  };

  // Save the current diet plan to backend
  const saveDietPlan = async () => {
    if (dailyPlan.meals.length === 0) {
      alert('Please add at least one food item to your plan before saving.');
      return;
    }

    try {
      setLoading(true);
      
      // Update the plan name
      const planToSave = {
        ...dailyPlan,
        name: planName,
      };
      
      console.log('Saving diet plan to backend:', planToSave);
      
      // Save to backend and get updated plan
      const savedPlan = await dietPlanService.saveDietPlan(planToSave);
      console.log('Diet plan saved response:', savedPlan);
      
      // Refresh saved plans
      const refreshedPlans = await dietPlanService.getUserDietPlans();
      
      if (Array.isArray(refreshedPlans)) {
        setSavedPlans(refreshedPlans);
      }
      
      // Create a new empty plan
      setDailyPlan({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        name: `Diet Plan - ${new Date().toLocaleDateString()}`,
        meals: [],
        totalCarbs: 0,
        totalCalories: 0,
      });
      setPlanName(`Diet Plan - ${new Date().toLocaleDateString()}`);
      
      alert('Diet plan saved successfully!');
    } catch (error) {
      console.error('Error saving diet plan:', error);
      alert('Failed to save diet plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load a saved plan
  const loadSavedPlan = (plan: DailyPlan) => {
    setDailyPlan(plan);
    setPlanName(plan.name);
    setActiveTab('planner');
  };

  // Delete a saved plan
  const deleteSavedPlan = async (planId: string) => {
    try {
      setLoading(true);
      console.log('Deleting diet plan:', planId);
      
      // Delete from backend
      await dietPlanService.deleteDietPlan(planId);
      
      // Update local state
      const updatedSavedPlans = savedPlans.filter(plan => plan.id !== planId && plan._id !== planId);
      setSavedPlans(updatedSavedPlans);
      
      if (selectedSavedPlan?.id === planId || selectedSavedPlan?._id === planId) {
        setSelectedSavedPlan(null);
      }
      
      alert('Diet plan deleted successfully!');
    } catch (error) {
      console.error('Error deleting diet plan:', error);
      alert('Failed to delete diet plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // View a saved plan details
  const viewSavedPlan = (plan: DailyPlan) => {
    setSelectedSavedPlan(plan);
  };

  // Helper function to get plan ID (MongoDB _id or local id)
  const getPlanId = (plan: DailyPlan): string => {
    return plan._id || plan.id || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* App Background Image (Header) */}
      <div 
        className="h-80 w-full bg-cover bg-center relative" 
        style={{ 
          backgroundImage: "url('https://img.freepik.com/free-photo/be-my-valentine-lovely-gorgeous-redhead-curly-silly-girlfriend-holding-large-heart-sign-smiling_1258-127704.jpg?t=st=1742000024~exp=1742003624~hmac=36f4ccf6ea21f1cdb9b5f74e21d919ef60bc4228ff985d2ae3b32a28d12196bd&w=1380')" 
          // Replace with: url('https://images.unsplash.com/photo-1498837167922-ddd27525d352')
        }}
      >
        <div className="absolute inset-0 bg-blue-900 bg-opacity-10 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold">Diabetes Management</h1>
            <p className="text-xl mt-2">Personalized Diet Planner</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-40 -mt-12">
        {/* Tabs */}
        <div className="flex mb-8 bg-white rounded-t-lg shadow-md overflow-hidden">
          <button 
            className={`py-4 px-8 font-medium text-lg ${activeTab === 'planner' ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 hover:bg-blue-50'}`}
            onClick={() => setActiveTab('planner')}
          >
            Create Plan
          </button>
          <button 
            className={`py-4 px-8 font-medium text-lg ${activeTab === 'saved' ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 hover:bg-blue-50'}`}
            onClick={() => setActiveTab('saved')}
          >
            Saved Plans ({savedPlans.length})
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading food database...</p>
            </div>
          </div>
        ) : activeTab === 'planner' ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Diet Summary */}
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Daily Nutrition Summary</h2>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="px-3 py-2 rounded text-gray-800 w-64"
                    placeholder="Enter plan name"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                  />
                  <button 
                    className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded font-medium"
                    onClick={saveDietPlan}
                  >
                    Save Plan
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="font-medium text-lg">Total Carbs: <span className="font-bold">{dailyPlan.totalCarbs}g</span></p>
                  <div className="w-full bg-blue-200 rounded-full h-3 mt-2">
                    <div 
                      className={`h-3 rounded-full ${dailyPlan.totalCarbs > 200 ? 'bg-red-400' : 'bg-green-400'}`} 
                      style={{ width: `${Math.min(dailyPlan.totalCarbs / 2, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-lg">Total Calories: <span className="font-bold">{dailyPlan.totalCalories}</span></p>
                  <div className="w-full bg-blue-200 rounded-full h-3 mt-2">
                    <div 
                      className={`h-3 rounded-full ${dailyPlan.totalCalories > 2000 ? 'bg-red-400' : 'bg-green-400'}`} 
                      style={{ width: `${Math.min(dailyPlan.totalCalories / 20, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Food Form */}
            <div className="mb-8 p-6 border border-blue-100 rounded-lg bg-blue-50">
              <h2 className="text-xl font-semibold mb-4 text-blue-800">Add Food to Your Plan</h2>
              
              <div className="flex flex-wrap gap-4">
                <div className="w-full md:w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedMealType}
                    onChange={(e) => setSelectedMealType(e.target.value as 'breakfast' | 'lunch' | 'dinner')}
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>
                
                <div className="w-full md:w-64 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Foods</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Type to search foods..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  
                  {/* Dropdown for food search results */}
                  {showDropdown && filteredFoods.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredFoods.map(food => (
                        <div 
                          key={food.id}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b"
                          onClick={() => addFoodToMeal(food)}
                        >
                          <div className="font-medium">{food.name}</div>
                          <div className="text-sm text-gray-600">
                            {food.calories} cal | {food.carbs}g carbs | GI: {food.glycemicIndex ?? 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="w-full md:w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={servingSize}
                    onChange={(e) => setServingSize(parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Meal Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Breakfast Section */}
              <div className="rounded-lg overflow-hidden shadow-md">
                <div 
                  className="h-40 bg-cover bg-center" 
                  style={{ 
                    backgroundImage: "url('https://img.freepik.com/free-vector/people-healthy-food_24908-55174.jpg?t=st=1741640920~exp=1741644520~hmac=322b0db665665361ba71286772c68c5d6702cf94e7b291f0cff1ec9ed51f73eb&w=996')" 
                    // Replace with: url('https://images.unsplash.com/photo-1533089860892-a7c6f0a88666')
                  }}
                >
                  <div className="h-full w-full bg-black bg-opacity-40 flex items-center justify-center">
                    <h3 className="text-2xl font-bold text-white">Breakfast</h3>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  {getMealsByType('breakfast', dailyPlan.meals).length === 0 ? (
                    <p className="text-gray-500 italic py-4 text-center">No breakfast items added yet</p>
                  ) : (
                    <ul className="space-y-3">
                      {getMealsByType('breakfast', dailyPlan.meals).map(meal => {
                        const food = getFoodById(meal.foodId);
                        return food ? (
                          <li key={meal.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg shadow-sm">
                            <div>
                              <div className="font-medium">{food.name}</div>
                              <div className="text-sm text-gray-600">
                                {food.calories * meal.servingSize} cal | {food.carbs * meal.servingSize}g carbs
                              </div>
                              <div className="text-xs text-gray-500">
                                {meal.servingSize} serving{meal.servingSize !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <button 
                              className="text-red-500 hover:text-red-700 p-1"
                              onClick={() => removeMealEntry(meal.id)}
                            >
                              ✕
                            </button>
                          </li>
                        ) : null;
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Lunch Section */}
              <div className="rounded-lg overflow-hidden shadow-md">
                <div 
                  className="h-40 bg-cover bg-center" 
                  style={{ 
                    backgroundImage: "url('https://img.freepik.com/free-vector/ketogenic-diet-woman-composition_1284-64950.jpg?t=st=1741641103~exp=1741644703~hmac=767b1284cad09678f89d44030610da69ae8a591858d857ba07a64c05ee221bf2&w=1060')" 
                    // Replace with: url('https://images.unsplash.com/photo-1546793665-c74683f339c1')
                  }}
                >
                  <div className="h-full w-full bg-black bg-opacity-40 flex items-center justify-center">
                    <h3 className="text-2xl font-bold text-white">Lunch</h3>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  {getMealsByType('lunch', dailyPlan.meals).length === 0 ? (
                    <p className="text-gray-500 italic py-4 text-center">No lunch items added yet</p>
                  ) : (
                    <ul className="space-y-3">
                      {getMealsByType('lunch', dailyPlan.meals).map(meal => {
                        const food = getFoodById(meal.foodId);
                        return food ? (
                          <li key={meal.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg shadow-sm">
                            <div>
                              <div className="font-medium">{food.name}</div>
                              <div className="text-sm text-gray-600">
                                {food.calories * meal.servingSize} cal | {food.carbs * meal.servingSize}g carbs
                              </div>
                              <div className="text-xs text-gray-500">
                                {meal.servingSize} serving{meal.servingSize !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <button 
                              className="text-red-500 hover:text-red-700 p-1"
                              onClick={() => removeMealEntry(meal.id)}
                            >
                              ✕
                            </button>
                          </li>
                        ) : null;
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Dinner Section */}
              <div className="rounded-lg overflow-hidden shadow-md">
                <div 
                  className="h-40 bg-cover bg-center" 
                  style={{ 
                    backgroundImage: "url('https://img.freepik.com/free-vector/people-healthy-food_24908-55181.jpg?t=st=1741641372~exp=1741644972~hmac=cf737e01648b9a84074f6619163902d0e54cfe586b655ac8272e79a6d3250e4a&w=900')" 
                    // Replace with: url('https://images.unsplash.com/photo-1576402187878-974f70c890a5')
                  }}
                >
                  <div className="h-full w-full bg-black bg-opacity-40 flex items-center justify-center">
                    <h3 className="text-2xl font-bold text-white">Dinner</h3>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  {getMealsByType('dinner', dailyPlan.meals).length === 0 ? (
                    <p className="text-gray-500 italic py-4 text-center">No dinner items added yet</p>
                  ) : (
                    <ul className="space-y-3">
                      {getMealsByType('dinner', dailyPlan.meals).map(meal => {
                        const food = getFoodById(meal.foodId);
                        return food ? (
                          <li key={meal.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg shadow-sm">
                            <div>
                              <div className="font-medium">{food.name}</div>
                              <div className="text-sm text-gray-600">
                                {food.calories * meal.servingSize} cal | {food.carbs * meal.servingSize}g carbs
                              </div>
                              <div className="text-xs text-gray-500">
                                {meal.servingSize} serving{meal.servingSize !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <button 
                              className="text-red-500 hover:text-red-700 p-1"
                              onClick={() => removeMealEntry(meal.id)}
                            >
                              ✕
                            </button>
                          </li>
                        ) : null;
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Diabetes Tips */}

          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            {selectedSavedPlan ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-800">{selectedSavedPlan.name}</h2>
                  <div className="flex space-x-3">
                    <button 
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => loadSavedPlan(selectedSavedPlan)}
                    >
                      Edit This Plan
                    </button>
                    <button 
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                      onClick={() => setSelectedSavedPlan(null)}
                    >
                      Back to List
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium mb-2">Date Created: {new Date(selectedSavedPlan.date).toLocaleDateString()}</h3>
                    <p className="font-medium">Total Carbs: <span className="text-blue-600 font-bold">{selectedSavedPlan.totalCarbs}g</span></p>
                    <p className="font-medium">Total Calories: <span className="text-blue-600 font-bold">{selectedSavedPlan.totalCalories}</span></p>
                  </div>
                </div>
               
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Breakfast */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-blue-100 p-3">
                      <h3 className="font-semibold text-lg">Breakfast</h3>
                    </div>
                    <div className="p-4">
                      {getMealsByType('breakfast', selectedSavedPlan.meals).length === 0 ? (
                        <p className="text-gray-500 italic">No breakfast items</p>
                      ) : (
                        <ul className="space-y-2">
                          {getMealsByType('breakfast', selectedSavedPlan.meals).map(meal => {
                            const food = getFoodById(meal.foodId);
                            return food ? (
                              <li key={meal.id} className="p-2 bg-gray-50 rounded">
                                <div className="font-medium">{food.name}</div>
                                <div className="text-sm text-gray-600">
                                  {food.calories * meal.servingSize} cal | {food.carbs * meal.servingSize}g carbs
                                </div>
                                <div className="text-xs text-gray-500">
                                  {meal.servingSize} serving{meal.servingSize !== 1 ? 's' : ''}
                                </div>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                  
                  {/* Lunch */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-blue-100 p-3">
                      <h3 className="font-semibold text-lg">Lunch</h3>
                    </div>
                    <div className="p-4">
                      {getMealsByType('lunch', selectedSavedPlan.meals).length === 0 ? (
                        <p className="text-gray-500 italic">No lunch items</p>
                      ) : (
                        <ul className="space-y-2">
                          {getMealsByType('lunch', selectedSavedPlan.meals).map(meal => {
                            const food = getFoodById(meal.foodId);
                            return food ? (
                              <li key={meal.id} className="p-2 bg-gray-50 rounded">
                                <div className="font-medium">{food.name}</div>
                                <div className="text-sm text-gray-600">
                                  {food.calories * meal.servingSize} cal | {food.carbs * meal.servingSize}g carbs
                                </div>
                                <div className="text-xs text-gray-500">
                                  {meal.servingSize} serving{meal.servingSize !== 1 ? 's' : ''}
                                </div>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                  
                  {/* Dinner */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-blue-100 p-3">
                      <h3 className="font-semibold text-lg">Dinner</h3>
                    </div>
                    <div className="p-4">
                      {getMealsByType('dinner', selectedSavedPlan.meals).length === 0 ? (
                        <p className="text-gray-500 italic">No dinner items</p>
                      ) : (
                        <ul className="space-y-2">
                          {getMealsByType('dinner', selectedSavedPlan.meals).map(meal => {
                            const food = getFoodById(meal.foodId);
                          return food ? (
                              <li key={meal.id} className="p-2 bg-gray-50 rounded">
                                <div className="font-medium">{food.name}</div>
                                <div className="text-sm text-gray-600">
                                  {food.calories * meal.servingSize} cal | {food.carbs * meal.servingSize}g carbs
                                </div>
                                <div className="text-xs text-gray-500">
                                  {meal.servingSize} serving{meal.servingSize !== 1 ? 's' : ''}
                                </div>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-blue-800 mb-6">Your Saved Diet Plans</h2>
                
                {savedPlans.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">You haven't saved any diet plans yet.</p>
                    <button 
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      onClick={() => setActiveTab('planner')}
                    >
                      Create Your First Plan
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedPlans.map(plan => (
                      <div key={getPlanId(plan)} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                          <h3 className="font-bold text-lg">{plan.name}</h3>
                          <p className="text-sm opacity-90">Created: {new Date(plan.date).toLocaleDateString()}</p>
                        </div>
                        <div className="p-4 bg-white">
                          <div className="mb-3">
                            <p className="font-medium">Total Carbs: <span className="text-blue-600">{plan.totalCarbs}g</span></p>
                            <p className="font-medium">Total Calories: <span className="text-blue-600">{plan.totalCalories}</span></p>
                            <p className="font-medium">Items: <span className="text-blue-600">{plan.meals.length}</span></p>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                              onClick={() => viewSavedPlan(plan)}
                            >
                              View
                            </button>
                            <button 
                              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                              onClick={() => loadSavedPlan(plan)}
                            >
                              Load
                            </button>
                            <button 
                              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                              onClick={() => deleteSavedPlan(getPlanId(plan))}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DietPlanner;