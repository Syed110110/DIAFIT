import React, { useState, useEffect } from 'react';
import { Droplets, Plus, Minus, Moon, Sun, Save, Activity, Trash2 } from 'lucide-react';
import { waterService } from '../services/dashboardService';

interface WaterEntry {
  _id: string;
  amount: number;
  date: Date;
  createdAt: string;
}

const WaterTracker = () => {
  const [waterData, setWaterData] = useState({
    totalWaterIntake: 0,
    dailyWaterGoal: 2000, // in milliliters
    progress: 0,
    waterEntries: [] as WaterEntry[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Convert ml to glasses (assume 250ml per glass)
  const glassSize = 250; // ml per glass
  const totalGlasses = Math.round(waterData.totalWaterIntake / glassSize);
  const goalGlasses = Math.round(waterData.dailyWaterGoal / glassSize);

  // Load water data and preferences on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    
    if (savedTheme) {
      setDarkMode(savedTheme === 'true');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
    
    fetchWaterData();
  }, []);

  const fetchWaterData = async () => {
    try {
      setIsLoading(true);
      const data = await waterService.getTodayWaterIntake();
      setWaterData(data);
      setError(null);
    } catch (err: any) {
      setError('Failed to load water data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  const addGlass = async () => {
    try {
      // Optimistically update UI first
      const newTotal = waterData.totalWaterIntake + glassSize;
      const newProgress = Math.min((newTotal / waterData.dailyWaterGoal) * 100, 100);
      
      // Create a temporary entry
      const tempEntry = {
        _id: `temp-${Date.now()}`,
        amount: glassSize,
        date: new Date(),
        createdAt: new Date().toISOString()
      };
      
      // Update state optimistically
      setWaterData({
        ...waterData,
        totalWaterIntake: newTotal,
        progress: newProgress,
        waterEntries: [...waterData.waterEntries, tempEntry]
      });
      
      // Make the API call in background
      await waterService.addWaterIntake(glassSize);
      
      // Refresh data silently
      const data = await waterService.getTodayWaterIntake();
      setWaterData(data);
    } catch (err) {
      setError('Failed to update water intake');
      console.error(err);
      // Revert back to original state by fetching again
      fetchWaterData();
    }
  };

  const removeGlass = async () => {
    try {
      if (waterData.waterEntries.length > 0) {
        // Get the latest entry
        const latestEntry = waterData.waterEntries[waterData.waterEntries.length - 1];
        const entryAmount = latestEntry.amount;
        
        // Update state optimistically
        const newTotal = Math.max(waterData.totalWaterIntake - entryAmount, 0);
        const newProgress = Math.min((newTotal / waterData.dailyWaterGoal) * 100, 100);
        
        setWaterData({
          ...waterData,
          totalWaterIntake: newTotal,
          progress: newProgress,
          waterEntries: waterData.waterEntries.slice(0, -1)
        });
        
        // Make the API call in background
        await waterService.deleteWaterEntry(latestEntry._id);
        
        // Refresh data silently
        const data = await waterService.getTodayWaterIntake();
        setWaterData(data);
      }
    } catch (err) {
      setError('Failed to update water intake');
      console.error(err);
      // Revert back to original state by fetching again
      fetchWaterData();
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      // Find the entry to be deleted
      const entryToDelete = waterData.waterEntries.find(entry => entry._id === entryId);
      
      if (!entryToDelete) return;
      
      // Calculate new totals
      const newTotal = Math.max(waterData.totalWaterIntake - entryToDelete.amount, 0);
      const newProgress = Math.min((newTotal / waterData.dailyWaterGoal) * 100, 100);
      
      // Update state optimistically
      setWaterData({
        ...waterData,
        totalWaterIntake: newTotal,
        progress: newProgress,
        waterEntries: waterData.waterEntries.filter(entry => entry._id !== entryId)
      });
      
      // Make the API call in background
      await waterService.deleteWaterEntry(entryId);
      
      // Refresh data silently
      const data = await waterService.getTodayWaterIntake();
      setWaterData(data);
    } catch (err) {
      setError('Failed to delete entry');
      console.error(err);
      // Revert back to original state by fetching again
      fetchWaterData();
    }
  };

  // Format time function
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${darkMode ? 'bg-gradient-to-r from-blue-900 to-indigo-900' : 'bg-gradient-to-r from-blue-300 to-indigo-400'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className={`${darkMode ? 'bg-gray-800 bg-opacity-90' : 'bg-white bg-opacity-90'} backdrop-blur-md rounded-2xl shadow-2xl p-8 relative overflow-hidden transition-colors duration-300`}>
          
          {/* Floating bubbles for decoration */}
          <div className={`absolute top-[-40px] left-[-40px] w-24 h-24 ${darkMode ? 'bg-blue-700' : 'bg-blue-200'} opacity-30 rounded-full transition-colors duration-300`}></div>
          <div className={`absolute bottom-[-40px] right-[-40px] w-28 h-28 ${darkMode ? 'bg-indigo-700' : 'bg-indigo-300'} opacity-30 rounded-full transition-colors duration-300`}></div>

          {/* Header and Controls */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Droplets className={`h-10 w-10 ${darkMode ? 'text-blue-400' : 'text-blue-600'} animate-pulse transition-colors duration-500`} />
              <h1 className={`text-4xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>Water Tracker</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchWaterData}
                className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' : 'bg-gray-100 text-blue-600 hover:bg-gray-200'} transition-all duration-300 transform active:scale-90 shadow-md`}
                title="Refresh data"
                disabled={isLoading}
              >
                <Activity className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' : 'bg-gray-100 text-blue-600 hover:bg-gray-200'} transition-all duration-300 transform active:scale-90 shadow-md`}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Loading water data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Water Intake Section */}
              <div className={`flex flex-col items-center justify-center p-8 ${darkMode ? 'bg-gray-700 bg-opacity-70' : 'bg-white bg-opacity-70'} rounded-xl shadow-lg transition-colors duration-300`}>
                <div className="relative w-48 h-48 mb-6">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                      className={`w-40 h-40 ${darkMode ? 'bg-blue-400' : 'bg-blue-500'} rounded-full opacity-20 transition-all ease-out duration-1500`}
                      style={{
                        transform: `scale(${Math.min(waterData.progress / 100, 1)})`,
                        boxShadow: `0 0 ${Math.min(waterData.progress / 10, 15)}px ${darkMode ? 'rgba(96, 165, 250, 0.7)' : 'rgba(37, 99, 235, 0.5)'}`
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div 
                        className={`text-5xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700'} transition-colors duration-300`}
                        key={totalGlasses} // Re-render when value changes
                        style={{ animation: 'pulse 1s ease-in-out' }}
                      >
                        {totalGlasses}
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-600'} transition-colors duration-300`}>glasses</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={removeGlass}
                    disabled={waterData.waterEntries.length === 0 || isLoading}
                    className={`p-3 rounded-full ${darkMode ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-600 hover:bg-red-300'} transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Minus className="h-6 w-6" />
                  </button>
                  <button
                    onClick={addGlass}
                    disabled={isLoading}
                    className={`p-3 rounded-full ${darkMode ? 'bg-green-900 text-green-300 hover:bg-green-800' : 'bg-green-100 text-green-600 hover:bg-green-300'} transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Progress & Benefits Section */}
              <div className="space-y-6">
                <div className={`${darkMode ? 'bg-gray-700 bg-opacity-70' : 'bg-white bg-opacity-70'} rounded-lg p-6 shadow-lg transition-colors duration-300`}>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2 transition-colors duration-300`}>Daily Goal</h3>
                  <div className={`flex justify-between text-sm ${darkMode ? 'text-blue-300' : 'text-blue-600'} mb-2 transition-colors duration-300`}>
                    <span>Progress</span>
                    <span>{totalGlasses} of {goalGlasses} glasses ({(waterData.totalWaterIntake / 1000).toFixed(1)}L of {(waterData.dailyWaterGoal / 1000).toFixed(1)}L)</span>
                  </div>
                  <div className={`h-3 ${darkMode ? 'bg-gray-600' : 'bg-blue-100'} rounded-full overflow-hidden transition-colors duration-300 relative`}>
                    <div
                      className={`h-full ${darkMode ? 'bg-blue-400' : 'bg-blue-600'} rounded-full transition-all ease-out duration-1500`}
                      style={{ 
                        width: `${Math.min(waterData.progress, 100)}%`,
                        boxShadow: `0 0 10px ${darkMode ? 'rgba(96, 165, 250, 0.5)' : 'rgba(37, 99, 235, 0.3)'}`
                      }}
                    />
                    {/* Water ripple effect when value changes */}
                    {waterData.progress > 0 && (
                      <div 
                        className="absolute top-0 left-0 h-full w-full"
                        style={{ 
                          background: `linear-gradient(90deg, transparent, ${darkMode ? 'rgba(96, 165, 250, 0.3)' : 'rgba(37, 99, 235, 0.2)'}, transparent)`,
                          width: '100%',
                          transform: `translateX(${Math.min(waterData.progress, 100)}%)`,
                          animation: 'ripple 2.5s ease-out',
                          zIndex: 5,
                          opacity: 0
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className={`${darkMode ? 'bg-gray-700 bg-opacity-70' : 'bg-white bg-opacity-70'} rounded-lg p-6 shadow-lg transition-colors duration-300`}>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 transition-colors duration-300`}>Today's Water Intake</h3>
                  
                  {waterData.waterEntries.length === 0 ? (
                    <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No water intake recorded today
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 relative">
                      {waterData.waterEntries.map((entry, index) => (
                        <li 
                          key={entry._id} 
                          className={`flex items-center justify-between p-2 rounded ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-blue-50 hover:bg-blue-100'} transition-all duration-300 transform animate-fadeIn`}
                          style={{ 
                            animationDelay: `${index * 50}ms`,
                            animationFillMode: 'both',
                            transform: 'translateX(0)'
                          }}
                        >
                          <div className="flex items-center">
                            <Droplets className={`h-4 w-4 mr-2 ${darkMode ? 'text-blue-300' : 'text-blue-600'} ${index === waterData.waterEntries.length - 1 ? 'animate-bounce' : ''}`} />
                            <span className={`${darkMode ? 'text-white' : 'text-gray-800'} font-medium`}>
                              {(entry.amount / 1000).toFixed(1)}L
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mr-2`}>
                              {formatTime(entry.createdAt)}
                            </span>
                            <button 
                              onClick={() => deleteEntry(entry._id)}
                              className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700 text-red-400 hover:text-red-300' : 'hover:bg-red-100 text-red-500 hover:text-red-700'} transition-all duration-300 transform hover:scale-110`}
                              title="Delete entry"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Benefits section at the bottom */}
          <div className={`mt-8 ${darkMode ? 'bg-gray-700 bg-opacity-70' : 'bg-white bg-opacity-70'} rounded-lg p-6 shadow-lg transition-colors duration-300`}>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 transition-colors duration-300`}>Benefits of Staying Hydrated</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-blue-50'}`}>
                <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>💧 Helps regulate blood sugar levels</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-blue-50'}`}>
                <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>💪 Maintains kidney function</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-blue-50'}`}>
                <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>⚡ Improves energy levels</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-blue-50'}`}>
                <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>🥗 Aids in digestion</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-blue-50'}`}>
                <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>🚰 Reduces risk of dehydration</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-blue-50'}`}>
                <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>🧠 Improves cognitive function</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterTracker;