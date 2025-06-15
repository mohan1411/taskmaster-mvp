import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '../utils/theme';

const ThemeContext = createContext();

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a CustomThemeProvider');
  }
  return context;
};

export const CustomThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if auto-theme is enabled
    const autoTheme = localStorage.getItem('fizztask-auto-theme') === 'true';
    
    if (autoTheme) {
      // Use system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    // Check localStorage for manual preference
    const stored = localStorage.getItem('fizztask-theme-mode');
    if (stored) {
      return stored === 'dark';
    }
    
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('fizztask-theme-mode', newMode ? 'dark' : 'light');
      return newMode;
    });
  };

  const setThemeMode = (mode) => {
    const isDark = mode === 'dark';
    setIsDarkMode(isDark);
    // Disable auto-theme when manually setting theme
    localStorage.setItem('fizztask-auto-theme', 'false');
    localStorage.setItem('fizztask-theme-mode', mode);
  };

  const setAutoTheme = (enabled) => {
    localStorage.setItem('fizztask-auto-theme', enabled.toString());
    if (enabled) {
      // Switch to system preference immediately
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemPrefersDark);
      localStorage.removeItem('fizztask-theme-mode');
    }
  };

  // Listen for system theme changes and update document attribute
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only auto-switch if auto-theme is enabled
      const autoTheme = localStorage.getItem('fizztask-auto-theme') === 'true';
      if (autoTheme) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update document attribute when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    // Also update CSS custom properties directly as fallback
    document.documentElement.style.setProperty('--text-primary', isDarkMode ? '#ffffff' : '#1a1a1a');
    document.documentElement.style.setProperty('--text-secondary', isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#616161');
    document.documentElement.style.setProperty('--background-default', isDarkMode ? '#121212' : '#fafafa');
    document.documentElement.style.setProperty('--background-paper', isDarkMode ? '#1e1e1e' : '#ffffff');
  }, [isDarkMode]);

  // Set initial theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.style.setProperty('--text-primary', isDarkMode ? '#ffffff' : '#1a1a1a');
    document.documentElement.style.setProperty('--text-secondary', isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#616161');
    document.documentElement.style.setProperty('--background-default', isDarkMode ? '#121212' : '#fafafa');
    document.documentElement.style.setProperty('--background-paper', isDarkMode ? '#1e1e1e' : '#ffffff');
  }, []);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  const value = {
    isDarkMode,
    toggleTheme,
    setThemeMode,
    setAutoTheme,
    theme: currentTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};