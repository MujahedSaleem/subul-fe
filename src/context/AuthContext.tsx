import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';
import { useLocation } from 'react-router-dom';
import { extractApiData, handleApiError } from '../utils/apiResponseHandler';
import * as serviceWorkerRegistration from '../serviceWorkerRegistration';
import Cookies from 'js-cookie';

interface AuthContextType {
  isAuthenticated: boolean;
  userType: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// Cookie configuration
const COOKIE_OPTIONS = {
  expires: 30, // 30 days
  secure: window.location.protocol === 'https:',
  sameSite: 'strict' as const
};

// Cookie name for refresh token
const REFRESH_TOKEN_COOKIE = 'subul_refresh_token';

// Detect if the client is a mobile device
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userType: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation(); // Access current location

  useEffect(() => {
    // Listen for logout events from axiosInstance
    const handleLogout = () => {
      setIsAuthenticated(false);
      setUserType(null);
      setLoading(false);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    let refreshToken = localStorage.getItem('refreshToken');

    // If refresh token is not in localStorage, try to get it from cookies
    if (!refreshToken) {
      refreshToken = Cookies.get(REFRESH_TOKEN_COOKIE) || null;
      // If found in cookies, also save to localStorage for consistency
      if (refreshToken) {
        console.log('Found refresh token in cookies, saving to localStorage');
        localStorage.setItem('refreshToken', refreshToken);
      }
    }

    if (accessToken && refreshToken) {
      try {
        const decodedToken: any = jwtDecode(accessToken);
        const currentTime = Date.now() / 1000;
        
        // Check if token is expired
        if (decodedToken.exp < currentTime) {
          // Token is expired, but let axiosInstance handle refresh on first API call
          // Just set the user type from the expired token for now
          setUserType(decodedToken.role);
          setIsAuthenticated(true);
          setLoading(false);
        } else {
          // Token is valid
          setIsAuthenticated(true);
          setUserType(decodedToken.role);
          setLoading(false);
        }
      } catch (error) {
        try {
          refreshTokens(refreshToken);
        } catch (error) {
          console.error('Error decoding token:', error);
          // Invalid token format
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userType');
          Cookies.remove(REFRESH_TOKEN_COOKIE);
          setIsAuthenticated(false);
          setUserType(null);
          setLoading(false);
        }
     
      }
    } else if (refreshToken) {
      // Only refresh token exists, try to refresh
      refreshTokens(refreshToken);
    } else {
      // No tokens
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, [location.pathname]);

  const refreshTokens = async (refreshToken: string) => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = extractApiData<RefreshResponse>(response.data);
      
      // Store in localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      // Also store refresh token in cookies as a backup
      Cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken, COOKIE_OPTIONS);

      const decodedToken: any = jwtDecode(accessToken);
      const userType = decodedToken.role;
      setUserType(userType);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userType');
      Cookies.remove(REFRESH_TOKEN_COOKIE);
      setIsAuthenticated(false);
      setUserType(null);
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      // First clear any existing caches if this is a mobile device
      if (isMobileDevice()) {
        console.log('[Auth] Mobile device detected during login, clearing caches');
        // Clear application cache
        if ('caches' in window) {
          try {
            const cacheKeys = await caches.keys();
            await Promise.all(
              cacheKeys.map(cacheKey => caches.delete(cacheKey))
            );
            console.log('[Auth] Application caches cleared during login');
          } catch (err) {
            console.error('[Auth] Error clearing caches:', err);
          }
        }
      }

      // Proceed with login
      const response = await api.post('/auth/login', { username, password });
      const { accessToken, refreshToken } = extractApiData<LoginResponse>(response.data);

      // Store tokens in localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Also store refresh token in cookies as a backup
      Cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);

      const decodedToken: any = jwtDecode(accessToken);
      const userType = decodedToken.role;
      localStorage.setItem('userType', userType);

      setIsAuthenticated(true);
      setUserType(userType);

      // For distributors on mobile, force service worker update
      if (userType === 'Distributor' && isMobileDevice() && 'serviceWorker' in navigator) {
        console.log('[Auth] Distributor login on mobile, forcing service worker update');
        
        // Force update service worker
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.update();
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          }
          
          // Set a flag to reload after login redirect
          sessionStorage.setItem('forceReload', 'true');
        } catch (err) {
          console.error('[Auth] Error updating service worker during login:', err);
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userType');
    Cookies.remove(REFRESH_TOKEN_COOKIE);
    setIsAuthenticated(false);
    setUserType(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userType, loading, login, logout }}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return React.useContext(AuthContext);
};
