import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Edit2, 
  FileText, 
  Activity, 
  Heart, 
  AlertCircle,
  Award,
  Clock,
  ArrowLeft,
  PlusCircle,
  Save,
  Moon,
  Sun,
  Quote
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { profileService, exerciseService, nutritionService, waterService } from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newAllergy, setNewAllergy] = useState('');
  
  const quotes = [
    {
      text: "Diabetes is not a choice, but how you manage it is. Every healthy decision is an investment in your tomorrow.",
      author: "Unknown"
    },
    {
      text: "Your health account, your bank account, they're the same thing. The more you put in, the more you can take out.",
      author: "Jack LaLanne"
    },
    {
      text: "It's not about perfect. It's about effort. When you bring that effort every single day, that's where transformation happens.",
      author: "Jillian Michaels"
    },
    {
      text: "Diabetes taught me discipline. And discipline is the key to a healthy life.",
      author: "Halle Berry"
    },
    {
      text: "The groundwork for all happiness is good health.",
      author: "Leigh Hunt"
    }
  ];

  const [profileData, setProfileData] = useState({
    // User identity
    name: "",
    email: "",
    
    // Contact information
    phone: "",
    birthdate: "",
    emergencyContact: "",
    
    // Personal information
    diagnosisDate: "",
    diabetesType: "",
    height: 170,
    weight: 70,
    age: 30,
    gender: "other",
    
    // Medical information
    primaryDoctor: "",
    nextAppointment: "",
    allergies: [] as string[],
    
    // Health metrics
    healthMetrics: {
      a1c: { value: "", date: "" },
      bloodPressure: { value: "", date: "" },
      weight: { value: "", date: "" },
      cholesterol: { value: "", date: "" }
    },
    
    // Health goals
    goals: [] as any[],
    dailyWaterGoal: 2.0,
    dailyCarbohydrateGoal: 150,
    dailyProteinGoal: 80,
    dailyExerciseGoal: 30
  });

  useEffect(() => {
    fetchProfileData();
    
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setDarkMode(savedTheme === 'true');
    }
  }, []);

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuote(prevQuote => (prevQuote + 1) % quotes.length);
    }, 8000);
    
    return () => clearInterval(quoteInterval);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const fetchProfileData = async () => {
    try {
      console.log('Fetching profile data from MongoDB');
      setError(null);
      
      const data = await profileService.getProfile();
      console.log('Profile data received from MongoDB:', data);
      
      // If data is null or undefined, display error
      if (!data) {
        console.error('No profile data received from backend');
        setError('Failed to load profile data from database. Please try again.');
        return;
      }
      
      // Fetch additional data from other services
      let exerciseData;
      try {
        exerciseData = await exerciseService.getTodayExercise();
        console.log('Exercise data for profile:', exerciseData);
      } catch (err) {
        console.error('Failed to fetch exercise data for profile:', err);
        exerciseData = { totalDuration: 0, totalCaloriesBurned: 0 };
      }
      
      let waterData;
      try {
        waterData = await waterService.getTodayWaterIntake();
        console.log('Water data for profile:', waterData);
      } catch (err) {
        console.error('Failed to fetch water data for profile:', err);
        waterData = { totalWaterIntake: 0, dailyWaterGoal: 2000 };
      }
      
      let nutritionData;
      try {
        nutritionData = await nutritionService.getTodayNutrition();
        console.log('Nutrition data for profile:', nutritionData);
      } catch (err) {
        console.error('Failed to fetch nutrition data for profile:', err);
        nutritionData = { totalCalories: 0, totalCarbs: 0, totalProtein: 0 };
      }
      
      // Convert ml to L for water
      const waterLiters = ((waterData.totalWaterIntake || 0) / 1000) || 0;
      const waterGoalLiters = ((waterData.dailyWaterGoal || 2000) / 1000) || 2.0;
      
      // Normalize diabetes type to ensure capitalization is correct
      let diabetesType = data.diabetesType || "Type 2";
      // Capitalize "none" to "None" to match backend enum
      if (diabetesType.toLowerCase() === "none") {
        diabetesType = "None";
      }
      
      setProfileData(prevData => ({
        ...prevData,
        // User identity info - Use MongoDB data first, fallback to Auth context
        name: user?.name || "User",
        email: user?.email || "",
        
        // Physical attributes - Use MongoDB data with fallbacks
        height: data.height || 170,
        weight: data.weight || 70,
        age: data.age || 30,
        gender: data.gender || "other",
        diabetesType: diabetesType,
        
        // Contact information
        phone: data.phone || "",
        birthdate: data.birthdate || "",
        emergencyContact: data.emergencyContact || "",
        
        // Goals
        dailyWaterGoal: data.dailyWaterGoal || waterGoalLiters,
        dailyCarbohydrateGoal: data.dailyCarbohydrateGoal || 150,
        dailyProteinGoal: data.dailyProteinGoal || 80,
        dailyExerciseGoal: data.dailyExerciseGoal || 30,
        
        // Medical information
        primaryDoctor: data.primaryDoctor || "",
        nextAppointment: data.nextAppointment || "",
        allergies: data.allergies || [],
        diagnosisDate: data.diagnosisDate || "",
        
        // Health metrics - Use MongoDB data with fallbacks
        healthMetrics: data.healthMetrics || {
          a1c: { 
            value: "6.5%", 
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          },
          bloodPressure: { 
            value: "120/80", 
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          },
          weight: { 
            value: `${data.weight || 70} kg`, 
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          },
          cholesterol: { 
            value: "Total: 180, LDL: 100", 
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          }
        },
        
        // Goals formatted for UI display with real progress
        goals: [
          { 
            title: `Daily Water Goal: ${data.dailyWaterGoal || waterGoalLiters}L`, 
            progress: Math.min(Math.round((waterLiters / (data.dailyWaterGoal || waterGoalLiters)) * 100), 100) || 0, 
            target: "Ongoing",
            current: `${waterLiters.toFixed(1)}L / ${(data.dailyWaterGoal || waterGoalLiters).toFixed(1)}L`
          },
          { 
            title: `Daily Carbs Goal: ${data.dailyCarbohydrateGoal || 150}g`, 
            progress: Math.min(Math.round(((nutritionData.totalCarbs || 0) / (data.dailyCarbohydrateGoal || 150)) * 100), 100) || 0, 
            target: "Ongoing",
            current: `${nutritionData.totalCarbs || 0}g / ${data.dailyCarbohydrateGoal || 150}g`
          },
          { 
            title: `Daily Protein Goal: ${data.dailyProteinGoal || 80}g`, 
            progress: Math.min(Math.round(((nutritionData.totalProtein || 0) / (data.dailyProteinGoal || 80)) * 100), 100) || 0, 
            target: "Ongoing",
            current: `${nutritionData.totalProtein || 0}g / ${data.dailyProteinGoal || 80}g`
          },
          { 
            title: `Daily Exercise Goal: ${data.dailyExerciseGoal || 30} mins`, 
            progress: Math.min(Math.round(((exerciseData.totalDuration || 0) / (data.dailyExerciseGoal || 30)) * 100), 100) || 0, 
            target: "Ongoing",
            current: `${exerciseData.totalDuration || 0} mins / ${data.dailyExerciseGoal || 30} mins`
          }
        ]
      }));
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to load profile data. Please try again.');
    }
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      await saveChanges();
    } else {
      setIsEditing(true);
    }
  };

  const saveChanges = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      console.log('Saving profile changes to MongoDB:', profileData);
      
      // Format data for API
      const profileDataToSave = {
        // Physical attributes
        height: profileData.height,
        weight: profileData.weight,
        age: profileData.age,
        gender: profileData.gender,
        // Fix the case for diabetesType to match the enum on the backend
        diabetesType: profileData.diabetesType === "none" ? "None" : profileData.diabetesType,
        diagnosisDate: profileData.diagnosisDate,
        
        // Contact information
        phone: profileData.phone,
        birthdate: profileData.birthdate,
        emergencyContact: profileData.emergencyContact,
        
        // Medical information
        primaryDoctor: profileData.primaryDoctor,
        nextAppointment: profileData.nextAppointment,
        allergies: profileData.allergies,
        
        // Goals
        dailyWaterGoal: profileData.dailyWaterGoal,
        dailyCarbohydrateGoal: profileData.dailyCarbohydrateGoal,
        dailyProteinGoal: profileData.dailyProteinGoal,
        dailyExerciseGoal: profileData.dailyExerciseGoal,
        
        // Health metrics
        healthMetrics: profileData.healthMetrics
      };
      
      console.log('Sending profile data to backend:', profileDataToSave);
      const result = await profileService.updateProfile(profileDataToSave);
      console.log('Profile update result:', result);
      
      // The backend returns the updated profile object, not a success field
      // So we just need to check if the result exists
      if (!result) {
        throw new Error('Failed to update profile - no response from server');
      }
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setIsEditing(false);
      
      // Refetch profile data to ensure we have the latest
      await fetchProfileData();
    } catch (err) {
      console.error('Error saving profile changes:', err);
      setError('Failed to save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prevData => {
      const newData = {
        ...prevData,
        [field]: value
      };
      
      // Synchronize weight value with health metrics when weight field changes
      if (field === 'weight') {
        // Update both the value and date in the weight metric
        const today = new Date().toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
        
        console.log(`Updating weight metric to ${value} kg, date: ${today}`);
        
        newData.healthMetrics = {
          ...newData.healthMetrics,
          weight: {
            ...newData.healthMetrics.weight,
            value: `${value} kg`,
            date: today
          }
        };
      }
      
      return newData;
    });
  };

  const handleHealthMetricChange = (metricKey: string, field: string, value: string) => {
    setProfileData(prevData => ({
      ...prevData,
      healthMetrics: {
        ...prevData.healthMetrics,
        [metricKey]: {
          ...prevData.healthMetrics[metricKey as keyof typeof prevData.healthMetrics],
          [field]: value
        }
      }
    }));
  };

  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAllergy.trim()) {
      setProfileData(prevData => ({
        ...prevData,
        allergies: [...prevData.allergies, newAllergy.trim()]
      }));
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setProfileData(prevData => ({
      ...prevData,
      allergies: prevData.allergies.filter((_, i) => i !== index)
    }));
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Handle date input changes specifically
  const handleDateInputChange = (field: string, value: string, metricType?: string) => {
    console.log(`Changing date field: ${field} to ${value}`);
    
    if (metricType) {
      // For health metrics dates
      setProfileData(prev => ({
        ...prev,
        healthMetrics: {
          ...prev.healthMetrics,
          [metricType]: {
            ...prev.healthMetrics[metricType],
            date: value
          }
        }
      }));
    } else {
      // For regular date fields
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Format dates for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      // Check if it's already in a readable format
      if (dateString.includes(',')) return dateString;
      
      // Try to parse ISO date
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Not a valid date
      
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return dateString;
    }
  };

  // Format dates for input fields
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      // Check if it's in a readable format and convert to yyyy-mm-dd
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return ''; // Not a valid date
      
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    } catch (err) {
      console.error('Error formatting date for input:', err);
      return '';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 to-purple-50 text-gray-800'}`}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center mb-8">
          <button 
            onClick={() => navigate('/dashboard')} 
            className={`p-2 rounded-full shadow-sm mr-4 hover:bg-opacity-80 ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-600'}`}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold flex-1">My Profile</h1>
          
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-full shadow-sm mr-3 ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-white text-gray-600'}`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button 
            onClick={handleEditToggle}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg flex items-center ${
              isEditing 
                ? "bg-green-500 text-white" 
                : "bg-blue-500 text-white"
            } ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isEditing ? (
              <>
                <Save size={16} className="mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </>
            ) : (
              <>
                <Edit2 size={16} className="mr-2" />
                Edit Profile
              </>
            )}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        {/* Quote Section */}
        <div className={`rounded-xl shadow-sm overflow-hidden mb-6 transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`p-6 ${darkMode ? 'bg-indigo-900' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}>
            <div className="flex">
              <div className="mr-4">
                <Quote size={32} className="text-white opacity-70" />
              </div>
              <div className="flex-1">
                <p className="text-white text-lg italic mb-2">{quotes[currentQuote].text}</p>
                <p className="text-white opacity-80 text-sm text-right">— {quotes[currentQuote].author}</p>
              </div>
            </div>
          </div>
          <div className={`px-4 py-2 flex justify-between items-center ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
            <span className="text-xs">Quote refreshes automatically</span>
            <div className="flex space-x-1">
              {quotes.map((_, index) => (
                <div 
                  key={index} 
                  className={`w-2 h-2 rounded-full ${currentQuote === index 
                    ? (darkMode ? 'bg-blue-400' : 'bg-blue-600') 
                    : (darkMode ? 'bg-gray-600' : 'bg-gray-300')}`} 
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className={`rounded-xl shadow-sm overflow-hidden mb-6 transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`h-32 relative ${darkMode ? 'bg-indigo-900' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                  <div className={`w-24 h-24 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-white'} p-1`}>
                    <div className={`w-full h-full rounded-full ${darkMode ? 'bg-gray-700' : 'bg-blue-100'} flex items-center justify-center`}>
                      <User className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={42} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-16 pb-6 px-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold">{profileData.name}</h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {profileData.diabetesType} • Diagnosed {profileData.diagnosisDate}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-blue-100'} flex items-center justify-center mr-3`}>
                      <Mail size={16} className={darkMode ? 'text-blue-400' : 'text-blue-500'} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                      <p className="text-sm font-medium">{profileData.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-blue-100'} flex items-center justify-center mr-3`}>
                      <Phone size={16} className={darkMode ? 'text-blue-400' : 'text-blue-500'} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`w-full text-sm mt-1 px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                          placeholder="Enter phone number"
                        />
                      ) : (
                        <p className="text-sm font-medium">{profileData.phone || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-blue-100'} flex items-center justify-center mr-3`}>
                      <Calendar size={16} className={darkMode ? 'text-blue-400' : 'text-blue-500'} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Birthdate</p>
                      {isEditing ? (
                        <input
                          type="date"
                          value={profileData.birthdate}
                          onChange={(e) => handleDateInputChange('birthdate', e.target.value)}
                          className={`w-full text-sm mt-1 px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                        />
                      ) : (
                        <p className="text-sm font-medium">{formatDateForDisplay(profileData.birthdate)}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-red-900 bg-opacity-50' : 'bg-red-100'} flex items-center justify-center mr-3`}>
                      <AlertCircle size={16} className={darkMode ? 'text-red-400' : 'text-red-500'} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Emergency Contact</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileData.emergencyContact}
                          onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                          className={`w-full text-sm mt-1 px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}
                          placeholder="Name and phone number"
                        />
                      ) : (
                        <p className="text-sm font-medium">{profileData.emergencyContact || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`rounded-xl shadow-sm p-6 transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Achievements</h3>
                <span className={darkMode ? 'text-xs text-blue-400' : 'text-xs text-blue-500'}>View All</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center p-2">
                  <div className={`w-12 h-12 ${darkMode ? 'bg-green-900 bg-opacity-50' : 'bg-green-100'} rounded-full flex items-center justify-center mb-1`}>
                    <Award className={darkMode ? 'text-green-400' : 'text-green-600'} size={24} />
                  </div>
                  <p className="text-xs text-center">30-Day Streak</p>
                </div>
                <div className="flex flex-col items-center p-2">
                  <div className={`w-12 h-12 ${darkMode ? 'bg-purple-900 bg-opacity-50' : 'bg-purple-100'} rounded-full flex items-center justify-center mb-1`}>
                    <Activity className={darkMode ? 'text-purple-400' : 'text-purple-600'} size={24} />
                  </div>
                  <p className="text-xs text-center">A1C Goal</p>
                </div>
                <div className="flex flex-col items-center p-2">
                  <div className={`w-12 h-12 ${darkMode ? 'bg-blue-900 bg-opacity-50' : 'bg-blue-100'} rounded-full flex items-center justify-center mb-1`}>
                    <Heart className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={24} />
                  </div>
                  <p className="text-xs text-center">Hydration</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className={`rounded-xl shadow-sm p-6 mb-6 transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText size={20} className={darkMode ? 'text-blue-400 mr-2' : 'text-blue-500 mr-2'} />
                  Health Records
                </h3>
                <div className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-500'} flex items-center cursor-pointer`}>
                  Export Data
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>Key Health Metrics</h4>
                  
                  <div className="space-y-4">
                    {Object.entries(profileData.healthMetrics).map(([key, data]) => (
                        <div key={key} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} mb-3`}>
  <div className="flex justify-between items-center mb-1">
    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          {isEditing ? (
                            <input
                              type="date"
                              value={data.date}
                              onChange={(e) => handleDateInputChange(key, e.target.value, key.split(': ')[0])}
                              className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'}`}
                            />
                          ) : (
    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDateForDisplay(data.date)}</span>
                          )}
  </div>
  <div className="flex items-end">
                          {isEditing ? (
                            <input
                              type="text"
                              value={data.value}
                              onChange={(e) => handleHealthMetricChange(key, 'value', e.target.value)}
                              className={`w-full text-lg font-semibold px-2 py-1 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'}`}
                            />
                          ) : (
    <span className="text-lg font-semibold">{data.value}</span>
                          )}
  </div>
</div>
))}
                  </div>
                </div>
                
                <div>
                  <h4 className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>Medical Information</h4>
                  
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} mb-3`}>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Primary Care Physician</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.primaryDoctor}
                        onChange={(e) => handleInputChange('primaryDoctor', e.target.value)}
                        className={`w-full font-medium mt-1 px-2 py-1 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'}`}
                        placeholder="Doctor's name"
                      />
                    ) : (
                      <div className="font-medium">{profileData.primaryDoctor || 'Not provided'}</div>
                    )}
                  </div>
                  
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} mb-3`}>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Next Appointment</span>
                    {isEditing ? (
                      <input
                        type="date"
                        value={profileData.nextAppointment}
                        onChange={(e) => handleDateInputChange('nextAppointment', e.target.value)}
                        className={`w-full font-medium mt-1 px-2 py-1 rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'}`}
                      />
                    ) : (
                    <div className="font-medium flex items-center">
                      <Clock size={16} className="mr-1" />
                        {profileData.nextAppointment || 'No upcoming appointments'}
                    </div>
                    )}
                  </div>
                  
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Allergies</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profileData.allergies.map((allergy, index) => (
                        <span 
                          key={index} 
                          className={`px-2 py-1 rounded text-xs ${
                            darkMode ? 'bg-red-900 bg-opacity-50 text-red-300' : 'bg-red-100 text-red-600'
                          } ${isEditing ? 'flex items-center' : ''}`}
                        >
                          {allergy}
                          {isEditing && (
                            <button 
                              onClick={() => handleRemoveAllergy(index)}
                              className="ml-1 text-red-400 hover:text-red-600"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                      {isEditing && (
                        <form 
                          onSubmit={handleAddAllergy}
                          className="flex items-center mt-1 w-full"
                        >
                          <input 
                            type="text"
                            value={newAllergy}
                            onChange={(e) => setNewAllergy(e.target.value)}
                            placeholder="Add allergy"
                            className={`px-2 py-1 rounded text-xs flex-1 ${
                              darkMode ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-600'
                            }`}
                          />
                          <button 
                            type="submit"
                            className={`px-2 py-1 rounded text-xs ml-2 ${
                              darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                            } flex items-center`}
                        >
                          <PlusCircle size={12} className="mr-1" /> Add
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`rounded-xl shadow-sm p-6 transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <Award size={20} className={darkMode ? 'text-blue-400 mr-2' : 'text-blue-500 mr-2'} />
                  Health Goals
                </h3>
                {isEditing && (
                  <button className={`px-3 py-1 rounded flex items-center text-sm ${darkMode ? 'bg-gray-700 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    <PlusCircle size={14} className="mr-1" /> Add Goal
                  </button>
                )}
              </div>
              
              <div className="space-y-6">
                {profileData.goals.map((goal, index) => (
                  <div 
                    key={index}
                    className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow px-4 py-3 mb-4`}
                  >
                    <div className="flex justify-between">
                      <div className="text-sm font-medium">{goal.title}</div>
                      <div className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                        {goal.target}
                      </div>
                    </div>
                    
                    <div className="mt-2 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 rounded-full bg-blue-500" 
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between mt-1">
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Progress</span>
                      <span className="text-xs font-medium">{goal.current}</span>
                    </div>
                   
                   {isEditing && goal.title.includes('Water Goal') && (
                     <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                       <label className="text-xs block mb-1">Water Goal (L)</label>
                       <input 
                         type="number" 
                         min="0"
                         step="0.1"
                         value={profileData.dailyWaterGoal}
                         onChange={(e) => handleInputChange('dailyWaterGoal', parseFloat(e.target.value))}
                         className={`w-full px-2 py-1 rounded text-sm ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'}`}
                       />
                     </div>
                   )}
                   
                   {isEditing && goal.title.includes('Carbs Goal') && (
                     <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                       <label className="text-xs block mb-1">Carbohydrate Goal (g)</label>
                       <input 
                         type="number" 
                         min="0"
                         value={profileData.dailyCarbohydrateGoal}
                         onChange={(e) => handleInputChange('dailyCarbohydrateGoal', parseInt(e.target.value))}
                         className={`w-full px-2 py-1 rounded text-sm ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'}`}
                       />
                     </div>
                   )}
                   
                   {isEditing && goal.title.includes('Protein Goal') && (
                     <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                       <label className="text-xs block mb-1">Protein Goal (g)</label>
                       <input 
                         type="number" 
                         min="0"
                         value={profileData.dailyProteinGoal}
                         onChange={(e) => handleInputChange('dailyProteinGoal', parseInt(e.target.value))}
                         className={`w-full px-2 py-1 rounded text-sm ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'}`}
                       />
                     </div>
                   )}
                   
                   {isEditing && goal.title.includes('Exercise Goal') && (
                     <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                       <label className="text-xs block mb-1">Exercise Goal (mins)</label>
                       <input 
                         type="number" 
                         min="0"
                         value={profileData.dailyExerciseGoal}
                         onChange={(e) => handleInputChange('dailyExerciseGoal', parseInt(e.target.value))}
                         className={`w-full px-2 py-1 rounded text-sm ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'}`}
                       />
                     </div>
                   )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;