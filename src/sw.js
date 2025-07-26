// Custom Service Worker with special handling for authenticated routes
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Use with injectManifest
self.__WB_MANIFEST;

// Clean up old caches
cleanupOutdatedCaches();

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST || []);

// Special handling for navigation requests - NetworkFirst for everything except login and root
const NAVIGATION_HANDLER = createHandlerBoundToURL('/index.html');
const ADMIN_ROUTE_REGEX = /^\/admin\/?.*$/;
const DISTRIBUTOR_ROUTE_REGEX = /^\/distributor\/?.*$/;
const LOGIN_ROUTE_REGEX = /^\/login\/?$/;
const ROOT_ROUTE_REGEX = /^\/$/;

// Add listeners for messages from clients
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Default navigation handler that checks for authenticated routes
const navigationHandler = ({ request, url }) => {
  // For login page - use cache if available, otherwise network
  if (LOGIN_ROUTE_REGEX.test(url.pathname) || ROOT_ROUTE_REGEX.test(url.pathname)) {
    console.log('[SW] Navigation to login or root');
    return NAVIGATION_HANDLER(request);
  }

  // For admin or distributor routes - always go to network first
  if (ADMIN_ROUTE_REGEX.test(url.pathname) || DISTRIBUTOR_ROUTE_REGEX.test(url.pathname)) {
    console.log('[SW] Navigation to authenticated route');
    return fetch(request).catch(() => NAVIGATION_HANDLER(request));
  }
  
  // For all other routes
  return NAVIGATION_HANDLER(request);
};

// Register navigation route
registerRoute(new NavigationRoute(navigationHandler));

// Register special never-cache strategy for API requests
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
  })
);

// Activate event - claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
}); 