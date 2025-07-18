import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './store/store';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { showSuccess, showError } from './store/slices/notificationSlice';

// Add type definition for the checkForUpdates function
declare global {
  interface Window {
    checkForUpdates: () => void;
  }
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

// Register service worker for offline capabilities and PWA support
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('Service Worker registered successfully');
  },
  onUpdate: (registration) => {
    console.log('New app version available');
    // Show update notification to the user
    store.dispatch(showSuccess({
      message: 'تم تحديث التطبيق! انقر هنا لتحميل النسخة الجديدة',
      duration: 10000,
      // Use custom action instead of onClick
      title: 'تحديث الآن'
    }));
    
    // Add event listener for update notification click
    const handleUpdateClick = () => {
      if (registration.waiting) {
        // Send skip-waiting message
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    };
    
    // Find and attach click handler to notification (this would need to be implemented in your notification component)
    setTimeout(() => {
      const updateNotification = document.querySelector('.notification-update');
      if (updateNotification) {
        updateNotification.addEventListener('click', handleUpdateClick);
      }
    }, 100);
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

// Add a refresh button to check for updates manually
// This can be called from anywhere in your app
window.checkForUpdates = () => {
  serviceWorkerRegistration.checkForUpdates().then(hasUpdate => {
    if (!hasUpdate) {
      store.dispatch(showSuccess({
        message: 'أنت تستخدم أحدث إصدار من التطبيق',
        duration: 3000
      }));
    }
  });
};

// Listen for controller change and reload the page
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  console.log('New service worker controller, reloading page');
  window.location.reload();
});
