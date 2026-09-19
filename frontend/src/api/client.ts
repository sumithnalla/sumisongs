import axios from 'axios';

// In development, Vite proxy forwards /api to backend http://localhost:8000
// In production, VITE_API_URL can point to deployed backend
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL,
  withCredentials: true, // Send and receive HttpOnly cookies
  headers: {
    'Accept': 'application/json',
  },
});

// Response interceptor to catch 401 unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If not on login page and unauthorized, let caller handle or redirect
    return Promise.reject(error);
  }
);
