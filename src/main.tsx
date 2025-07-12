import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from '@material-tailwind/react';
import { AuthProvider } from './context/AuthContext.tsx';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { getSavedRoute } from './utils/routeStateManager';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter> {/* Only one Router here */}
        <AuthProvider>
          <ThemeProvider>
            <App /> {/* App is wrapped by BrowserRouter here */}
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('Service worker registration successful', registration);
  },
  onUpdate: (registration) => {
    console.log('New content is available, please refresh', registration);
    // You could show a notification here that a new version is available
  },
  onOffline: () => {
    console.log('App is now offline');
    // The app is offline, we could show a notification here
  },
  onOnline: () => {
    console.log('App is back online');
    // The app is back online, we could restore state here
    const savedRoute = getSavedRoute();
    if (savedRoute && window.location.pathname !== savedRoute) {
      window.location.href = savedRoute;
    }
  }
});
