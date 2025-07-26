// We're now using the React-specific hooks from virtual:pwa-register/react
// This file provides backward compatibility with the existing code structure
import { useRegisterSW } from 'virtual:pwa-register/react';
import type { RegisterSWOptions } from 'virtual:pwa-register/react';

// Check if the device is a mobile device
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Check if the app is in standalone mode (installed PWA)
const isStandaloneMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

type Config = {
  onSuccess?: () => void;
  onUpdate?: () => void;
  onOffline?: () => void;
  onOnline?: () => void;
};

export { useRegisterSW };

// Global variable to store the update function from useRegisterSW
let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | null = null;

// Helper to force reload the page and bypass cache
const forceReload = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      for (const registration of registrations) {
        await registration.unregister();
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
      window.location.reload();
    });
  } else {
    window.location.reload();
  }
};

export function register(config?: Config): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    // Handle online/offline events
    window.addEventListener('online', () => {
      console.log('Online event detected');
      config?.onOnline && config.onOnline();
    });

    window.addEventListener('offline', () => {
      console.log('Offline event detected');
      config?.onOffline && config.onOffline();
    });

    // Define global functions for PWA updates and cache management
    window.checkForUpdates = async () => {
      console.log('Manual update check triggered');
      if (updateSWFn) {
        try {
          await updateSWFn(false);
          return true;
        } catch (err) {
          console.error('Error checking for updates:', err);
          return false;
        }
      }
      return false;
    };

    window.forceClearCache = () => {
      console.log('Force clear cache triggered');
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => {
              console.log(`Deleting cache ${cacheName}`);
              return caches.delete(cacheName);
            })
          );
        }).then(() => {
          console.log('Caches cleared, reloading...');
          forceReload();
        });
      } else {
        forceReload();
      }
    };

    window.clearCacheAfterLogin = async () => {
      console.log('Clear cache after login triggered');
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map(key => caches.delete(key)));
          console.log('All caches cleared after login');
          return true;
        } catch (err) {
          console.error('Error clearing caches after login:', err);
          return false;
        }
      }
      return false;
    };
  }
}

export function setUpdateFunction(fn: (reloadPage?: boolean) => Promise<void>): void {
  updateSWFn = fn;
}

/**
 * Check for service worker updates
 */
export function checkForUpdates(): Promise<boolean> {
  return new Promise((resolve) => {
    if (updateSWFn) {
      updateSWFn(false)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    } else {
      resolve(false);
    }
  });
}

/**
 * Force clear all caches and reload the page
 */
export function forceClearCacheAndReload(): void {
  window.forceClearCache();
}

/**
 * Unregister all service workers
 */
export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
}

// Global type definitions
declare global {
  interface Window {
    checkForUpdates: () => Promise<boolean>;
    forceClearCache: () => void;
    clearCacheAfterLogin: () => Promise<boolean>;
  }
} 