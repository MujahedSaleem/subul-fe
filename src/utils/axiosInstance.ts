import axios from 'axios';
import { extractApiData } from './apiResponseHandler';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Cookie name for refresh token
const REFRESH_TOKEN_COOKIE = 'subul_refresh_token';

// Cookie configuration
const COOKIE_OPTIONS = {
  expires: 30, // 30 days
  secure: window.location.protocol === 'https:',
  sameSite: 'strict' as const
};

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is due to an expired token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Try to get refresh token from localStorage first, then from cookies
      let refreshToken = localStorage.getItem('refreshToken');
      
      // If not in localStorage, try cookies
      if (!refreshToken) {
        refreshToken = Cookies.get(REFRESH_TOKEN_COOKIE) || null;
        
        // If found in cookies, save to localStorage for consistency
        if (refreshToken) {
          console.log('Found refresh token in cookies during refresh attempt');
          localStorage.setItem('refreshToken', refreshToken);
        }
      }
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });

          // Use unified response handling for token refresh
          const { accessToken, refreshToken: newRefreshToken } = extractApiData<{ accessToken: string; refreshToken: string }>(response.data);
          
          // Store in localStorage
          localStorage.setItem('accessToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
            
            // Also store in cookies as backup
            Cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken, COOKIE_OPTIONS);
          }
          
          // Update the authorization header for the original request
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          
          // Process the queue with the new token
          processQueue(null, accessToken);
          
          return axios(originalRequest);
        } catch (refreshError) {
          // Handle refresh token failure
          console.error('Token refresh failed', refreshError);
          processQueue(refreshError, null);
          
          // Clear tokens from both localStorage and cookies
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userType');
          Cookies.remove(REFRESH_TOKEN_COOKIE);
          
          // Dispatch a custom event to notify AuthContext
          window.dispatchEvent(new CustomEvent('auth:logout'));
          
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token available
        isRefreshing = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userType');
        Cookies.remove(REFRESH_TOKEN_COOKIE);
        
        // Dispatch a custom event to notify AuthContext
        window.dispatchEvent(new CustomEvent('auth:logout'));
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
