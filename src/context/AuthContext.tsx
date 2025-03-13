import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';
import {useLocation } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  userType: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
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
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (accessToken && refreshToken) {
      setIsAuthenticated(true);
      const decodedToken = jwtDecode(accessToken);
      const userType = decodedToken.role;
      setUserType(userType);
      setLoading(false);  // Finished loading when token is valid

  
    } else {
      if (refreshToken) {
        api.post('/auth/refresh', { refreshToken })
          .then((response) => {
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);

            const decodedToken = jwtDecode(accessToken);
            const userType = decodedToken.role;
            setUserType(userType);
            setIsAuthenticated(true);
            setLoading(false); // Finished loading when token is refreshed

         
          })
          .catch(() => {
            // Redirect to login if refresh fails
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setIsAuthenticated(false);
            setUserType(null);
            setLoading(false); // Set loading to false even when failure occurs

        
          });
      } else {
        setIsAuthenticated(false);
        setLoading(false);  // Finished loading if no tokens available

      }
    }
  }, [location.pathname]); // The useEffect will now depend on navigate and location to trigger redirects properly

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      const decodedToken = jwtDecode(accessToken);
      const userType = decodedToken.role;
      localStorage.setItem('userType', userType);

      setIsAuthenticated(true);
      setUserType(userType);

    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Invalid username or password');
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
