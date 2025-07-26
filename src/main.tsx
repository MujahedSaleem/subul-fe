import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './store/store';
import './index.css';
import { showSuccess, showError } from './store/slices/notificationSlice';

// Define type for PWA-related global functions
declare global {
  interface Window {
    checkForUpdates: () => Promise<boolean>;
    forceClearCache: () => void;
    clearCacheAfterLogin: () => Promise<boolean>;
    isStandaloneMode: () => boolean;
  }
}

// Helper to determine if the app is in standalone mode
const isStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

// Expose functions globally
window.isStandaloneMode = isStandaloneMode;

// Handle common service worker events
if ('serviceWorker' in navigator) {
  // Listen for controller change and reload the page
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[Main] New service worker controller, reloading page');
    window.location.reload();
  });
  
  // Detect login-related page loads
  if (window.location.pathname === '/login') {
    console.log('[Main] Login page detected, ensuring clean state');
    localStorage.clear();
    sessionStorage.clear();

    // Unregister any service workers on the login page to ensure clean state
    navigator.serviceWorker.getRegistrations().then(registrations => {
      if (registrations.length > 0) {
        for (const registration of registrations) {
          registration.unregister();
        }
        console.log('[Main] Service workers unregistered on login page');
      }
    }).catch(err => {
      console.error('[Main] Error checking service worker on login:', err);
    });
  }
}

// Listen for online/offline events and show notifications
window.addEventListener('online', () => {
  store.dispatch(showSuccess({
    message: 'تم استعادة الاتصال بالإنترنت',
    duration: 3000
  }));
});

window.addEventListener('offline', () => {
  store.dispatch(showError({
    message: 'أنت غير متصل بالإنترنت. بعض الميزات قد لا تعمل.',
    duration: 5000
  }));
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
