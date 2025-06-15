import React from 'react';
import { Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const PriorityChip = ({ priority, size = 'small', sx = {}, ...props }) => {
  const theme = useTheme();
  
  const getPriorityConfig = (priority) => {
    const configs = {
      low: {
        label: 'Low',
        sx: {
          backgroundColor: theme.palette.mode === 'light' ? '#e8f5e8' : '#1b4332',
          color: theme.palette.mode === 'light' ? '#2e7d32' : '#4caf50',
          border: `1px solid ${theme.palette.mode === 'light' ? '#4caf50' : '#2e7d32'}`,
          fontWeight: 600,
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light' ? '#c8e6c9' : '#2d5016',
            transform: 'scale(1.05)',
          },
        },
      },
      medium: {
        label: 'Medium',
        sx: {
          backgroundColor: theme.palette.mode === 'light' ? '#fff3e0' : '#3e2723',
          color: theme.palette.mode === 'light' ? '#f57c00' : '#ffb74d',
          border: `1px solid ${theme.palette.mode === 'light' ? '#ff9800' : '#f57c00'}`,
          fontWeight: 600,
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light' ? '#ffe0b2' : '#5d4037',
            transform: 'scale(1.05)',
          },
        },
      },
      high: {
        label: 'High',
        sx: {
          backgroundColor: theme.palette.mode === 'light' ? '#fff8e1' : '#ff6f00',
          color: theme.palette.mode === 'light' ? '#f57c00' : '#fff',
          border: `1px solid ${theme.palette.mode === 'light' ? '#ffa726' : '#ff8f00'}`,
          fontWeight: 600,
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light' ? '#ffecb3' : '#ff8f00',
            transform: 'scale(1.05)',
          },
        },
      },
      urgent: {
        label: 'Urgent',
        sx: {
          backgroundColor: theme.palette.mode === 'light' ? '#ffebee' : '#c62828',
          color: theme.palette.mode === 'light' ? '#d32f2f' : '#fff',
          border: `1px solid ${theme.palette.mode === 'light' ? '#f44336' : '#d32f2f'}`,
          fontWeight: 600,
          animation: 'pulse 2s infinite',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light' ? '#ffcdd2' : '#e53935',
            transform: 'scale(1.05)',
          },
          '@keyframes pulse': {
            '0%': {
              boxShadow: `0 0 0 0 ${theme.palette.mode === 'light' ? 'rgba(244, 67, 54, 0.7)' : 'rgba(244, 67, 54, 0.9)'}`,
            },
            '70%': {
              boxShadow: `0 0 0 10px ${theme.palette.mode === 'light' ? 'rgba(244, 67, 54, 0)' : 'rgba(244, 67, 54, 0)'}`,
            },
            '100%': {
              boxShadow: `0 0 0 0 ${theme.palette.mode === 'light' ? 'rgba(244, 67, 54, 0)' : 'rgba(244, 67, 54, 0)'}`,
            },
          },
        },
      },
    };
    
    return configs[priority?.toLowerCase()] || configs.medium;
  };

  const config = getPriorityConfig(priority);

  return (
    <Chip
      label={config.label}
      size={size}
      variant="outlined"
      sx={{
        ...config.sx,
        transition: 'all 0.2s ease-in-out',
        ...sx,
      }}
      {...props}
    />
  );
};

export default PriorityChip;