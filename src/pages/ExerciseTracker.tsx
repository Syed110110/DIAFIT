import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Clock, 
  Flame,
  Plus,
  Trash,
  ChevronLeft,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { exerciseService, profileService } from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';

const ExerciseTracker = () => {
  const { user } = useAuth();
  const [exerciseData, setExerciseData] = useState<any>({
    totalDuration: 0,
    totalCaloriesBurned: 0,
    entries: []
  });
  const [exerciseTypes, setExerciseTypes] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [exerciseGoal, setExerciseGoal] = useState<number>(30); // default to 30 minutes
  
  // New exercise form state
  const [newExercise, setNewExercise] = useState({
    typeId: '',
    duration: 0,
    notes: ''
  });
  
  // Fetch profile for exercise goal
  const fetchExerciseGoal = useCallback(async () => {
    try {
      const profileData = await profileService.getProfile();
      if (profileData && profileData.dailyExerciseGoal) {
        setExerciseGoal(profileData.dailyExerciseGoal);
      }
    } catch (error) {
      console.error('Failed to fetch exercise goal:', error);
    }
  }, []);
  
  // Fetch exercise types
  const fetchExerciseTypes = useCallback(async () => {
    try {
      console.log('Fetching exercise types');
      
      // Fetch exercise types
      const types = await exerciseService.getExerciseTypes();
      console.log('Exercise types loaded:', types);
      
      if (Array.isArray(types) && types.length > 0) {
        setExerciseTypes(types);
        
        // Set default selection to first exercise type if not already set
        if (!newExercise.typeId) {
          setNewExercise(prev => ({ ...prev, typeId: types[0].id }));
        }
      } else {
        console.warn('No exercise types found or types is not an array:', types);
        setError('No exercise types available. Please try again later.');
      }
    } catch (err) {
      console.error('Error fetching exercise types:', err);
      setError('Failed to load exercise types. Please try again later.');
    }
  }, [newExercise.typeId]);
  
  // Fetch exercise data
  const fetchExerciseData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting to fetch exercise data for date:', selectedDate);
      
      // Fetch exercise data
      const data = await exerciseService.getTodayExercise();
      console.log('Exercise data loaded:', data);
      
      if (data) {
        setExerciseData({
          totalDuration: Number(data.totalDuration || 0),
          totalCaloriesBurned: Number(data.totalCaloriesBurned || 0),
          entries: Array.isArray(data.entries) ? data.entries : []
        });
      } else {
        console.warn('Received undefined or null data from exercise service');
        setExerciseData({
          totalDuration: 0,
          totalCaloriesBurned: 0,
          entries: []
        });
      }
      
      // Fetch exercise types
      await fetchExerciseTypes();
      
    } catch (err) {
      console.error('Error fetching exercise data:', err);
      setError('Failed to load exercise data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, fetchExerciseTypes]);
  
  // Initial data load
  useEffect(() => {
    fetchExerciseData();
    fetchExerciseGoal();
  }, [fetchExerciseData, fetchExerciseGoal]);

  // Handle input changes for new exercise
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewExercise(prev => ({
      ...prev,
      [name]: name === 'duration' ? Math.max(0, parseFloat(value)) : value
    }));
  };
  
  // Add new exercise entry
  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newExercise.typeId || newExercise.duration <= 0) {
      setError('Please select an exercise type and enter a valid duration.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Find the exercise type for display purposes
      const exerciseType = exerciseTypes.find(type => type.id === newExercise.typeId);
      console.log('Selected exercise type:', exerciseType);
      
      if (!exerciseType) {
        throw new Error('Selected exercise type not found');
      }
      
      // Create exercise data object with all necessary fields
      const exerciseData = {
        typeId: newExercise.typeId,
        type: exerciseType.name, // Include the type name
        duration: Number(newExercise.duration),
        notes: newExercise.notes || '',
        date: selectedDate,
        intensity: exerciseType.intensity,
        caloriesPerMinute: exerciseType.caloriesPerMinute,
        caloriesBurned: Math.round(Number(newExercise.duration) * exerciseType.caloriesPerMinute)
      };
      
      console.log('Sending exercise data:', exerciseData);
      
      // Add to API via service
      const result = await exerciseService.addExerciseEntry(exerciseData);
      console.log('Result from adding exercise:', result);
      
      if (result) {
        // Update the exercise data with the result
        setExerciseData(result);
        
        setSuccessMessage(`Added ${newExercise.duration} minutes of ${exerciseType?.name || 'exercise'}`);
        
        // Reset form
        setNewExercise({
          typeId: exerciseTypes[0]?.id || '',
          duration: 0,
          notes: ''
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        throw new Error('Failed to add exercise. No response from service.');
      }
    } catch (error) {
      console.error('Error adding exercise:', error);
      setError('Failed to add exercise. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete exercise entry
  const handleDeleteExercise = async (entryId?: string) => {
    if (!entryId) {
      setError('Cannot delete entry: Missing entry ID');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this exercise entry?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await exerciseService.deleteExerciseEntry(entryId);
      console.log('Exercise entry deleted, updated data:', result);
      
      if (result) {
        setExerciseData(result);
        setSuccessMessage('Exercise entry deleted successfully');
      } else {
        throw new Error('Failed to delete exercise. No response from service.');
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting exercise:', error);
      setError('Failed to delete exercise. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate progress towards goal
  const calculateProgress = () => {
    if (!exerciseGoal || exerciseGoal <= 0) return 0;
    return Math.min(Math.round((exerciseData.totalDuration / exerciseGoal) * 100), 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="pt-10 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/dashboard" className="mr-4">
                <ChevronLeft className="h-6 w-6 text-gray-500" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Activity className="h-7 w-7 text-green-500 mr-2" />
                Exercise Tracker
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => fetchExerciseData()}
                className="flex items-center px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-full"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>
          
          <div className="mt-2 text-sm text-gray-500 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-sm text-gray-500 mb-1">Total Duration</div>
            <div className="text-2xl font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 text-blue-500 mr-2" />
              {Number(exerciseData.totalDuration || 0)} minutes
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-sm text-gray-500 mb-1">Calories Burned</div>
            <div className="text-2xl font-semibold text-gray-900 flex items-center">
              <Flame className="h-5 w-5 text-orange-500 mr-2" />
              {Number(exerciseData.totalCaloriesBurned || 0).toFixed(0)} kcal
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-sm text-gray-500 mb-1">Daily Goal Progress</div>
            <div className="text-2xl font-semibold text-gray-900">
              {calculateProgress()}%
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
              <div 
                className="h-full bg-green-500 rounded-full" 
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {exerciseData.totalDuration} / {exerciseGoal} minutes
            </div>
          </div>
        </div>
        
        {/* Add Exercise Form */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Add Exercise</h2>
          </div>
          
          <form onSubmit={handleAddExercise} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1" htmlFor="exerciseType">
                  Exercise Type
                </label>
                <select
                  id="typeId"
                  name="typeId"
                  value={newExercise.typeId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select exercise type</option>
                  {exerciseTypes && exerciseTypes.length > 0 ? (
                    exerciseTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.intensity} intensity, {type.caloriesPerMinute} cal/min)
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No exercise types available - try refreshing</option>
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-1" htmlFor="duration">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={newExercise.duration}
                  onChange={handleInputChange}
                  min="1"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1" htmlFor="notes">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={newExercise.notes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Exercise
            </button>
          </form>
          
          {error && (
            <div className="mx-4 mb-4 p-2 bg-red-50 text-red-700 text-sm rounded">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mx-4 mb-4 p-2 bg-green-50 text-green-700 text-sm rounded">
              {successMessage}
            </div>
          )}
        </div>
        
        {/* Exercise History */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Today's Exercise History</h2>
          </div>
          
          <div className="p-4">
            {loading && <p className="text-gray-500 text-center py-4">Loading...</p>}
            
            {!loading && (!exerciseData.entries || exerciseData.entries.length === 0) && (
              <p className="text-gray-500 text-center py-4">No exercise entries for today. Add your first exercise above!</p>
            )}
            
            {!loading && exerciseData.entries && exerciseData.entries.length > 0 && (
              <ul className="divide-y divide-gray-200">
                {exerciseData.entries.map((entry: any, index: number) => (
                  <li key={entry._id || index} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-800">{entry.type}</div>
                        <div className="text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" /> {entry.duration} minutes
                          </span>
                          <span className="flex items-center mt-1">
                            <Flame className="h-3 w-3 mr-1" /> {Number(entry.caloriesBurned || 0).toFixed(0)} kcal
                          </span>
                          {entry.notes && (
                            <div className="mt-1 text-xs italic">{entry.notes}</div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteExercise(entry._id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        aria-label="Delete exercise"
                        title="Delete this exercise"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseTracker; 