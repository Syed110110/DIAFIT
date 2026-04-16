import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API base URL - hardcoded to localhost since process.env is causing errors in the browser
const API_URL = 'http://localhost:5000/api';

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Create an axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the token to all requests
api.interceptors.request.use(
  (config) => {
    // Get the token from local storage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the authorization header
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`API Request to ${config.url}: Token attached`);
    } else {
      console.warn(`API Request to ${config.url}: No token available`);
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response from ${response.config.url}: Status ${response.status}`);
    return response.data;
  },
  (error: AxiosError) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`API Error ${error.response.status} from ${error.config?.url}:`, error.response.data);
      
      // If unauthorized, remove token and user data
      if (error.response.status === 401) {
        console.warn('Unauthorized request. Clearing authentication data.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // If on a protected page, redirect to login
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          console.warn('Redirecting to login page due to authentication issue');
          window.location.href = '/login';
        }
      }
      
      throw new ApiError(
        error.response.data.message || 'Server error',
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error: No response received', error.request);
      throw new ApiError('No response from server', 0);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error: Request setup failed', error.message);
      throw new ApiError(error.message, 0);
    }
  }
);

// Safe API call function that never throws
export const safeApiCall = async <T>(promise: Promise<T>): Promise<T | null> => {
  try {
    return await promise;
  } catch (error) {
    console.error('API call failed:', error);
    return null;
  }
};

// Authentication services
export const authService = {
  // Register user
  register: async (userData: { name: string; email: string; password: string }) => {
    try {
      const response = await api.post('/auth/signup', userData);
      if (response) {
        console.log('Registration successful, saving token and user data');
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response));
      }
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login user
  login: async (userData: { email: string; password: string }) => {
    try {
      const response = await api.post('/auth/signin', userData);
      if (response) {
        console.log('Login successful, saving token and user data');
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response));
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout user
  logout: () => {
    console.log('Logging out, removing token and user data');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('Current user retrieved from localStorage:', user._id);
        return user;
      }
      console.log('No user found in localStorage');
      return null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      // If there's an error parsing the JSON, clear the corrupted data
      localStorage.removeItem('user');
      return null;
    }
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    const hasToken = !!localStorage.getItem('token');
    console.log(`Authentication check: ${hasToken ? 'Authenticated' : 'Not authenticated'}`);
    return hasToken;
  }
};

export default api; 