import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { Heart, User, Scale, Activity, Droplets, Clipboard, Loader, AlertTriangle, CheckCircle, MessageSquare, Clock } from 'lucide-react';
import { profileService } from '../services/dashboardService';

export default function MedicalInformation() {
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
    diabetesType: '',
    whatsappEnabled: true,
    reminderTime: '20:00'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const res = await profileService.getProfile();
        const data = res as {
          name?: string;
          age?: number;
          gender?: string;
          height?: number;
          weight?: number;
          diabetesType?: string;
          dailyWaterGoal?: number;
          dailyExerciseGoal?: number;
          dailyStepsGoal?: number;
          sleepHours?: number;
          whatsappEnabled?: boolean;
          reminderTime?: string;
          healthMetrics?: {
            bloodPressure?: { value?: string };
            heartRate?: { value?: string };
            a1c?: { value?: string };
          };
        };

        if (data) {
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
            waterIntake: data.dailyWaterGoal ? (data.dailyWaterGoal / 1000).toString() : '2.0',
            exerciseMinutes: data.dailyExerciseGoal?.toString() || '30',
            stepsPerDay: data.dailyStepsGoal?.toString() || '5000',
            diabetesType: data.diabetesType || 'Type 2',
            whatsappEnabled: data.whatsappEnabled !== undefined ? data.whatsappEnabled : true,
            reminderTime: data.reminderTime || '20:00'
          });
        }
        setError(null);
      } catch {
        setError('Failed to load your health profile. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleWhatsApp = () => {
    setFormData(prev => ({ ...prev, whatsappEnabled: !prev.whatsappEnabled }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);

      const profileUpdateData = {
        name: formData.name,
        age: parseInt(formData.age, 10) || 0,
        gender: formData.gender,
        height: parseInt(formData.height, 10) || 0,
        weight: parseInt(formData.weight, 10) || 0,
        diabetesType: formData.diabetesType,
        dailyWaterGoal: parseFloat(formData.waterIntake) * 1000, 
        dailyExerciseGoal: parseInt(formData.exerciseMinutes, 10) || 30,
        dailyStepsGoal: parseInt(formData.stepsPerDay, 10) || 5000,
        sleepHours: parseInt(formData.sleepHours, 10) || 8,
        whatsappEnabled: formData.whatsappEnabled,
        reminderTime: formData.reminderTime,
        healthMetrics: {
          bloodPressure: { 
            value: `${formData.bloodPressureSystolic}/${formData.bloodPressureDiastolic}`,
            date: new Date().toLocaleDateString()
          },
          heartRate: { value: formData.heartRate, date: new Date().toLocaleDateString() },
          a1c: { value: `${formData.bloodGlucose}%`, date: new Date().toLocaleDateString() }
        }
      };

      await profileService.updateProfile(profileUpdateData);
      setSuccess("Health information updated successfully!");
      setTimeout(() => setSuccess(null), 4000);
    } catch {
      setError("An error occurred while saving your health information.");
    } finally {
      setIsSaving(false);
    }
  };

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
      <section className="relative py-24">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2670&auto=format&fit=crop" 
            alt="Health background" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-90"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center flex flex-col items-center justify-center">
          <Heart className="h-16 w-16 mx-auto mb-8 text-blue-200" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">Your Health Profile</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Help us personalize your DiaFit experience by sharing your health metrics.
          </p>
        </div>
      </section>

      <section className="py-16 -mt-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden">
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
                  <div className="mb-12">
                    <div className="flex items-center mb-8">
                      <div className="p-3 bg-blue-100 rounded-full mr-4">
                        <User className="h-8 w-8 text-blue-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="John Doe" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                        <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="21" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <div className="grid grid-cols-3 gap-4">
                          {["male", "female", "other"].map((option) => (
                            <div 
                              key={option} 
                              onClick={() => setFormData({...formData, gender: option})}
                              className={`p-3 border rounded-lg text-center cursor-pointer capitalize transition-all ${
                                formData.gender === option ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:border-blue-400'
                              }`}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Diabetes Type</label>
                        <select name="diabetesType" value={formData.diabetesType} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg bg-white">
                          <option value="Type 1">Type 1</option>
                          <option value="Type 2">Type 2</option>
                          <option value="Gestational">Gestational</option>
                          <option value="Prediabetes">Prediabetes</option>
                          <option value="None">None</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-12">
                    <div className="flex items-center mb-8">
                      <div className="p-3 bg-purple-100 rounded-full mr-4">
                        <Scale className="h-8 w-8 text-purple-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">Body Measurements</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                      <div className="md:col-span-2">
                        <img src="https://media.istockphoto.com/id/1490900895/vector/weight-loss.jpg?s=612x612&w=0&k=20&c=LGFMkXbtwvL7oFIbnKcGnQTh3zvBHaobOb_gDV-4cBk=" alt="Body illustration" className="rounded-xl shadow-md w-full max-h-48 object-cover mx-auto" />
                      </div>
                      <div className="md:col-span-3 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                            <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="170" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                            <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="70" />
                          </div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-xs text-purple-800">
                          Your BMI will be automatically calculated from your height and weight measurements.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-12">
                    <div className="flex items-center mb-8">
                      <div className="p-3 bg-red-100 rounded-full mr-4">
                        <Heart className="h-8 w-8 text-red-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">Vital Signs</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border border-red-100">
                        <h3 className="flex items-center text-lg font-semibold text-red-800 mb-4"><Heart className="h-5 w-5 mr-2" /> Blood Pressure</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Systolic</label>
                            <div className="relative">
                              <input type="number" name="bloodPressureSystolic" value={formData.bloodPressureSystolic} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="120" />
                              <span className="absolute right-3 top-3 text-gray-400 text-xs">mmHg</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Diastolic</label>
                            <div className="relative">
                              <input type="number" name="bloodPressureDiastolic" value={formData.bloodPressureDiastolic} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="80" />
                              <span className="absolute right-3 top-3 text-gray-400 text-xs">mmHg</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="flex items-center text-lg font-semibold text-blue-800 mb-4"><Activity className="h-5 w-5 mr-2" /> Heart Rate</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Resting Heart Rate</label>
                          <div className="relative">
                            <input type="number" name="heartRate" value={formData.heartRate} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="70" />
                            <span className="absolute right-3 top-3 text-gray-400 text-xs">bpm</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="md:col-span-2 bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-100">
                        <h3 className="flex items-center text-lg font-semibold text-purple-800 mb-4"><Clipboard className="h-5 w-5 mr-2" /> Blood Glucose</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fasting Blood Glucose</label>
                            <div className="relative">
                              <input type="number" name="bloodGlucose" value={formData.bloodGlucose} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="6.5" />
                              <span className="absolute right-3 top-3 text-gray-400 text-xs">mg/dL</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-center">
                            <img src="https://media.istockphoto.com/id/1275829214/vector/doctors-testing-blood-for-sugar-and-glucose.jpg?s=612x612&w=0&k=20&c=6C3POXsdGEKRQy2PsE6SyIOguIIi74cV9ZPh0IoU2Cs=" alt="Glucose verification" className="w-20 h-20 object-contain" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-12">
                    <div className="flex items-center mb-8">
                      <div className="p-3 bg-green-100 rounded-full mr-4">
                        <Droplets className="h-8 w-8 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">Health Habits</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                        <h3 className="flex items-center text-lg font-semibold text-green-800 mb-4"><Droplets className="h-5 w-5 mr-2" /> Hydration</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Daily Water Target</label>
                          <div className="relative">
                            <input type="number" step="0.1" name="waterIntake" value={formData.waterIntake} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="2.0" />
                            <span className="absolute right-3 top-3 text-gray-400 text-xs">liters</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="flex items-center text-lg font-semibold text-blue-800 mb-4"><Clock className="h-5 w-5 mr-2" /> Sleep</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Average Sleep Duration</label>
                          <div className="relative">
                            <input type="number" name="sleepHours" value={formData.sleepHours} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="8" />
                            <span className="absolute right-3 top-3 text-gray-400 text-xs">hours</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-100">
                        <h3 className="flex items-center text-lg font-semibold text-purple-800 mb-4"><Activity className="h-5 w-5 mr-2" /> Exercise</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Daily Activity Window</label>
                          <div className="relative">
                            <input type="number" name="exerciseMinutes" value={formData.exerciseMinutes} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="30" />
                            <span className="absolute right-3 top-3 text-gray-400 text-xs">minutes</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-100">
                        <h3 className="flex items-center text-lg font-semibold text-amber-800 mb-4"><Scale className="h-5 w-5 mr-2" /> Step Target</h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Daily Steps Target</label>
                          <div className="relative">
                            <input type="number" name="stepsPerDay" value={formData.stepsPerDay} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="5000" />
                            <span className="absolute right-3 top-3 text-gray-400 text-xs">steps</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12">
                    <button type="submit" disabled={isSaving} className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-md transition-all ${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {isSaving ? 'Saving Health Metrics...' : 'Save Health Information'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><MessageSquare className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-bold text-gray-800">WhatsApp Notification Hub</h3>
                    <p className="text-xs text-gray-400 font-medium">Protect your active goals</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${formData.whatsappEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className="text-sm font-semibold text-gray-700">Automated Alert Reminder</span>
                  </div>
                  <button onClick={toggleWhatsApp} type="button" className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${formData.whatsappEnabled ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'}`}><div className="bg-white w-4 h-4 rounded-full shadow-sm"></div></button>
                </div>

                <div className={`space-y-4 transition-all ${formData.whatsappEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Daily Window Target Evaluation</label>
                    <select name="reminderTime" value={formData.reminderTime} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white text-sm">
                      <option value="18:00">6:00 PM (Early Check)</option>
                      <option value="20:00">8:00 PM (Standard Check)</option>
                      <option value="22:00">10:00 PM (Late Night Check)</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 text-xs rounded-xl font-medium text-slate-500 leading-relaxed border border-slate-100">
                  DiaFit system telemetry parameters sync updates in real-time. Unfinished targets generate automated nudge push sequences directly to your mobile layout line at the selected evaluation check window hour.
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}