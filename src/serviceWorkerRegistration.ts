// We're now using the React-specific hooks from virtual:pwa-register/react
// This file provides backward compatibility with the existing code structure
import { useRegisterSW } from 'virtual:pwa-register/react';
import type { RegisterSWOptions } from 'virtual:pwa-register/react';

// Detect if the client is a mobile device
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Detect if the app is running in standalone mode
const isStandaloneMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

// Set update interval based on device type
const getUpdateInterval = (): number => {
  return isMobileDevice() || isStandaloneMode() 
    ? 5 * 60 * 1000    // 5 minutes for mobile or standalone
    : 30 * 60 * 1000;  // 30 minutes for desktop
};

// Legacy type for backward compatibility
type Config = {
  onSuccess?: () => void;
  onUpdate?: () => void;
  onOffline?: () => void;
  onOnline?: () => void;
};

// Export the hook for React components
export { useRegisterSW };

// For backward compatibility
let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | null = null;

// Register service worker - legacy function for backward compatibility
export function register(config?: Config): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    // Set up listeners for online/offline events
    window.addEventListener('online', () => {
      if (config?.onOnline) {
        config.onOnline();
      }
    });

    window.addEventListener('offline', () => {
      if (config?.onOffline) {
        config.onOffline();
      }
    });

    // Initialize the update function for global access
    window.checkForUpdates = async () => {
      console.log('[SW] Manually checking for updates');
      if (updateSWFn) {
        await updateSWFn(false);
        return true;
      }
      return false;
    };

    // Initialize force refresh function for global access
    window.forceClearCache = () => {
      console.log('[SW] Forcing cache refresh and update');
      if (updateSWFn) {
        updateSWFn(true);
      } else {
        window.location.reload();
      }
    };

    // Initialize cache clearing function for mobile login
    window.clearCacheAfterLogin = async () => {
      console.log('[SW] Clearing cache after login');
      if ('caches' in window) {
        try {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map(key => caches.delete(key)));
          console.log('[SW] Caches cleared after login');
        } catch (err) {
          console.error('[SW] Error clearing caches:', err);
        }
      }
      return true;
    };
  }
}

// This function allows non-React parts of the app to capture the update function
export function setUpdateFunction(fn: (reloadPage?: boolean) => Promise<void>): void {
  updateSWFn = fn;
}

// Compatibility with legacy code
export function checkForUpdates(): Promise<boolean> {
  if (typeof window.checkForUpdates === 'function') {
    return window.checkForUpdates();
  }
  return Promise.resolve(false);
}

export function forceClearCacheAndReload(): void {
  if (typeof window.forceClearCache === 'function') {
    window.forceClearCache();
  } else {
    window.location.reload();
  }
}

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Add types for our global functions
declare global {
  interface Window {
    checkForUpdates: () => Promise<boolean>;
    forceClearCache: () => void;
    clearCacheAfterLogin: () => Promise<boolean>;
  }
} 