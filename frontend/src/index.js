import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CustomThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import './styles/theme-fixes.css';
import './styles/emergency-black-text.css';

// Debug theme loading
console.log('🎨 Environment:', process.env.NODE_ENV);
console.log('🎨 API URL:', process.env.REACT_APP_API_URL);

// EMERGENCY: Force proper text colors based on theme
const emergencyStyle = document.createElement('style');
emergencyStyle.textContent = `
  /* Light mode */
  html:not([data-theme="dark"]) * { color: #000000 !important; }
  html:not([data-theme="dark"]) body { background: #fafafa !important; }
  html:not([data-theme="dark"]) .MuiCard-root, 
  html:not([data-theme="dark"]) .MuiPaper-root { background: #ffffff !important; }
  
  /* Dark mode */
  [data-theme="dark"] * { color: #ffffff !important; }
  [data-theme="dark"] body { background: #121212 !important; }
  [data-theme="dark"] .page-container { background: #121212 !important; }
  [data-theme="dark"] .MuiCard-root,
  [data-theme="dark"] .MuiPaper-root { background: #1e1e1e !important; }
`;
document.head.appendChild(emergencyStyle);

// Emergency theme override
const emergencyTheme = createTheme({
  palette: {
    mode: 'light',
    text: {
      primary: '#000000',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <CustomThemeProvider>
          <CssBaseline />
          <AuthProvider>
            <App />
          </AuthProvider>
        </CustomThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
