import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';
import { useLocation, useNavigate } from 'react-router-dom';
import { extractApiData, handleApiError } from '../utils/apiResponseHandler';
import { checkTokenValidity, shouldRefreshToken, getStoredTokens, storeTokens, clearTokens } from '../utils/tokenUtils';
import { initTokenSync, cleanupTokenSync, addTokenSyncListener, removeTokenSyncListener } from '../utils/tokenSync';
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
  const location = useLocation();
  const navigate = useNavigate();

    useEffect(() => {
    // Listen for logout events from axiosInstance
    const handleLogout = () => {
      setIsAuthenticated(false);
      setUserType(null);
      setLoading(false);
    };

    // Handle token sync from other tabs
    const handleTokenSync = () => {
      console.log('[Auth] Token change detected from another tab, refreshing auth state');
      const { accessToken, refreshToken } = getStoredTokens();
      
      if (accessToken && refreshToken) {
        const tokenInfo = checkTokenValidity(accessToken);
        if (tokenInfo.isValid && !tokenInfo.isExpired) {
          setIsAuthenticated(true);
          setUserType(tokenInfo.userType!);
        }
      } else {
        // Tokens were cleared in another tab
        setIsAuthenticated(false);
        setUserType(null);
      }
    };

    // Initialize token synchronization
    initTokenSync();
    addTokenSyncListener(handleTokenSync);
    window.addEventListener('auth:logout', handleLogout);
    
    // Set up periodic token check (every 5 minutes)
    const tokenCheckInterval = setInterval(() => {
      const { accessToken, refreshToken } = getStoredTokens();
      
      if (accessToken && refreshToken && isAuthenticated) {
        if (shouldRefreshToken(accessToken, 5)) {
          console.log('[Auth] Proactively refreshing token that expires soon');
          refreshTokens(refreshToken);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      removeTokenSyncListener(handleTokenSync);
      cleanupTokenSync();
      clearInterval(tokenCheckInterval);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    // Handle post-login forced reload
    const needsReload = sessionStorage.getItem('forceReloadAfterAuth');
    if (needsReload === 'true' && isAuthenticated) {
      console.log('[Auth] Executing forced reload after auth');
      sessionStorage.removeItem('forceReloadAfterAuth');
      
      // Use a small timeout to ensure the router has had a chance to update
      setTimeout(() => {
        window.location.reload();
      }, 100);
      return;
    }

    const { accessToken, refreshToken } = getStoredTokens();

    if (accessToken && refreshToken) {
      const tokenInfo = checkTokenValidity(accessToken);
      
      if (!tokenInfo.isValid) {
        console.log('[Auth] Invalid access token format, attempting refresh');
        refreshTokens(refreshToken);
      } else if (tokenInfo.isExpired) {
        console.log('[Auth] Access token expired, attempting refresh');
        refreshTokens(refreshToken);
      } else if (shouldRefreshToken(accessToken, 5)) {
        console.log('[Auth] Access token expires soon, will refresh on next API call');
        setIsAuthenticated(true);
        setUserType(tokenInfo.userType!);
        setLoading(false);
      } else {
        console.log('[Auth] Access token is valid');
        setIsAuthenticated(true);
        setUserType(tokenInfo.userType!);
        setLoading(false);
      }
    } else if (refreshToken) {
      // Only refresh token exists, try to refresh
      console.log('[Auth] Only refresh token found, attempting to get new access token');
      refreshTokens(refreshToken);
    } else {
      // No tokens
      console.log('[Auth] No tokens found');
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  const refreshTokens = async (refreshToken: string) => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = extractApiData<RefreshResponse>(response.data);
      
      // Store tokens using utility function
      storeTokens(accessToken, newRefreshToken);

      const decodedToken: any = jwtDecode(accessToken);
      const userType = decodedToken.role;
      setUserType(userType);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear all tokens
      clearTokens();
      setIsAuthenticated(false);
      setUserType(null);
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      // Proceed with login
      const response = await api.post('/auth/login', { username, password });
      const { accessToken, refreshToken } = extractApiData<LoginResponse>(response.data);

      // Store tokens in localStorage
      // Store tokens using utility function
      storeTokens(accessToken, refreshToken);

      const decodedToken: any = jwtDecode(accessToken);
      const userType = decodedToken.role;
      localStorage.setItem('userType', userType);

      // Update authentication state
      setIsAuthenticated(true);
      setUserType(userType);
      
      // Navigate to the appropriate dashboard
      const targetPath = userType === "Admin" ? '/admin' : '/distributor/orders';
      window.location.href = targetPath;

    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = handleApiError(error);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    // Clear all auth tokens and state
    clearTokens();
    setIsAuthenticated(false);
    setUserType(null);
    
    // Redirect to login page
    window.location.href = '/login';
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
