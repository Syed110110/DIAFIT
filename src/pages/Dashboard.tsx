import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Heart, Scale, Flame, Droplets, ChevronRight, Apple } from 'lucide-react';
import { profileService, waterService } from '../services/dashboardService';
import SosButton from '../components/SosButton';
import { useAuth } from '../context/AuthContext';

// NEW: Import the Streak Badge
import StreakBadge from '../components/StreakBadge';

// 1. We define the exact blueprints for our data so TypeScript stops complaining about "any"
interface HealthMetrics {
  a1c?: { value?: string };
  bloodPressure?: { value?: string };
  heartRate?: { value?: string };
}

interface ProfileData {
  name?: string;
  healthMetrics?: HealthMetrics;
  // NEW: Tell TypeScript about the streak data coming from the backend
  streakData?: {
    currentStreak: number;
    longestStreak: number;
    lastGoalMetDate: string | null;
  };
}

interface WaterData {
  currentAmount?: number;
  dailyGoal?: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // 2. We use our precise blueprints here instead of <any>
  const [healthData, setHealthData] = useState<ProfileData | null>(null);
  const [waterData, setWaterData] = useState<WaterData | null>(null);
  
  // (Removed the hardcoded streakDays state to use real backend data)

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
  
  // NEW: Safely extract real streak data
  const currentStreak = healthData?.streakData?.currentStreak || 0;
  const longestStreak = healthData?.streakData?.longestStreak || 0;
  
  if (isLoading) {
    return (
      <div className="dia-workspace flex min-h-screen items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Activity className="h-12 w-12 text-blue-500 mb-4 animate-bounce" />
          <p className="text-gray-500 font-medium">Loading your health hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dia-workspace relative min-h-screen pb-20">
      {/* Global Emergency SOS Button */}
      <SosButton />

      {/* Hero Welcome Section */}
      <section className="dia-dashboard-hero px-6 pb-20 pt-10 text-white sm:pt-12">
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="dia-eyebrow mb-3">DAILY CARE BRIEF <span className="ml-2 text-white/60">/ {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span></p>
            <h1 className="mb-2 text-3xl font-semibold sm:text-4xl">Welcome back, {(healthData?.name || user?.name)?.split(' ')[0] || 'Guest'}.</h1>
            <p className="max-w-xl text-base text-white/75">A concise view of today’s care activity and patient-reported progress.</p>
          </div>
          
          {/* Gamification Streak Badge (Now using real currentStreak) */}
          <div className="flex items-center gap-4 rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div className="rounded-md bg-[var(--dia-lime)] p-3 text-[var(--dia-ink)]">
              <Flame className="h-8 w-8 fill-current" />
            </div>
            <div>
              <p className="mb-0.5 text-xs font-bold uppercase tracking-wide text-white/65">Current streak</p>
              <p className="text-2xl font-bold text-white">{currentStreak} days</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Vital Stats Card */}
          <div className="flex flex-col rounded-lg border border-[var(--dia-line)] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-md bg-[#fbe9e4] p-2.5 text-[var(--dia-coral)]">
                <Heart className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Vital Stats</h2>
            </div>
            
            <div className="space-y-4 flex-grow">
              <div className="flex items-center justify-between border-b border-[var(--dia-line)] py-3">
                <span className="text-gray-500 font-medium">Blood Glucose (A1c)</span>
                <span className="font-bold text-gray-800">{healthData?.healthMetrics?.a1c?.value || '--'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--dia-line)] py-3">
                <span className="text-gray-500 font-medium">Blood Pressure</span>
                <span className="font-bold text-gray-800">{healthData?.healthMetrics?.bloodPressure?.value || '--'}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-500 font-medium">Resting Heart Rate</span>
                <span className="font-bold text-gray-800">{healthData?.healthMetrics?.heartRate?.value || '--'} bpm</span>
              </div>
            </div>
            
            <Link to="/profile" className="group mt-5 flex w-full items-center justify-center rounded-md border border-[var(--dia-line)] py-3 text-sm font-semibold text-[var(--dia-ink-soft)] transition-colors hover:bg-[#edf4ef]">
              Update Vitals <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Hydration Tracker Card */}
          <div className="flex flex-col rounded-lg border border-[var(--dia-line)] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-md bg-[#e6f2ec] p-2.5 text-[var(--dia-green)]">
                <Droplets className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Hydration</h2>
            </div>
            
            <div className="flex-grow flex flex-col justify-center items-center">
              <div className="relative h-32 w-32 mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--dia-green)" strokeWidth="10" 
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
            
            <Link to="/water-tracker" className="group mt-5 flex w-full items-center justify-center rounded-md bg-[#e6f2ec] py-3 text-sm font-semibold text-[var(--dia-green-dark)] transition-colors hover:bg-[#dcece2]">
              Log Water <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Quick Actions Panel */}
          <div className="md:col-span-3 lg:col-span-1 flex flex-col gap-4">
            
            {/* NEW: Inserted the Detailed Streak Badge Component right here! */}
            <StreakBadge currentStreak={currentStreak} longestStreak={longestStreak} darkMode={false} />

            <h2 className="text-xl font-bold text-gray-800 mb-2 px-2 mt-2">Quick Tools</h2>
            
            <Link to="/diet-planner" className="group flex items-center justify-between rounded-lg bg-[var(--dia-green)] p-5 text-white shadow-sm transition-colors hover:bg-[var(--dia-green-dark)]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl"><Apple className="h-6 w-6" /></div>
                <div>
                  <h3 className="font-bold text-lg">Diet Planner</h3>
                  <p className="text-emerald-100 text-sm">Log your meals</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link to="/exercise-videos" className="group flex items-center justify-between rounded-lg bg-[var(--dia-ink-soft)] p-5 text-white shadow-sm transition-colors hover:bg-[var(--dia-ink)]">
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