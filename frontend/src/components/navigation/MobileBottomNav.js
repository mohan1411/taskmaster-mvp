import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CheckCircle as TaskIcon,
  Email as EmailIcon,
  Psychology as FocusIcon,
  Menu as MoreIcon
} from '@mui/icons-material';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Don't render on desktop
  if (!isMobile) {
    return null;
  }

  // Get current route value
  const getRouteValue = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 0;
    if (path.includes('/tasks')) return 1;
    if (path.includes('/emails')) return 2;
    if (path.includes('/focus')) return 3;
    return 4; // More
  };

  const handleChange = (event, newValue) => {
    switch (newValue) {
      case 0:
        navigate('/dashboard');
        break;
      case 1:
        navigate('/tasks');
        break;
      case 2:
        navigate('/emails');
        break;
      case 3:
        navigate('/focus');
        break;
      case 4:
        // Open drawer or menu for more options
        break;
      default:
        break;
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        display: { xs: 'block', md: 'none' }
      }}
      elevation={8}
    >
      <BottomNavigation
        value={getRouteValue()}
        onChange={handleChange}
        showLabels
      >
        <BottomNavigationAction
          label="Dashboard"
          icon={<DashboardIcon />}
        />
        <BottomNavigationAction
          label="Tasks"
          icon={<TaskIcon />}
        />
        <BottomNavigationAction
          label="Emails"
          icon={<EmailIcon />}
        />
        <BottomNavigationAction
          label="Focus"
          icon={<FocusIcon />}
        />
        <BottomNavigationAction
          label="More"
          icon={<MoreIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;