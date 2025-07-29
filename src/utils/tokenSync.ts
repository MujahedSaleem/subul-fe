/**
 * Token synchronization across browser tabs/windows
 * This helps prevent users from being logged out when tokens are refreshed in another tab
 */

export type TokenSyncCallback = () => void;

let syncCallbacks: TokenSyncCallback[] = [];

/**
 * Adds a callback to be called when tokens are updated in another tab
 */
export const addTokenSyncListener = (callback: TokenSyncCallback) => {
  syncCallbacks.push(callback);
};

/**
 * Removes a token sync listener
 */
export const removeTokenSyncListener = (callback: TokenSyncCallback) => {
  syncCallbacks = syncCallbacks.filter(cb => cb !== callback);
};

/**
 * Handles storage events to synchronize tokens across tabs
 */
const handleStorageChange = (event: StorageEvent) => {
  // Only handle changes to token-related keys
  if (event.key === 'accessToken' || event.key === 'refreshToken' || event.key === 'userType') {
    console.log('[TokenSync] Token change detected in another tab:', event.key);
    
    // Notify all listeners
    syncCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[TokenSync] Error in sync callback:', error);
      }
    });
  }
};

/**
 * Initialize token synchronization
 */
export const initTokenSync = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange);
    console.log('[TokenSync] Token synchronization initialized');
  }
};

/**
 * Cleanup token synchronization
 */
export const cleanupTokenSync = () => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('storage', handleStorageChange);
    syncCallbacks = [];
    console.log('[TokenSync] Token synchronization cleaned up');
  }
};

/**
 * Manually trigger a token sync event
 */
export const triggerTokenSync = () => {
  syncCallbacks.forEach(callback => {
    try {
      callback();
    } catch (error) {
      console.error('[TokenSync] Error in manual sync callback:', error);
    }
  });
}; 