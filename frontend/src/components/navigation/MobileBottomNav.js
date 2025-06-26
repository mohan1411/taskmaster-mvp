import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  CheckCircle as TaskIcon,
  Email as EmailIcon,
  Psychology as FocusIcon,
  Menu as MoreIcon,
  Notifications as NotificationsIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

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
        // Open drawer for more options
        setMoreMenuOpen(true);
        break;
      default:
        break;
    }
  };

  const handleDrawerClose = () => {
    setMoreMenuOpen(false);
  };

  const handleNavigateFromDrawer = (path) => {
    navigate(path);
    handleDrawerClose();
  };

  const handleLogout = async () => {
    handleDrawerClose();
    await logout();
    navigate('/login');
  };

  return (
    <>
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
    
    {/* More Options Drawer */}
    <Drawer
      anchor="bottom"
      open={moreMenuOpen}
      onClose={handleDrawerClose}
      sx={{
        '& .MuiDrawer-paper': {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }
      }}
    >
      <Box sx={{ width: 'auto', pt: 2, pb: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Box 
            sx={{ 
              width: 40, 
              height: 4, 
              bgcolor: 'grey.400', 
              borderRadius: 2,
              mx: 'auto',
              mb: 2
            }} 
          />
          <Typography variant="h6">More Options</Typography>
        </Box>
        
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigateFromDrawer('/followups')}>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText primary="Follow-ups" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigateFromDrawer('/focus/analytics')}>
              <ListItemIcon>
                <AnalyticsIcon />
              </ListItemIcon>
              <ListItemText primary="Focus Analytics" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigateFromDrawer('/documents')}>
              <ListItemIcon>
                <FolderIcon />
              </ListItemIcon>
              <ListItemText primary="Documents" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigateFromDrawer('/settings')}>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </ListItem>
          
          <Divider sx={{ my: 1 }} />
          
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon color="error" />
              </ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ color: 'error' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
    </>
  );
};

export default MobileBottomNav;