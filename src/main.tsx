import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorProvider } from "./context/ErrorContext"; // ✅ Import ErrorProvider

import App from './App.tsx';
import './index.css';
import { ThemeProvider } from '@material-tailwind/react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
        <ThemeProvider>

  <ErrorProvider>
    <App />
  </ErrorProvider>,
  </ThemeProvider>
  </StrictMode>
);
