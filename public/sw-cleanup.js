// Service Worker Cleanup Script
// This unregisters any existing service workers from the old PWA setup

(function() {
  'use strict';

  if ('serviceWorker' in navigator) {
    
    
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      if (registrations.length === 0) {
        
        return;
      }

      
      
      // Unregister all service workers
      const promises = registrations.map(function(registration) {
        
        return registration.unregister();
      });
      
      Promise.all(promises).then(function() {
        
        
        // Clear all caches
        if ('caches' in window) {
          return caches.keys().then(function(cacheNames) {
            
            return Promise.all(
              cacheNames.map(function(cacheName) {
                return caches.delete(cacheName);
              })
            );
          });
        }
      }).then(function() {
        
      }).catch(function(error) {
        console.error('[SW-Cleanup] Error during cleanup:', error);
      });
    });
  }
})(); 