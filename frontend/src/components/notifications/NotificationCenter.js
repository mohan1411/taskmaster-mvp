import React, { useState, useEffect } from 'react';
import {
  Badge,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  ListItemIcon,
  ListItemText,
  Button,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  NotificationsActive as FollowUpIcon,
  Task as TaskIcon,
  Email as EmailIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// Helper function to get icon for notification type
const getNotificationTypeIcon = (referenceType) => {
  switch (referenceType) {
    case 'followup':
      return <FollowUpIcon fontSize="small" />;
    case 'task':
      return <TaskIcon fontSize="small" />;
    case 'email':
      return <EmailIcon fontSize="small" />;
    default:
      return <InfoIcon fontSize="small" />;
  }
};

const NotificationCenter = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Fetch notifications on component mount and periodically
  useEffect(() => {
    fetchNotifications();
    
    // Set up polling interval (every 60 seconds)
    const interval = setInterval(fetchNotifications, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/notifications?limit=10');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await api.put(`/api/notifications/${notificationId}`);
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/api/notifications/mark-all-read');
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => 
        prev.filter(notification => notification._id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  
  const handleNotificationClick = (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      handleMarkAsRead(notification._id, { stopPropagation: () => {} });
    }
    
    // Navigate based on notification type
    if (notification.referenceType === 'followup' && notification.referenceId) {
      navigate(`/followups?id=${notification.referenceId}`);
    } else if (notification.referenceType === 'task' && notification.referenceId) {
      navigate(`/tasks?id=${notification.referenceId}`);
    } else if (notification.referenceType === 'email' && notification.referenceId) {
      navigate(`/emails?id=${notification.referenceId}`);
    }
    
    setAnchorEl(null);
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications(); // Refresh when menu is opened
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const formatNotificationTime = (date) => {
    const notificationDate = new Date(date);
    const now = new Date();
    
    // If the notification is from today, show relative time (e.g., "10 minutes ago")
    if (notificationDate.toDateString() === now.toDateString()) {
      return formatDistanceToNow(notificationDate, { addSuffix: true });
    }
    
    // Otherwise, show the date
    return format(notificationDate, 'MMM d, yyyy');
  };
  
  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleMenuOpen}
        aria-label="notifications"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 500,
            overflow: 'auto'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Notifications
          </Typography>
          
          <Button
            size="small"
            startIcon={<MarkReadIcon />}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all read
          </Button>
        </Box>
        
        <Divider />
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {!loading && notifications.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'text.secondary', my: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        )}
        
        {notifications.map(notification => (
          <MenuItem
            key={notification._id}
            onClick={() => handleNotificationClick(notification)}
            sx={{
              py: 1.5,
              px: 2,
              borderLeft: notification.read ? 'none' : '3px solid',
              borderColor: 'primary.main',
              bgcolor: notification.read ? 'inherit' : 'rgba(25, 118, 210, 0.08)'
            }}
          >
            <ListItemIcon>
              {getNotificationTypeIcon(notification.referenceType)}
            </ListItemIcon>
            
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                  {notification.title}
                </Typography>
              }
              secondary={
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatNotificationTime(notification.createdAt)}
                  </Typography>
                </Box>
              }
            />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
              {!notification.read && (
                <IconButton
                  size="small"
                  onClick={(e) => handleMarkAsRead(notification._id, e)}
                  sx={{ mb: 0.5 }}
                  title="Mark as read"
                >
                  <CircleIcon sx={{ fontSize: 10, color: 'primary.main' }} />
                </IconButton>
              )}
              
              <IconButton
                size="small"
                onClick={(e) => handleDelete(notification._id, e)}
                title="Remove notification"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </MenuItem>
        ))}
        
        {notifications.length > 0 && (
          <Box sx={{ p: 1.5, textAlign: 'center' }}>
            <Button
              size="small"
              onClick={() => {
                navigate('/notifications');
                handleMenuClose();
              }}
            >
              View all notifications
            </Button>
          </Box>
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter;