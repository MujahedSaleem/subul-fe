import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';
import { useLocation } from 'react-router-dom';
import { extractApiData, handleApiError } from '../utils/apiResponseHandler';

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
    const refreshToken = localStorage.getItem('refreshToken');

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
        console.error('Error decoding token:', error);
        // Invalid token format
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userType');
        setIsAuthenticated(false);
        setUserType(null);
        setLoading(false);
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
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

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
      setIsAuthenticated(false);
      setUserType(null);
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { accessToken, refreshToken } = extractApiData<LoginResponse>(response.data);

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      const decodedToken: any = jwtDecode(accessToken);
      const userType = decodedToken.role;
      localStorage.setItem('userType', userType);

      setIsAuthenticated(true);
      setUserType(userType);
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
