import axios from 'axios';
import { extractApiData } from './apiResponseHandler';
import { getStoredTokens, storeTokens, clearTokens } from './tokenUtils';
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
let refreshPromise: Promise<string> | null = null;
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
  refreshPromise = null;
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
        // If we're already refreshing, wait for the existing refresh to complete
        if (refreshPromise) {
          try {
            const newToken = await refreshPromise;
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        } else {
          // Fallback to queueing if no promise is available
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axios(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Create a refresh promise that other requests can wait for
      refreshPromise = new Promise(async (resolve, reject) => {
        try {
          // Get the most current refresh token (important for rotation)
          const { refreshToken } = getStoredTokens();
          
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });

          // Use unified response handling for token refresh
          const { accessToken, refreshToken: newRefreshToken } = extractApiData<{ accessToken: string; refreshToken: string }>(response.data);
          
          // Store tokens using utility function (handles rotation)
          if (newRefreshToken) {
            storeTokens(accessToken, newRefreshToken);
          } else {
            localStorage.setItem('accessToken', accessToken);
          }
          
          resolve(accessToken);
        } catch (refreshError: any) {
          console.error('Token refresh failed', refreshError);
          
          // Only logout if it's actually an authentication error
          const isAuthError = refreshError.response?.status === 401 || 
                             refreshError.response?.status === 403 ||
                             refreshError.response?.data?.message?.includes('token') ||
                             refreshError.response?.data?.message?.includes('expired') ||
                             refreshError.response?.data?.message?.includes('invalid');
          
          if (isAuthError) {
            console.log('[Auth] Authentication error, logging out user');
            clearTokens();
            
            // Dispatch a custom event to notify AuthContext
            window.dispatchEvent(new CustomEvent('auth:logout'));
            
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          } else {
            console.log('[Auth] Refresh failed due to network/server error, keeping user logged in');
          }
          
          reject(refreshError);
        }
      });
      
      try {
        const newToken = await refreshPromise;
        
        // Update the authorization header for the original request
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        // Process the queue with the new token
        processQueue(null, newToken);
        
        return axios(originalRequest);
      } catch (refreshError) {
        // Handle refresh failure
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
