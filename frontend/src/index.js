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

// EMERGENCY: Force black text immediately
const emergencyStyle = document.createElement('style');
emergencyStyle.textContent = `
  * { color: #000000 !important; }
  body { background: #fafafa !important; }
  .MuiCard-root, .MuiPaper-root { background: #ffffff !important; }
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
