import React, { Component, ErrorInfo } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import ProfilePage from './pages/Profile';
import DietPlanner from './pages/DietPlanner';
import Dashboard from './pages/Dashboard';
import WaterTracker from './pages/WaterTracker';
import ExerciseVideos from './pages/ExerciseVideos';
import ExerciseTracker from './pages/ExerciseTracker';
import MedicalInformation from './pages/MedicalInformation';
import AiAssistant from './pages/AiAssistant';
import AboutUs from './pages/AboutUs';
import NutritionTracker from './pages/NutritionTracker';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

// Global Error Boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-700 mb-6">
              We're sorry, but there was an error loading the application. Please try refreshing the page.
            </p>
            <div className="mb-4">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
              >
                Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = "/"} 
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Go to Home
              </button>
            </div>
            <div className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-60">
              <p className="font-bold mb-2">Error details (for developers):</p>
              <pre className="text-xs">{this.state.error?.toString()}</pre>
              <pre className="text-xs mt-2">{this.state.errorInfo?.componentStack}</pre>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/about-us" element={<AboutUs />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/diet-planner" element={<DietPlanner />} />
                <Route path="/water-tracker" element={<WaterTracker />} />
                <Route path="/nutrition-tracker" element={<NutritionTracker />} />
                <Route path="/exercise-videos" element={<ExerciseVideos />} />
                <Route path="/exercise-tracker" element={<ExerciseTracker />} />
                <Route path="/medicalInformation" element={<MedicalInformation />} />
                <Route path="/Ai-Assistant" element={<AiAssistant />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;