// Service Worker Cleanup Script
// This unregisters any existing service workers from the old PWA setup

(function() {
  'use strict';

  if ('serviceWorker' in navigator) {
    console.log('[SW-Cleanup] Starting service worker cleanup...');
    
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      if (registrations.length === 0) {
        console.log('[SW-Cleanup] No service workers found');
        return;
      }

      console.log('[SW-Cleanup] Found', registrations.length, 'service worker(s) to unregister');
      
      // Unregister all service workers
      const promises = registrations.map(function(registration) {
        console.log('[SW-Cleanup] Unregistering:', registration.scope);
        return registration.unregister();
      });
      
      Promise.all(promises).then(function() {
        console.log('[SW-Cleanup] All service workers unregistered');
        
        // Clear all caches
        if ('caches' in window) {
          return caches.keys().then(function(cacheNames) {
            console.log('[SW-Cleanup] Clearing', cacheNames.length, 'cache(s)');
            return Promise.all(
              cacheNames.map(function(cacheName) {
                return caches.delete(cacheName);
              })
            );
          });
        }
      }).then(function() {
        console.log('[SW-Cleanup] Cleanup complete');
      }).catch(function(error) {
        console.error('[SW-Cleanup] Error during cleanup:', error);
      });
    });
  }
})(); 