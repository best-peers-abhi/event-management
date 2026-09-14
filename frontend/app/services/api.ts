import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Normalize Errors & Handle 401 Session Expiry
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data.message === 'string') {
        errorMessage = data.message;
      } else if (Array.isArray(data.message)) {
        errorMessage = data.message.join(', ');
      } else if (typeof data.error === 'string') {
        errorMessage = data.error;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Auto-clear auth storage if 401 Unauthorized
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      storage.clearAuth();
    }

    return Promise.reject(new Error(errorMessage));
  }
);
