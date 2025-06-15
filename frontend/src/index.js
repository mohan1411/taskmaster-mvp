import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CustomThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Debug theme loading
console.log('🎨 Environment:', process.env.NODE_ENV);
console.log('🎨 API URL:', process.env.REACT_APP_API_URL);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <CustomThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </CustomThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
