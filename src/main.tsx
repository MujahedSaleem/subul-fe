import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorProvider } from './context/ErrorContext'; // ✅ Import ErrorProvider
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from '@material-tailwind/react';
import { AuthProvider } from './context/AuthContext.tsx';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter> {/* Only one Router here */}
        <AuthProvider>
          <ThemeProvider>
            <ErrorProvider>
              <App /> {/* App is wrapped by BrowserRouter here */}
            </ErrorProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
