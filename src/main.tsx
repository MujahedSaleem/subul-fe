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

// Listen for controller change and reload the page
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[Main] New service worker controller, reloading page');
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
