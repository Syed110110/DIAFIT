import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  redirectPath = '/login' 
}) => {
  const { user, loading, error, isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Handle loading state
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    );
  }
  
  // Handle authentication error
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mb-4">
          <p className="font-bold">Authentication Error</p>
          <p>{error}</p>
        </div>
        <button 
          onClick={() => window.location.href = redirectPath}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Return to Login
        </button>
      </div>
    );
  }
  
  // Check if user is authenticated
  if (!user || !isAuthenticated()) {
    // Save the location they were trying to go to
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If they are authenticated, render the protected content
  return <Outlet />;
};

export default ProtectedRoute; 