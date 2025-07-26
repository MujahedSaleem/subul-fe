// Simple and efficient service worker for the Subul PWA
const CACHE_NAME = 'subul-cache-v6'; // Increment cache version
const APP_VERSION = '2.1.1';
const TIMESTAMP = new Date().toISOString();
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

// Routes that should be available immediately after login
const CRITICAL_ROUTES = [
  '/admin',
  '/distributor',
  '/distributor/orders',
];

// Detect if the client is a mobile device
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Detect if the app is running in standalone mode
const isStandaloneMode = () => {
  return self.isStandalonePWA === true;
};

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new version:', APP_VERSION, 'at', TIMESTAMP);
  
  // Skip waiting for mobile or standalone mode
  if (isMobileDevice() || isStandaloneMode()) {
    console.log('[SW] Mobile or standalone mode detected, activating immediately');
    self.skipWaiting();
  }
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Activate event - clean up old caches and take control of clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new version:', APP_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Helper function to determine cache strategy based on request type
const getCacheStrategy = (request) => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // For API requests, use network-only
  if (pathname.includes('/api/')) {
    return 'network-only';
  }
  
  // For login-related paths, always use network-first
  if (pathname === '/login' || pathname.includes('/auth/')) {
    return 'network-first';
  }
  
  // Special handling for critical routes (post-login)
  for (const route of CRITICAL_ROUTES) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return 'network-first';
    }
  }
  
  // For HTML requests or navigation, use network-first
  if (request.mode === 'navigate' || 
      (request.method === 'GET' && 
       request.headers.get('accept')?.includes('text/html'))) {
    return 'network-first';
  }
  
  // For JS/CSS in mobile or standalone mode, use network-first
  if ((isMobileDevice() || isStandaloneMode()) && 
      (pathname.endsWith('.js') || pathname.endsWith('.css'))) {
    return 'network-first';
  }
  
  // For everything else, use cache-first
  return 'cache-first';
};

// Fetch event - handle all fetch strategies
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const strategy = getCacheStrategy(event.request);
  
  // Special handling for mobile navigation post-login
  const isMobileNavigate = isMobileDevice() && 
                         event.request.mode === 'navigate' && 
                         event.request.method === 'GET';
  
  if (strategy === 'network-only' || isMobileNavigate) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => {
          // For API requests, return a JSON error
          if (event.request.url.includes('/api/')) {
            return new Response(
              JSON.stringify({ error: 'You are offline' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
          
          // For navigation, try cache or show offline page
          if (event.request.mode === 'navigate') {
            return caches.match(event.request)
              .then(cachedResponse => cachedResponse || caches.match('/offline.html'));
          }
          
          return null;
        })
    );
    return;
  }
  
  if (strategy === 'network-first') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }) // Bypass browser cache for critical routes
        .then((response) => {
          // Don't cache error responses
          if (!response.ok) {
            return response;
          }
          
          // Clone and cache the response
          const responseToCache = response.clone();
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
              // If no cache match for navigation, return offline page
              if (event.request.mode === 'navigate') {
                return caches.match('/offline.html');
              }
              return null;
            });
        })
    );
    return;
  }
  
  // Default: cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // No cache hit, fetch from network and cache
        return fetch(event.request).then(
          (networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(() => {
          // If both cache and network fail for navigation, show offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting and activate now');
    self.skipWaiting();
  }
  
  if (event.data?.type === 'SET_STANDALONE_MODE') {
    console.log('[SW] Setting standalone mode flag:', event.data.isStandalone);
    self.isStandalonePWA = !!event.data.isStandalone;
  }
  
  if (event.data?.type === 'FORCE_REFRESH_CACHE') {
    console.log('[SW] Force refreshing cache');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        ).then(() => {
          // Notify the client that cache has been cleared
          if (event.source) {
            event.source.postMessage({
              type: 'CACHE_CLEARED',
              timestamp: new Date().toISOString()
            });
          }
        });
      })
    );
  }
  
  // Handle post-login cache clear for mobile
  if (event.data?.type === 'POST_LOGIN_CACHE_CLEAR') {
    console.log('[SW] Clearing cache after successful login');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW] Deleting post-login cache:', cacheName);
            return caches.delete(cacheName);
          })
        ).then(() => {
          // Pre-cache critical routes to ensure they're available after login
          return caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Pre-caching critical routes');
            const criticalUrls = CRITICAL_ROUTES.map(route => self.location.origin + route);
            return cache.addAll(criticalUrls);
          });
        }).then(() => {
          if (event.source) {
            event.source.postMessage({
              type: 'POST_LOGIN_CACHE_READY',
              timestamp: new Date().toISOString()
            });
          }
        });
      })
    );
  }
});

// Notify clients about updates
self.addEventListener('updatefound', () => {
  console.log('[SW] Update found, notifying clients');
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

// Listen for the periodic beacon from clients
self.addEventListener('sync', (event) => {
  if (event.tag === 'keepalive') {
    console.log('[SW] Received keepalive sync event');
    // You could use this to ensure the service worker stays active
  }
});
