import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  NotificationsActive as NotificationIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  CheckCircle as DoneIcon
} from '@mui/icons-material';
import { format, isPast, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import followupService from '../../services/followupService';

const FollowUpNotifications = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    fetchDueFollowUps();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDueFollowUps, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDueFollowUps = async () => {
    try {
      const response = await followupService.checkDueFollowUps();
      const followups = response.followups || [];
      
      // Filter for overdue and due today
      const dueNotifications = followups.filter(followup => {
        const dueDate = new Date(followup.dueDate);
        return isPast(dueDate) || isToday(dueDate);
      });
      
      setNotifications(dueNotifications);
      setOverdueCount(dueNotifications.filter(f => isPast(new Date(f.dueDate)) && !isToday(new Date(f.dueDate))).length);
    } catch (error) {
      console.error('Error fetching follow-up notifications:', error);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (followup) => {
    handleClose();
    navigate(`/followups?id=${followup._id}`);
  };

  const handleMarkComplete = async (followupId, event) => {
    event.stopPropagation();
    try {
      await followupService.updateFollowUp(followupId, { status: 'completed' });
      fetchDueFollowUps();
    } catch (error) {
      console.error('Error marking follow-up as complete:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getNotificationIcon = (followup) => {
    const dueDate = new Date(followup.dueDate);
    
    if (isPast(dueDate) && !isToday(dueDate)) {
      return <WarningIcon color="error" fontSize="small" />;
    } else if (isToday(dueDate)) {
      return <ScheduleIcon color="warning" fontSize="small" />;
    } else {
      return <FlagIcon color="primary" fontSize="small" />;
    }
  };

  const formatDueDate = (date) => {
    const dueDate = new Date(date);
    
    if (isPast(dueDate) && !isToday(dueDate)) {
      return 'Overdue';
    } else if (isToday(dueDate)) {
      return 'Due today';
    } else {
      return format(dueDate, 'MMM d');
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={overdueCount} color="error">
          <NotificationIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 360, maxHeight: 400 }
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="h6">Follow-up Notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            {notifications.length} due or overdue
          </Typography>
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No follow-ups due or overdue
            </Typography>
          </Box>
        ) : (
          notifications.map((followup) => (
            <MenuItem 
              key={followup._id} 
              onClick={() => handleNotificationClick(followup)}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                {getNotificationIcon(followup)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" noWrap>
                    {followup.subject}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {followup.contactName || followup.contactEmail}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color={isPast(new Date(followup.dueDate)) && !isToday(new Date(followup.dueDate)) ? 'error' : 'text.secondary'}
                    >
                      {formatDueDate(followup.dueDate)}
                    </Typography>
                  </Box>
                }
              />
              <IconButton 
                size="small" 
                onClick={(e) => handleMarkComplete(followup._id, e)}
                sx={{ ml: 1 }}
              >
                <DoneIcon fontSize="small" />
              </IconButton>
            </MenuItem>
          ))
        )}
        
        <Divider />
        
        <MenuItem onClick={() => { handleClose(); navigate('/followups'); }}>
          <Typography variant="body2" sx={{ textAlign: 'center', width: '100%' }}>
            View all follow-ups
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default FollowUpNotifications;
