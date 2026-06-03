import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Heart, Scale, Flame, Droplets, ChevronRight, Apple } from 'lucide-react';
import { profileService, waterService } from '../services/dashboardService';
import SosButton from '../components/SosButton';

// 1. We define the exact blueprints for our data so TypeScript stops complaining about "any"
interface HealthMetrics {
  a1c?: { value?: string };
  bloodPressure?: { value?: string };
  heartRate?: { value?: string };
}

interface ProfileData {
  name?: string;
  healthMetrics?: HealthMetrics;
}

interface WaterData {
  currentAmount?: number;
  dailyGoal?: number;
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  
  // 2. We use our precise blueprints here instead of <any>
  const [healthData, setHealthData] = useState<ProfileData | null>(null);
  const [waterData, setWaterData] = useState<WaterData | null>(null);
  
  // 3. setStreakDays is removed so the "unused variable" error disappears
  const [streakDays] = useState(3);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Fetch data from both services simultaneously
        const [profileRes, waterRes] = await Promise.all([
          profileService.getProfile(),
          waterService.getTodayWaterIntake()
        ]);
        
        // Safely tell TypeScript that the data matches our blueprints
        setHealthData(profileRes as ProfileData);
        setWaterData(waterRes as WaterData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Safely calculate percentages for progress bars
  const currentWater = waterData?.currentAmount || 0;
  const goalWater = waterData?.dailyGoal || 2000;
  const waterProgress = waterData ? Math.min((currentWater / goalWater) * 100, 100) : 0;
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <Activity className="h-12 w-12 text-blue-500 mb-4 animate-bounce" />
          <p className="text-gray-500 font-medium">Loading your health hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      {/* Global Emergency SOS Button */}
      <SosButton />

      {/* Hero Welcome Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white pt-12 pb-24 px-6 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
          <div className="absolute top-1/2 -left-24 w-64 h-64 rounded-full bg-blue-400 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {healthData?.name?.split(' ')[0] || 'Guest'}!</h1>
            <p className="text-blue-100 text-lg">Here is your health summary for today.</p>
          </div>
          
          {/* Gamification Streak Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-500/30">
              <Flame className="h-8 w-8 fill-current" />
            </div>
            <div>
              <p className="text-xs text-blue-100 font-bold uppercase tracking-widest mb-0.5">Current Streak</p>
              <p className="text-2xl font-black text-white">{streakDays} Days</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Vital Stats Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-red-100 text-red-600 rounded-xl">
                <Heart className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Vital Stats</h2>
            </div>
            
            <div className="space-y-4 flex-grow">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 font-medium">Blood Glucose (A1c)</span>
                <span className="font-bold text-gray-800">{healthData?.healthMetrics?.a1c?.value || '--'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 font-medium">Blood Pressure</span>
                <span className="font-bold text-gray-800">{healthData?.healthMetrics?.bloodPressure?.value || '--'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 font-medium">Resting Heart Rate</span>
                <span className="font-bold text-gray-800">{healthData?.healthMetrics?.heartRate?.value || '--'} bpm</span>
              </div>
            </div>
            
            <Link to="/profile" className="mt-6 flex items-center justify-center w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold rounded-xl transition-colors text-sm group">
              Update Vitals <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Hydration Tracker Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <Droplets className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Hydration</h2>
            </div>
            
            <div className="flex-grow flex flex-col justify-center items-center">
              <div className="relative h-32 w-32 mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="10" 
                    strokeDasharray={`${waterProgress * 2.83} 283`} strokeLinecap="round" 
                    className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800">{currentWater}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase">ml</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">
                Goal: <span className="text-gray-800">{goalWater} ml</span>
              </p>
            </div>
            
            <Link to="/water-tracker" className="mt-6 flex items-center justify-center w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl transition-colors text-sm group">
              Log Water <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Quick Actions Panel */}
          <div className="md:col-span-3 lg:col-span-1 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2 px-2">Quick Tools</h2>
            
            <Link to="/diet-planner" className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5 rounded-2xl text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl"><Apple className="h-6 w-6" /></div>
                <div>
                  <h3 className="font-bold text-lg">Diet Planner</h3>
                  <p className="text-emerald-100 text-sm">Log your meals</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link to="/exercise-videos" className="bg-gradient-to-r from-purple-500 to-indigo-500 p-5 rounded-2xl text-white shadow-lg shadow-purple-500/20 hover:scale-[1.02] transition-transform flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl"><Activity className="h-6 w-6" /></div>
                <div>
                  <h3 className="font-bold text-lg">Workouts</h3>
                  <p className="text-purple-100 text-sm">Start your routine</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link to="/medicalInformation" className="bg-white border-2 border-gray-100 p-5 rounded-2xl text-gray-800 shadow-sm hover:border-blue-200 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 text-gray-600 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><Scale className="h-6 w-6" /></div>
                <div>
                  <h3 className="font-bold text-lg">Body Metrics</h3>
                  <p className="text-gray-500 text-sm">Update your weight</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
}