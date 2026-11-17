import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://diafit-j318.onrender.com/api'
);

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
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

    const patientId = localStorage.getItem('patientId');
    if (patientId && config.headers) {
      config.headers['X-Patient-Id'] = patientId;
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
        localStorage.removeItem('patientId');
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
        localStorage.removeItem('patientId');
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
    localStorage.removeItem('patientId');
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

export const adminService = {
  createUser: async (userData: { name: string; email: string; password: string; role: string }) =>
    api.post('/auth/users', userData),
};

export const patientAccessService = {
  getAssignments: async () => api.get('/patients/assignments'),
  getPatientAccess: async (patientId: string) => api.get(`/patients/${patientId}/access`),
  requestAccess: async (patientId: string, memberEmail: string) =>
    api.post(`/patients/${patientId}/access`, { memberEmail }),
  approveAccess: async (patientId: string, memberId: string) =>
    api.post(`/patients/${patientId}/access/${memberId}/approve`),
  revokeAccess: async (patientId: string, memberId: string) =>
    api.delete(`/patients/${patientId}/access/${memberId}`),
};

export const careDataService = {
  getSettings: async () => api.get('/care/settings'),
  updateSettings: async (settings: Record<string, number | null>) => api.put('/care/settings', settings),
  getDoses: async () => api.get('/care/doses'),
  scheduleDose: async (dose: { medicationName: string; scheduledFor: string; confirmed: true }) =>
    api.post('/care/doses', dose),
  logDose: async (occurrenceId: string, log: { takenAt: string; source: 'MANUAL'; notes: string; confirmed: true }) =>
    api.post(`/care/doses/${occurrenceId}/logs`, log),
  correctDose: async (occurrenceId: string, correction: { originalLogId: string; takenAt: string; notes: string; confirmed: true }) =>
    api.post(`/care/doses/${occurrenceId}/corrections`, correction),
  getConflicts: async () => api.get('/care/dose-conflicts'),
  resolveConflict: async (conflictId: string, selectedLogId: string) =>
    api.post(`/care/dose-conflicts/${conflictId}/resolve`, { selectedLogId, confirmed: true }),
  getGlucoseReadings: async () => api.get('/care/glucose'),
  logGlucose: async (reading: { valueMgDl: number; context: string; measuredAt: string; source: 'MANUAL'; notes: string; confirmed: true }) =>
    api.post('/care/glucose', reading),
};

export const careAlertService = {
  getAlerts: async () => api.get('/care/alerts'),
  getInbox: async () => api.get('/care/alerts/inbox'),
  getWhatsAppPreference: async () => api.get('/care/alerts/whatsapp-preference'),
  saveWhatsAppPreference: async (preference: { whatsappNumber: string; whatsappOptIn: boolean }) =>
    api.put('/care/alerts/whatsapp-preference', preference),
  acknowledge: async (alertId: string) => api.post(`/care/alerts/${alertId}/acknowledge`),
  triggerSos: async (input: { confirmed: true; latitude?: number; longitude?: number }) =>
    api.post('/care/alerts/sos', input),
};

export const careReportService = {
  getSummary: async (days = 30) => api.get('/care/reports/summary', { params: { days } }),
};

export const careShiftService = {
  getShifts: async () => api.get('/care/shifts'),
  createShift: async (shift: { caregiverEmail: string; startsAt: string; endsAt: string; confirmed: true }) =>
    api.post('/care/shifts', shift),
  cancelShift: async (shiftId: string) => api.delete(`/care/shifts/${shiftId}`),
};

export default api; 