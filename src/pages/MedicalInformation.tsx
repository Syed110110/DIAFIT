import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { Activity, Heart, User, Scale, LineChart, Clock, Clipboard, Droplets, Zap, Loader, AlertTriangle, CheckCircle } from 'lucide-react';
import { profileService, waterService } from '../services/dashboardService';

const HealthProfileForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    bloodGlucose: '',
    sleepHours: '',
    waterIntake: '',
    exerciseMinutes: '',
    stepsPerDay: '',
    diabetesType: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const data = await profileService.getProfile();
        console.log('Loaded profile data:', data);
        
        // Format and set the data in the form
        setFormData({
          name: data.name || '',
          age: data.age?.toString() || '',
          gender: data.gender || '',
          height: data.height?.toString() || '',
          weight: data.weight?.toString() || '',
          bloodPressureSystolic: data.healthMetrics?.bloodPressure?.value?.split('/')[0] || '',
          bloodPressureDiastolic: data.healthMetrics?.bloodPressure?.value?.split('/')[1] || '',
          heartRate: data.healthMetrics?.heartRate?.value || '',
          bloodGlucose: data.healthMetrics?.a1c?.value?.replace('%', '') || '',
          sleepHours: data.sleepHours?.toString() || '',
          waterIntake: (data.dailyWaterGoal / 1000)?.toString() || '2',
          exerciseMinutes: data.dailyExerciseGoal?.toString() || '30',
          stepsPerDay: data.dailyStepsGoal?.toString() || '5000',
          diabetesType: data.diabetesType || 'Type 2'
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load your health profile. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Format the data for the API
      const profileUpdateData = {
        name: formData.name,
        age: parseInt(formData.age) || 0,
        gender: formData.gender,
        height: parseInt(formData.height) || 0,
        weight: parseInt(formData.weight) || 0,
        diabetesType: formData.diabetesType,
        dailyWaterGoal: parseFloat(formData.waterIntake) * 1000 || 2000, // Convert to ml
        dailyExerciseGoal: parseInt(formData.exerciseMinutes) || 30,
        dailyStepsGoal: parseInt(formData.stepsPerDay) || 5000,
        sleepHours: parseInt(formData.sleepHours) || 8,
        
        // Health metrics
        healthMetrics: {
          bloodPressure: { 
            value: `${formData.bloodPressureSystolic}/${formData.bloodPressureDiastolic}`,
            date: new Date().toLocaleDateString()
          },
          heartRate: {
            value: formData.heartRate,
            date: new Date().toLocaleDateString()
          },
          a1c: {
            value: `${formData.bloodGlucose}%`,
            date: new Date().toLocaleDateString()
          }
        }
      };
      
      console.log("Sending profile update:", profileUpdateData);
      const result = await profileService.updateProfile(profileUpdateData);
      
      if (result.success) {
        // Update localStorage for immediate use by other components
        const waterGoal = parseFloat(formData.waterIntake) * 1000 || 2000;
        
        try {
          // Get and update water data
          const waterData = await waterService.getTodayWaterIntake();
          if (waterData && typeof waterData === 'object') {
            // Only update goal, not entries
            waterData.dailyWaterGoal = waterGoal;
            
            // Force a refresh of water service data in local storage
            if (window.mockBackendService && typeof window.mockBackendService.updateWaterGoal === 'function') {
              await window.mockBackendService.updateWaterGoal(waterGoal);
            }
          }
        } catch (waterErr) {
          console.error("Error updating water goal in real-time:", waterErr);
        }
        
        setSuccess("Health information updated successfully!");
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError("Failed to update health information. Please try again.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("An error occurred while saving your health information.");
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="animate-spin h-10 w-10 mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading your health profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Background Image */}
      <section className="relative py-24">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2670&auto=format&fit=crop" 
            alt="Health background" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-90"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 text-center">
          <Heart className="h-16 w-16 mx-auto mb-8 text-blue-200" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">Your Health Profile</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Help us personalize your DiaFit experience by sharing your health metrics.
            Together, we can create a healthier, more active lifestyle.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 -mt-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Status messages */}
            {error && (
              <div className="bg-red-50 p-4 flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 p-4 flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-green-700">{success}</p>
              </div>
            )}
            
            <div className="p-8">
              <form onSubmit={handleSubmit}>
                {/* Personal Information */}
                <div className="mb-12">
                  <div className="flex items-center mb-8">
                    <div className="p-3 bg-blue-100 rounded-full mr-4">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                      <input
                        type="number"
                        name="age"
                        id="age"
                        value={formData.age}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="25"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <div className="grid grid-cols-3 gap-4">
                        {["Male", "Female", "Other"].map((option) => (
                          <div 
                            key={option} 
                            onClick={() => setFormData({...formData, gender: option.toLowerCase()})}
                            className={`p-3 border rounded-lg text-center cursor-pointer transition-all ${
                              formData.gender === option.toLowerCase() 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'border-gray-300 hover:border-blue-400'
                            }`}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="diabetesType" className="block text-sm font-medium text-gray-700 mb-1">Diabetes Type</label>
                      <select
                        name="diabetesType"
                        id="diabetesType"
                        value={formData.diabetesType}
                        onChange={(e) => setFormData({...formData, diabetesType: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Type 1">Type 1</option>
                        <option value="Type 2">Type 2</option>
                        <option value="Gestational">Gestational</option>
                        <option value="Prediabetes">Prediabetes</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Body Measurements with Image */}
                <div className="mb-12">
                  <div className="flex items-center mb-8">
                    <div className="p-3 bg-purple-100 rounded-full mr-4">
                      <Scale className="h-8 w-8 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Body Measurements</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                    <div className="md:col-span-2">
                      <img 
                        src="https://media.istockphoto.com/id/1490900895/vector/weight-loss.jpg?s=612x612&w=0&k=20&c=LGFMkXbtwvL7oFIbnKcGnQTh3zvBHaobOb_gDV-4cBk=" 
                        alt="Body measurements illustration" 
                        className="rounded-xl shadow-md w-full h-full object-cover"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                          <div className="relative mt-1">
                            <input
                              type="number"
                              name="height"
                              id="height"
                              value={formData.height}
                              onChange={handleChange}
                              className="w-full p-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              placeholder="175"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">cm</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                          <div className="relative mt-1">
                            <input
                              type="number"
                              name="weight"
                              id="weight"
                              value={formData.weight}
                              onChange={handleChange}
                              className="w-full p-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              placeholder="70"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">kg</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-800">
                          Your BMI will be automatically calculated from your height and weight measurements to help track your health progress.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vital Signs with Card Design */}
                <div className="mb-12">
                  <div className="flex items-center mb-8">
                    <div className="p-3 bg-red-100 rounded-full mr-4">
                      <Heart className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Vital Signs</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl shadow-sm border border-red-100">
                      <h3 className="flex items-center text-lg font-semibold text-red-800 mb-4">
                        <Heart className="h-5 w-5 mr-2" /> Blood Pressure
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="bloodPressureSystolic" className="block text-sm font-medium text-gray-700 mb-1">
                            Systolic
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              name="bloodPressureSystolic"
                              id="bloodPressureSystolic"
                              value={formData.bloodPressureSystolic}
                              onChange={handleChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              placeholder="120"
                            />
                            <span className="absolute right-3 top-3 text-gray-500">mmHg</span>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="bloodPressureDiastolic" className="block text-sm font-medium text-gray-700 mb-1">
                            Diastolic
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              name="bloodPressureDiastolic"
                              id="bloodPressureDiastolic"
                              value={formData.bloodPressureDiastolic}
                              onChange={handleChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              placeholder="80"
                            />
                            <span className="absolute right-3 top-3 text-gray-500">mmHg</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-100">
                      <h3 className="flex items-center text-lg font-semibold text-blue-800 mb-4">
                        <Activity className="h-5 w-5 mr-2" /> Heart Rate
                      </h3>
                      <div>
                        <label htmlFor="heartRate" className="block text-sm font-medium text-gray-700 mb-1">Resting Heart Rate</label>
                        <div className="relative">
                          <input
                            type="number"
                            name="heartRate"
                            id="heartRate"
                            value={formData.heartRate}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="70"
                          />
                          <span className="absolute right-3 top-3 text-gray-500">bpm</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl shadow-sm border border-purple-100">
                      <h3 className="flex items-center text-lg font-semibold text-purple-800 mb-4">
                        <LineChart className="h-5 w-5 mr-2" /> Blood Glucose
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label htmlFor="bloodGlucose" className="block text-sm font-medium text-gray-700 mb-1">Fasting Blood Glucose</label>
                          <div className="relative">
                            <input
                              type="number"
                              name="bloodGlucose"
                              id="bloodGlucose"
                              value={formData.bloodGlucose}
                              onChange={handleChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              placeholder="90"
                            />
                            <span className="absolute right-3 top-3 text-gray-500">mg/dL</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center">
                          <img 
                            src="https://media.istockphoto.com/id/1275829214/vector/doctors-testing-blood-for-sugar-and-glucose.jpg?s=612x612&w=0&k=20&c=6C3POXsdGEKRQy2PsE6SyIOguIIi74cV9ZPh0IoU2Cs=" 
                            alt="Glucose icon" 
                            className="w-49 h-40 bottom-40 object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Health Habits with Detailed Cards */}
                <div className="mb-12">
                  <div className="flex items-center mb-8">
                    <div className="p-3 bg-green-100 rounded-full mr-4">
                      <Droplets className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Health Habits</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl shadow-sm border border-green-100">
                      <h3 className="flex items-center text-lg font-semibold text-green-800 mb-4">
                        <Droplets className="h-5 w-5 mr-2" /> Hydration
                      </h3>
                      <div>
                        <label htmlFor="waterIntake" className="block text-sm font-medium text-gray-700 mb-1">
                          Daily Water Goal
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name="waterIntake"
                            id="waterIntake"
                            value={formData.waterIntake}
                            onChange={handleChange}
                            step="0.1"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="2.0"
                          />
                          <span className="absolute right-3 top-3 text-gray-500">liters</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl shadow-sm border border-blue-100">
                      <h3 className="flex items-center text-lg font-semibold text-blue-800 mb-4">
                        <Clock className="h-5 w-5 mr-2" /> Sleep
                      </h3>
                      <div>
                        <label htmlFor="sleepHours" className="block text-sm font-medium text-gray-700 mb-1">
                          Average Sleep
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name="sleepHours"
                            id="sleepHours"
                            value={formData.sleepHours}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="8"
                          />
                          <span className="absolute right-3 top-3 text-gray-500">hours</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl shadow-sm border border-purple-100">
                      <h3 className="flex items-center text-lg font-semibold text-purple-800 mb-4">
                        <Activity className="h-5 w-5 mr-2" /> Exercise
                      </h3>
                      <div>
                        <label htmlFor="exerciseMinutes" className="block text-sm font-medium text-gray-700 mb-1">
                          Daily Exercise Goal
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name="exerciseMinutes"
                            id="exerciseMinutes"
                            value={formData.exerciseMinutes}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="30"
                          />
                          <span className="absolute right-3 top-3 text-gray-500">minutes</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl shadow-sm border border-amber-100">
                      <h3 className="flex items-center text-lg font-semibold text-amber-800 mb-4">
                        <Zap className="h-5 w-5 mr-2" /> Activity
                      </h3>
                      <div>
                        <label htmlFor="stepsPerDay" className="block text-sm font-medium text-gray-700 mb-1">
                          Daily Steps Goal
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name="stepsPerDay"
                            id="stepsPerDay"
                            value={formData.stepsPerDay}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            placeholder="10000"
                          />
                          <span className="absolute right-3 top-3 text-gray-500">steps</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Blood Glucose & Health Information */}
                <div className="mb-12">
                  <div className="flex items-center mb-8">
                    <div className="p-3 bg-indigo-100 rounded-full mr-4">
                      <Clipboard className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Blood Glucose & Health</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl shadow-sm border border-indigo-100">
                      <h3 className="flex items-center text-lg font-semibold text-indigo-800 mb-4">
                        <LineChart className="h-5 w-5 mr-2" /> A1c Level
                      </h3>
                      <div>
                        <label htmlFor="bloodGlucose" className="block text-sm font-medium text-gray-700 mb-1">
                          Latest Reading
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name="bloodGlucose"
                            id="bloodGlucose"
                            value={formData.bloodGlucose}
                            onChange={handleChange}
                            step="0.1"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="6.5"
                          />
                          <span className="absolute right-3 top-3 text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 bg-indigo-50 p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-indigo-800 mb-2">Understanding Your A1c</h3>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center">
                          <span className="h-3 w-3 bg-green-500 rounded-full mr-2"></span>
                          <span className="text-gray-700"><b>Below 5.7%:</b> Normal</span>
                        </p>
                        <p className="flex items-center">
                          <span className="h-3 w-3 bg-yellow-500 rounded-full mr-2"></span>
                          <span className="text-gray-700"><b>5.7% to 6.4%:</b> Prediabetes</span>
                        </p>
                        <p className="flex items-center">
                          <span className="h-3 w-3 bg-red-500 rounded-full mr-2"></span>
                          <span className="text-gray-700"><b>6.5% or higher:</b> Diabetes</span>
                        </p>
                        <p className="mt-4 text-gray-600">
                          A1c tests measure your average blood glucose over the past 2-3 months.
                          Regular testing helps track your diabetes management progress.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-12">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`w-full py-4 px-6 rounded-xl text-white font-medium text-lg shadow-md 
                      ${isSaving 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                      }
                      transition-colors`}
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center">
                        <Loader className="animate-spin h-5 w-5 mr-3" />
                        Saving...
                      </span>
                    ) : (
                      'Save Health Information'
                    )}
                  </button>
                  <p className="text-center text-gray-500 mt-4 text-sm">
                    Your health information is securely stored and will only be used to personalize your DiaFit experience.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Health Tips */}
      <section className="bg-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Health Tips</h2>
            <p className="text-gray-600 mt-2">Stay healthy with these simple tips</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <Heart className="h-6 w-6 text-red-500 mr-2" />
                <h3 className="text-lg font-semibold">Heart Health</h3>
              </div>
              <p className="text-gray-700">Regular monitoring of blood pressure and heart rate can help identify potential health issues early.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <Droplets className="h-6 w-6 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold">Stay Hydrated</h3>
              </div>
              <p className="text-gray-700">Drinking adequate water helps maintain energy levels, supports cognitive function, and promotes overall health.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <Activity className="h-6 w-6 text-green-500 mr-2" />
                <h3 className="text-lg font-semibold">Daily Activity</h3>
              </div>
              <p className="text-gray-700">Aim for at least 30 minutes of moderate exercise and 10,000 steps daily for optimal health benefits.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HealthProfileForm;