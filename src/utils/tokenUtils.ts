import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

export interface TokenInfo {
  isValid: boolean;
  isExpired: boolean;
  expiresIn: number; // seconds until expiration (negative if expired)
  userType?: string;
}

/**
 * Checks if a JWT token is valid and provides expiration info
 */
export const checkTokenValidity = (token: string): TokenInfo => {
  try {
    const decodedToken: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    const expiresIn = decodedToken.exp - currentTime;
    
    return {
      isValid: true,
      isExpired: decodedToken.exp < currentTime,
      expiresIn: expiresIn,
      userType: decodedToken.role
    };
  } catch (error) {
    return {
      isValid: false,
      isExpired: true,
      expiresIn: -1
    };
  }
};

/**
 * Checks if a token should be refreshed (expires within threshold)
 */
export const shouldRefreshToken = (token: string, thresholdMinutes: number = 5): boolean => {
  const tokenInfo = checkTokenValidity(token);
  
  if (!tokenInfo.isValid) return false;
  if (tokenInfo.isExpired) return true;
  
  // Refresh if expires within threshold
  return tokenInfo.expiresIn < (thresholdMinutes * 60);
};

/**
 * Gets tokens from localStorage and cookies with fallback
 */
export const getStoredTokens = () => {
  const accessToken = localStorage.getItem('accessToken');
  let refreshToken = localStorage.getItem('refreshToken');
  
  // Fallback to cookies for refresh token if not in localStorage
  if (!refreshToken) {
    try {
      refreshToken = Cookies.get('subul_refresh_token') || null;
      
      if (refreshToken) {
        
        // Sync to localStorage for future access
        localStorage.setItem('refreshToken', refreshToken);
      }
    } catch (error) {
      console.error('[TokenUtils] Error reading refresh token from cookies:', error);
    }
  }
  
  return { accessToken, refreshToken };
};

/**
 * Stores tokens in both localStorage and cookies for persistence
 */
export const storeTokens = (accessToken: string, refreshToken: string) => {
  try {
    // Store in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Store user type for quick access
    const tokenInfo = checkTokenValidity(accessToken);
    if (tokenInfo.isValid && tokenInfo.userType) {
      localStorage.setItem('userType', tokenInfo.userType);
    }
    
    // Store refresh token in cookies as backup
    Cookies.set('subul_refresh_token', refreshToken, {
      expires: 30, // 30 days
      secure: window.location.protocol === 'https:',
      sameSite: 'strict'
    });
    
    
  } catch (error) {
    console.error('[TokenUtils] Error storing tokens:', error);
  }
};

/**
 * Clears all tokens from localStorage and cookies
 */
export const clearTokens = () => {
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userType');
    Cookies.remove('subul_refresh_token');
    
  } catch (error) {
    console.error('[TokenUtils] Error clearing tokens:', error);
  }
}; 