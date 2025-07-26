import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './store/store';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { showSuccess, showError } from './store/slices/notificationSlice';

// Define type for PWA-related global functions
declare global {
  interface Window {
    checkForUpdates: () => Promise<boolean>;
    forceClearCache: () => void;
    isStandaloneMode: () => boolean;
  }
}

// Helper to determine if the app is in standalone mode
const isStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

// Expose functions for PWA management
window.isStandaloneMode = isStandaloneMode;
window.checkForUpdates = serviceWorkerRegistration.checkForUpdates;
window.forceClearCache = serviceWorkerRegistration.forceClearCacheAndReload;

// Notify service worker about standalone mode
const notifyServiceWorkerAboutStandaloneMode = () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    console.log('[Main] Notifying service worker about standalone mode:', isStandaloneMode());
    navigator.serviceWorker.controller.postMessage({
      type: 'SET_STANDALONE_MODE',
      isStandalone: isStandaloneMode()
    });
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);

// Register service worker for PWA functionality
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('[Main] Service Worker registered successfully');
    notifyServiceWorkerAboutStandaloneMode();
  },
  onUpdate: (registration) => {
    console.log('[Main] New app version available');
    
    // Show update notification to the user
    store.dispatch(showSuccess({
      message: 'تم تحديث التطبيق! انقر هنا لتحميل النسخة الجديدة',
      duration: 10000,
      title: 'تحديث الآن'
    }));

    // Set up handler for update activation
    const waitingWorker = registration.waiting;
    if (waitingWorker) {
      // Send skip waiting message to activate the new service worker
      setTimeout(() => {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      }, 3000);
    }

    notifyServiceWorkerAboutStandaloneMode();
  },
  onOffline: () => {
    store.dispatch(showError({
      message: 'أنت غير متصل بالإنترنت. بعض الميزات قد لا تعمل.',
      duration: 5000
    }));
  },
  onOnline: () => {
    store.dispatch(showSuccess({
      message: 'تم استعادة الاتصال بالإنترنت',
      duration: 3000
    }));
    
    // Check for updates when coming back online
    serviceWorkerRegistration.checkForUpdates();
  }
});

// Listen for standalone mode changes
window.matchMedia('(display-mode: standalone)').addEventListener('change', () => {
  console.log('[Main] Standalone mode changed:', isStandaloneMode());
  notifyServiceWorkerAboutStandaloneMode();
});

// Listen for controller change and reload the page
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  console.log('[Main] New service worker controller, reloading page');
  window.location.reload();
});
