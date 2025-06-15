import React from 'react';
import { Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  CheckCircle, 
  Schedule, 
  PlayArrow, 
  Pause,
  Cancel 
} from '@mui/icons-material';

const StatusChip = ({ status, size = 'small', showIcon = true, sx = {}, ...props }) => {
  const theme = useTheme();
  
  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: 'Pending',
        icon: <Schedule fontSize="small" />,
        sx: {
          backgroundColor: theme.palette.mode === 'light' ? '#f3f4f6' : '#374151',
          color: theme.palette.mode === 'light' ? '#6b7280' : '#d1d5db',
          border: `1px solid ${theme.palette.mode === 'light' ? '#d1d5db' : '#6b7280'}`,
          fontWeight: 500,
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light' ? '#e5e7eb' : '#4b5563',
            transform: 'scale(1.05)',
          },
        },
      },
      'in-progress': {
        label: 'In Progress',
        icon: <PlayArrow fontSize="small" />,
        sx: {
          backgroundColor: theme.palette.mode === 'light' ? '#dbeafe' : '#1e3a8a',
          color: theme.palette.mode === 'light' ? '#1d4ed8' : '#60a5fa',
          border: `1px solid ${theme.palette.mode === 'light' ? '#3b82f6' : '#1d4ed8'}`,
          fontWeight: 500,
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light' ? '#bfdbfe' : '#1e40af',
            transform: 'scale(1.05)',
          },
        },
      },
      completed: {
        label: 'Completed',
        icon: <CheckCircle fontSize="small" />,
        sx: {
          backgroundColor: theme.palette.mode === 'light' ? '#dcfce7' : '#14532d',
          color: theme.palette.mode === 'light' ? '#16a34a' : '#4ade80',
          border: `1px solid ${theme.palette.mode === 'light' ? '#22c55e' : '#16a34a'}`,
          fontWeight: 500,
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light' ? '#bbf7d0' : '#166534',
            transform: 'scale(1.05)',
          },
        },
      },
      paused: {
        label: 'Paused',
        icon: <Pause fontSize="small" />,
        sx: {
          backgroundColor: theme.palette.mode === 'light' ? '#fef3c7' : '#92400e',
          color: theme.palette.mode === 'light' ? '#d97706' : '#fbbf24',
          border: `1px solid ${theme.palette.mode === 'light' ? '#f59e0b' : '#d97706'}`,
          fontWeight: 500,
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light' ? '#fde68a' : '#a16207',
            transform: 'scale(1.05)',
          },
        },
      },
      cancelled: {
        label: 'Cancelled',
        icon: <Cancel fontSize="small" />,
        sx: {
          backgroundColor: theme.palette.mode === 'light' ? '#fee2e2' : '#7f1d1d',
          color: theme.palette.mode === 'light' ? '#dc2626' : '#fca5a5',
          border: `1px solid ${theme.palette.mode === 'light' ? '#ef4444' : '#dc2626'}`,
          fontWeight: 500,
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light' ? '#fecaca' : '#991b1b',
            transform: 'scale(1.05)',
          },
        },
      },
    };
    
    return configs[status?.toLowerCase()] || configs.pending;
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      label={config.label}
      icon={showIcon ? config.icon : undefined}
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

export default StatusChip;