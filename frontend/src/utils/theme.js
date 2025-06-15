import { createTheme } from '@mui/material/styles';

// Base theme configuration
const baseTheme = {
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    primary: {
      main: '#2196f3', // Blue
      light: '#64b5f6',
      dark: '#1976d2',
      contrastText: '#fff',
    },
    secondary: {
      main: '#ff9800', // Orange
      light: '#ffb74d',
      dark: '#f57c00',
      contrastText: '#fff',
    },
    success: {
      main: '#4caf50', // Green
      light: '#81c784',
      dark: '#388e3c',
    },
    error: {
      main: '#f44336', // Red
      light: '#e57373',
      dark: '#d32f2f',
    },
    warning: {
      main: '#ff9800', // Orange
      light: '#ffb74d',
      dark: '#f57c00',
    },
    info: {
      main: '#2196f3', // Blue
      light: '#64b5f6',
      dark: '#1976d2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    fontSize: 14, // Explicit base font size
    h1: {
      fontSize: '2.25rem', // Reduced from 2.5rem
      fontWeight: 500,
    },
    h2: {
      fontSize: '1.875rem', // Reduced from 2rem
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.5rem', // Reduced from 1.75rem
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.625rem', // Reduced from 2rem for stat cards
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '0.875rem', // Reduced from 1rem
    },
    body2: {
      fontSize: '0.8125rem', // Reduced from 0.875rem
    },
    subtitle1: {
      fontSize: '0.875rem', // Reduced 
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.8125rem', // Reduced from 0.875rem
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
};

// Light theme
export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: 'light',
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
  },
});

// Dark theme
export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
      contrastText: '#fff',
    },
    secondary: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
      contrastText: '#fff',
    },
    success: {
      main: '#66bb6a',
      light: '#81c784',
      dark: '#388e3c',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
});

// Default theme (for backward compatibility)
const theme = lightTheme;

export default theme;
