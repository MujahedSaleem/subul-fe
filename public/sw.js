// This is a simple service worker that caches the app shell
const CACHE_NAME = 'subul-cache-v4'; // Increment version again to force update
const APP_VERSION = '2.0.2'; // Track app version for update detection
const TIMESTAMP = new Date().toISOString(); // Add timestamp to force cache refresh
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

// Detect if the client is a mobile device
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Detect if the app is running in standalone mode (installed PWA)
const isStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
};

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing new version:', APP_VERSION, 'at', TIMESTAMP);
  
  // Force update for mobile devices and standalone mode
  if (isMobileDevice() || self.isStandalonePWA) {
    console.log('[Service Worker] Mobile or standalone mode detected, forcing cache refresh');
    // Skip waiting immediately for mobile devices or standalone mode
    self.skipWaiting();
  }
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache, fall back to network, then to offline page
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests separately
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'You are offline' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // For HTML requests or standalone mode, always go to network first
  if (event.request.mode === 'navigate' || 
      (event.request.method === 'GET' && 
       event.request.headers.get('accept')?.includes('text/html')) ||
      self.isStandalonePWA) {
    
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseToCache = response.clone();
          
          // Update the cache with the new response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // For JavaScript and CSS files, use network-first approach on mobile or standalone
  if ((isMobileDevice() || self.isStandalonePWA) && 
      (event.request.url.endsWith('.js') || 
       event.request.url.endsWith('.css'))) {
    
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseToCache = response.clone();
          
          // Update the cache with the new response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          // For mobile devices or standalone mode, check if the cached response is older than 15 minutes
          if (isMobileDevice() || self.isStandalonePWA) {
            const cachedTime = response.headers.get('sw-cache-timestamp');
            if (cachedTime) {
              const cacheAge = Date.now() - new Date(cachedTime).getTime();
              // If cache is older than 15 minutes (900000 ms), fetch from network
              if (cacheAge > 900000) {
                return fetchAndCache(event.request);
              }
            }
          }
          return response;
        }
        
        // No cache hit, fetch from network
        return fetchAndCache(event.request);
      })
  );
});

// Helper function to fetch and cache
function fetchAndCache(request) {
  return fetch(request).then(
    (response) => {
      // Check if we received a valid response
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }

      // Clone the response
      const responseToCache = response.clone();

      // Add timestamp header to the cached response
      const headers = new Headers(responseToCache.headers);
      headers.append('sw-cache-timestamp', new Date().toISOString());
      
      // Create a new response with the timestamp header
      const timestampedResponse = new Response(
        responseToCache.body, 
        {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        }
      );

      // Add to cache
      caches.open(CACHE_NAME)
        .then((cache) => {
          cache.put(request, timestampedResponse);
        });

      return response;
    }
  ).catch(() => {
    // If both cache and network fail, show offline page for navigate requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
  });
}

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating new version:', APP_VERSION);
  const cacheWhitelist = [CACHE_NAME];
  
  // For mobile devices or standalone mode, claim clients immediately and clean caches
  if (isMobileDevice() || self.isStandalonePWA) {
    console.log('[Service Worker] Mobile or standalone mode detected, claiming clients immediately');
  }
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
}); 

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting and activate now');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_VERSION') {
    // Send back the current version to the client
    const client = event.source;
    if (client) {
      client.postMessage({
        type: 'VERSION_INFO',
        version: APP_VERSION,
        timestamp: TIMESTAMP,
        isMobile: isMobileDevice()
      });
    }
  }
  
  // Set standalone PWA flag
  if (event.data && event.data.type === 'SET_STANDALONE_MODE') {
    console.log('[Service Worker] Setting standalone mode flag:', event.data.isStandalone);
    self.isStandalonePWA = event.data.isStandalone;
    
    // If it's standalone mode, force a cache refresh
    if (event.data.isStandalone) {
      console.log('[Service Worker] Standalone mode detected, forcing cache refresh');
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== CACHE_NAME) {
                console.log('[Service Worker] Deleting old cache for standalone mode:', cacheName);
                return caches.delete(cacheName);
              }
            })
          );
        })
      );
    }
  }
  
  // Force refresh cache for mobile or standalone mode
  if (event.data && event.data.type === 'FORCE_REFRESH_CACHE' && 
     (isMobileDevice() || self.isStandalonePWA)) {
    console.log('[Service Worker] Force refreshing cache for mobile/standalone');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[Service Worker] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        // Notify the client that cache has been cleared
        const client = event.source;
        if (client) {
          client.postMessage({
            type: 'CACHE_CLEARED',
            timestamp: new Date().toISOString()
          });
        }
      })
    );
  }
});

// Force clients to update when a new version is available
self.addEventListener('updatefound', () => {
  console.log('[Service Worker] Update found, notifying clients');
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        version: APP_VERSION,
        timestamp: TIMESTAMP
      });
    });
  });
});
