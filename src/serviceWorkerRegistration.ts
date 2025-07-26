// This optional code is used to register a service worker.
// register() is not called by default.

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

// Detect if the client is a mobile device
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Detect if the app is running in standalone mode
const isStandaloneMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
};

export function register(config?: Config): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if BASE_URL is on a different origin
      // from what our page is served on. This might happen if a CDN is used to
      // serve assets
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;

      if (isLocalhost) {
        // This is running on localhost. Let's check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);

        // Add some additional logging to localhost
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service ' +
              'worker. To learn more, visit https://cra.link/PWA'
          );
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }
    });

    // Add online/offline event listeners
    window.addEventListener('online', () => {
      if (config && config.onOnline) {
        config.onOnline();
      }
    });

    window.addEventListener('offline', () => {
      if (config && config.onOffline) {
        config.onOffline();
      }
    });

    // Set up listener for service worker messages
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE' && config?.onUpdate && navigator.serviceWorker.controller) {
          console.log(`[SW] New app version available: ${event.data.version}`);
          navigator.serviceWorker.ready.then(registration => {
            config.onUpdate(registration);
          });
        }
        
        if (event.data && event.data.type === 'CACHE_CLEARED') {
          console.log('[SW] Cache cleared, reloading page');
          window.location.reload();
        }
      });
    }

    // Check for updates periodically
    const updateInterval = isMobileDevice() || isStandaloneMode() 
      ? 5 * 60 * 1000  // 5 minutes for mobile or standalone
      : 30 * 60 * 1000; // 30 minutes for desktop
    
    setInterval(() => {
      // Check if navigator.onLine is true and not undefined
      const isOnline = typeof navigator.onLine === 'boolean' && navigator.onLine;
      if (isOnline) {
        console.log('[SW] Checking for app updates...');
        navigator.serviceWorker.ready
          .then(registration => registration.update())
          .catch(err => console.error('Error checking for updates:', err));
      }
    }, updateInterval);
  }
}

function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // Handle waiting worker if present
      if (registration.waiting) {
        console.log('[SW] New service worker waiting');
        handleWaitingServiceWorker(registration, config);
      }

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.log('[SW] New content is available');
              handleWaitingServiceWorker(registration, config);
            } else {
              // At this point, everything has been precached.
              console.log('[SW] Content is cached for offline use.');
              if (config?.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}

function handleWaitingServiceWorker(registration: ServiceWorkerRegistration, config?: Config) {
  // For standalone mode, activate immediately without user interaction
  if (isStandaloneMode()) {
    console.log('[SW] Standalone mode detected, activating update immediately');
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    return;
  }
  
  // For mobile devices, also activate immediately
  if (isMobileDevice()) {
    console.log('[SW] Mobile device detected, activating update immediately');
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    return;
  }

  // For regular desktop users, notify them about the update
  if (config?.onUpdate) {
    config.onUpdate(registration);
  }
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
    cache: 'no-store' // Bypass the browser cache
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
      if (config?.onOffline) {
        config.onOffline();
      }
    });
}

// Function to manually check for updates
export function checkForUpdates(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!('serviceWorker' in navigator)) {
      resolve(false);
      return;
    }

    navigator.serviceWorker.ready.then((registration) => {
      registration.update()
        .then(() => {
          if (registration.waiting) {
            // For standalone mode or mobile, apply immediately
            if (isStandaloneMode() || isMobileDevice()) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(() => {
          resolve(false);
        });
    });
  });
}

// Function to force clear cache and reload
export function forceClearCacheAndReload(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.active) {
        registration.active.postMessage({ type: 'FORCE_REFRESH_CACHE' });
        
        // Clear browser caches
        if ('caches' in window) {
          caches.keys().then((cacheNames) => {
            const deletePromises = cacheNames.map(cacheName => {
              return caches.delete(cacheName);
            });
            
            Promise.all(deletePromises).then(() => {
              // Reload after a short delay
              setTimeout(() => {
                window.location.reload();
              }, 500);
            });
          });
        } else {
          window.location.reload();
        }
      } else {
        window.location.reload();
      }
    });
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