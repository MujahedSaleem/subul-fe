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
      // serve assets; see https://github.com/facebook/create-react-app/issues/2374
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;

      // Special handling for mobile devices
      if (isMobileDevice()) {
        console.log('[Main] Mobile device detected, using special registration');
        registerMobileSW(swUrl, config);
      } else if (isLocalhost) {
        // This is running on localhost. Let's check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);

        // Add some additional logging to localhost, pointing developers to the
        // service worker/PWA documentation.
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
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          console.log(`[Main] New app version available: ${event.data.version}`);
          if (config && config.onUpdate && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(registration => {
              config.onUpdate(registration);
            });
          }
        }
        
        if (event.data && event.data.type === 'CACHE_CLEARED') {
          console.log('[Main] Cache cleared, reloading page');
          window.location.reload();
        }
      });
    }

    // Check for updates more frequently on mobile devices
    const updateInterval = isMobileDevice() ? 5 * 60 * 1000 : 30 * 60 * 1000; // 5 minutes for mobile, 30 minutes for desktop
    
    setInterval(() => {
      if (typeof navigator.onLine !== 'undefined' && navigator.onLine) {
        console.log('[Main] Checking for app updates...');
        navigator.serviceWorker.ready.then(registration => {
          registration.update().catch(err => {
            console.error('Error checking for updates:', err);
          });
        });
      }
    }, updateInterval);
  }
}

// Special registration for mobile devices
function registerMobileSW(swUrl: string, config?: Config) {
  // First, try to unregister any existing service workers
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      console.log('[Main] Unregistering existing service worker');
      registration.unregister();
    }
    
    // Now register a new service worker
    navigator.serviceWorker
      .register(swUrl, { updateViaCache: 'none' }) // Disable cache for updates
      .then(registration => {
        console.log('[Main] Mobile service worker registered');
        
        // Force update check immediately
        registration.update();
        
        // If there's a waiting worker, activate it immediately
        if (registration.waiting) {
          console.log('[Main] Found waiting worker, activating immediately');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          if (config && config.onUpdate) {
            config.onUpdate(registration);
          }
        }
        
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }
          
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[Main] New content available on mobile');
                
                // Force cache refresh for mobile
                registration.active?.postMessage({ type: 'FORCE_REFRESH_CACHE' });
                
                // For standalone mode, activate immediately without user interaction
                if (isMobileDevice() && window.matchMedia('(display-mode: standalone)').matches) {
                  console.log('[Main] Standalone mode detected, activating update immediately');
                  installingWorker.postMessage({ type: 'SKIP_WAITING' });
                } else if (config && config.onUpdate) {
                  config.onUpdate(registration);
                  promptUserToRefresh(registration);
                }
              } else {
                console.log('[Main] Content cached for offline use on mobile');
                if (config && config.onSuccess) {
                  config.onSuccess(registration);
                }
              }
            }
          };
        };
      })
      .catch(error => {
        console.error('[Main] Error during mobile service worker registration:', error);
      });
  });
}

function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // Immediately check if there's a waiting worker
      if (registration.waiting) {
        console.log('[Main] New service worker waiting');
        
        // For standalone mode, activate immediately without user interaction
        if (window.matchMedia('(display-mode: standalone)').matches) {
          console.log('[Main] Standalone mode detected, activating update immediately');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else if (config && config.onUpdate) {
          config.onUpdate(registration);
          promptUserToRefresh(registration);
        }
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
              console.log(
                '[Main] New content is available and will be used when all ' +
                  'tabs for this page are closed.'
              );

              // For standalone mode, activate immediately without user interaction
              if (window.matchMedia('(display-mode: standalone)').matches) {
                console.log('[Main] Standalone mode detected, activating update immediately');
                installingWorker.postMessage({ type: 'SKIP_WAITING' });
              } else if (config && config.onUpdate) {
                // Execute callback
                config.onUpdate(registration);
                promptUserToRefresh(registration);
              }
            } else {
              // At this point, everything has been precached.
              // It's the perfect time to display a
              // "Content is cached for offline use." message.
              console.log('[Main] Content is cached for offline use.');

              // Execute callback
              if (config && config.onSuccess) {
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

function promptUserToRefresh(registration: ServiceWorkerRegistration) {
  // For standalone mode, skip the prompt and apply updates immediately
  if (window.matchMedia('(display-mode: standalone)').matches) {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    return;
  }
  
  // For regular mode, prompt the user
  if (confirm('تم تحديث التطبيق! هل ترغب في تحميل النسخة الجديدة؟')) {
    if (registration.waiting) {
      // Send skip waiting message
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    
    // Listen for the controller change and reload
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[Main] New service worker activated, reloading page');
      window.location.reload();
    });
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
      if (config && config.onOffline) {
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

    // Special handling for mobile devices
    if (isMobileDevice()) {
      console.log('[Main] Forcing update check on mobile');
      
      navigator.serviceWorker.ready.then((registration) => {
        // Force cache refresh for mobile
        if (registration.active) {
          registration.active.postMessage({ type: 'FORCE_REFRESH_CACHE' });
        }
        
        // Also perform a regular update check
        registration.update()
          .then(() => {
            if (registration.waiting) {
              promptUserToRefresh(registration);
              resolve(true);
            } else {
              resolve(false);
            }
          })
          .catch(() => {
            resolve(false);
          });
      });
    } else {
      // Normal update check for desktop
      navigator.serviceWorker.ready.then((registration) => {
        registration.update()
          .then(() => {
            if (registration.waiting) {
              promptUserToRefresh(registration);
              resolve(true);
            } else {
              resolve(false);
            }
          })
          .catch(() => {
            resolve(false);
          });
      });
    }
  });
}

// Function to force clear cache and reload (especially for mobile)
export function forceClearCacheAndReload(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.active) {
        registration.active.postMessage({ type: 'FORCE_REFRESH_CACHE' });
        
        // Also unregister and re-register the service worker
        registration.unregister().then(() => {
          // Clear browser caches
          if ('caches' in window) {
            caches.keys().then((cacheNames) => {
              cacheNames.forEach((cacheName) => {
                caches.delete(cacheName);
              });
              
              // Reload after a short delay
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            });
          } else {
            window.location.reload();
          }
        });
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