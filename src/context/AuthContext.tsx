import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/api';
import { ApiError } from '../services/api';

// User type definition
interface User {
  _id: string;
  name: string;
  email: string;
  token: string;
}

// Auth context type definition
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: () => boolean;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const user = authService.getCurrentUser();
        if (user) {
          setUser(user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // If there's an error getting the current user, clear local storage
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authService.login({ email, password });
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof ApiError) {
        setError(error.message);
      } else if (error instanceof Error) {
        setError(error.message || 'Failed to login');
      } else {
        setError('An unknown error occurred during login');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authService.register({ name, email, password });
      setUser(userData);
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof ApiError) {
        setError(error.message);
      } else if (error instanceof Error) {
        setError(error.message || 'Failed to register');
      } else {
        setError('An unknown error occurred during registration');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    try {
      authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear the user on frontend side even if there's an error
      setUser(null);
    }
  };
  
  // Clear error function
  const clearError = () => {
    setError(null);
  };
  
  // Check if user is authenticated
  const isAuthenticated = () => {
    return authService.isAuthenticated();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 