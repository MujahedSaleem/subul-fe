export function register(config?: any) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      navigator.serviceWorker.register(swUrl).then(registration => {
        if (registration.waiting) {
          // Immediately update the page
          config?.onUpdate?.(registration);
        }

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (
                installingWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New update available
                config?.onUpdate?.(registration);
              }
            };
          }
        };

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });

        config?.onSuccess?.(registration);
      }).catch(error => {
        console.error('Error during service worker registration:', error);
      });
    });
  }
}
