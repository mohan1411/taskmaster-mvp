import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  NotificationsActive as NotificationsIcon,
  Email as EmailIcon,
  Computer as BrowserIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import followupService from '../../services/followupService';

// Helper function to convert time string to human-readable format
const formatTimeString = (timeStr) => {
  if (!timeStr) return '';
  
  const value = parseInt(timeStr.slice(0, -1));
  const unit = timeStr.slice(-1);
  
  if (unit === 'd') {
    return `${value} ${value === 1 ? 'day' : 'days'}`;
  } else if (unit === 'h') {
    return `${value} ${value === 1 ? 'hour' : 'hours'}`;
  } else if (unit === 'm') {
    return `${value} ${value === 1 ? 'minute' : 'minutes'}`;
  }
  
  return timeStr;
};

// Helper function to get icon for notification type
const getNotificationTypeIcon = (type) => {
  switch (type) {
    case 'in-app':
      return <NotificationsIcon fontSize="small" />;
    case 'email':
      return <EmailIcon fontSize="small" />;
    case 'browser':
      return <BrowserIcon fontSize="small" />;
    default:
      return <NotificationsIcon fontSize="small" />;
  }
};

const ReminderSettingsDialog = ({ open, onClose, followupId, existingSettings, onSave }) => {
  const [settings, setSettings] = useState({
    enabled: true,
    schedule: [{ time: '1d', notificationType: 'in-app' }],
    priorityBased: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Initialize with existing settings if available
  useEffect(() => {
    if (existingSettings) {
      setSettings({
        enabled: existingSettings.enabled !== undefined ? existingSettings.enabled : true,
        schedule: existingSettings.schedule && existingSettings.schedule.length > 0 
          ? existingSettings.schedule 
          : [{ time: '1d', notificationType: 'in-app' }],
        priorityBased: existingSettings.priorityBased !== undefined ? existingSettings.priorityBased : true
      });
    }
  }, [existingSettings]);
  
  const handleAddReminder = () => {
    setSettings(prev => ({
      ...prev,
      schedule: [...prev.schedule, { time: '1d', notificationType: 'in-app' }]
    }));
  };
  
  const handleRemoveReminder = (index) => {
    setSettings(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };
  
  const handleChangeReminderTime = (index, value) => {
    const newSchedule = [...settings.schedule];
    newSchedule[index] = { ...newSchedule[index], time: value };
    setSettings(prev => ({ ...prev, schedule: newSchedule }));
  };
  
  const handleChangeNotificationType = (index, value) => {
    const newSchedule = [...settings.schedule];
    newSchedule[index] = { ...newSchedule[index], notificationType: value };
    setSettings(prev => ({ ...prev, schedule: newSchedule }));
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate inputs
      if (!settings.schedule || settings.schedule.length === 0) {
        setError('At least one reminder schedule is required');
        return;
      }
      
      // Sort schedule by time (largest to smallest)
      const sortedSchedule = [...settings.schedule].sort((a, b) => {
        const aValue = parseInt(a.time.slice(0, -1));
        const bValue = parseInt(b.time.slice(0, -1));
        const aUnit = a.time.slice(-1);
        const bUnit = b.time.slice(-1);
        
        // Convert all to minutes for comparison
        const aMinutes = aUnit === 'd' ? aValue * 24 * 60 : aUnit === 'h' ? aValue * 60 : aValue;
        const bMinutes = bUnit === 'd' ? bValue * 24 * 60 : bUnit === 'h' ? bValue * 60 : bValue;
        
        return bMinutes - aMinutes; // Descending order
      });
      
      const reminderSettings = {
        ...settings,
        schedule: sortedSchedule
      };
      
      console.log('Saving reminder settings:', reminderSettings);
      
      if (followupId) {
        const result = await followupService.updateFollowUp(followupId, { reminderSettings });
        console.log('Update result:', result);
      }
      
      if (onSave) {
        onSave(reminderSettings);
      }
      
      onClose();
    } catch (err) {
      console.error('Error saving reminder settings:', err);
      let errorMessage = 'Failed to save reminder settings';
      
      // More specific error messages
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Follow-up not found';
        } else if (err.response.status === 403) {
          errorMessage = 'Not authorized to update this follow-up';
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <NotificationsIcon sx={{ mr: 1 }} />
          Follow-up Reminder Settings
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled}
                onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                color="primary"
              />
            }
            label="Enable reminders"
          />
          
          <Tooltip title="When enabled, you'll receive reminders before the follow-up is due">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography variant="subtitle1" gutterBottom>
          Reminder Schedule
        </Typography>
        
        <List disablePadding>
          {settings.schedule.map((reminder, index) => (
            <ListItem key={index} disablePadding sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start', gap: 2 }}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel id={`time-label-${index}`}>Time Before</InputLabel>
                  <Select
                    labelId={`time-label-${index}`}
                    value={reminder.time}
                    onChange={(e) => handleChangeReminderTime(index, e.target.value)}
                    label="Time Before"
                    size="small"
                  >
                    <MenuItem value="30m">30 minutes</MenuItem>
                    <MenuItem value="1h">1 hour</MenuItem>
                    <MenuItem value="3h">3 hours</MenuItem>
                    <MenuItem value="6h">6 hours</MenuItem>
                    <MenuItem value="12h">12 hours</MenuItem>
                    <MenuItem value="1d">1 day</MenuItem>
                    <MenuItem value="2d">2 days</MenuItem>
                    <MenuItem value="3d">3 days</MenuItem>
                    <MenuItem value="7d">7 days</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl sx={{ minWidth: 150, flexGrow: 1 }}>
                  <InputLabel id={`type-label-${index}`}>Notification Type</InputLabel>
                  <Select
                    labelId={`type-label-${index}`}
                    value={reminder.notificationType}
                    onChange={(e) => handleChangeNotificationType(index, e.target.value)}
                    label="Notification Type"
                    size="small"
                  >
                    <MenuItem value="in-app">In-app</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="browser">Browser</MenuItem>
                  </Select>
                </FormControl>
                
                <IconButton 
                  color="error" 
                  onClick={() => handleRemoveReminder(index)}
                  sx={{ mt: 1 }}
                  disabled={settings.schedule.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ mt: 2, mb: 3 }}>
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddReminder}
            variant="outlined"
            size="small"
          >
            Add Reminder
          </Button>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Priority Settings
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={settings.priorityBased}
              onChange={(e) => setSettings(prev => ({ ...prev, priorityBased: e.target.checked }))}
              color="primary"
            />
          }
          label="Send earlier reminders for high priority follow-ups"
        />
        
        <Tooltip title="When enabled, high priority follow-ups will get reminders sooner">
          <IconButton size="small" sx={{ ml: 1 }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        {settings.priorityBased && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              For high priority follow-ups, reminders will be sent 50% earlier than scheduled.
              For urgent priority follow-ups, reminders will be sent twice as early and more frequently.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const FollowUpReminderSettings = ({ followupId }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchSettings = async () => {
      if (!followupId) return;
      
      try {
        setLoading(true);
        const followup = await followupService.getFollowUpById(followupId);
        setSettings(followup.reminderSettings || {
          enabled: true,
          schedule: [{ time: '1d', notificationType: 'in-app' }],
          priorityBased: true
        });
      } catch (err) {
        console.error('Error fetching reminder settings:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [followupId]);
  
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
  };
  
  const renderReminderSummary = () => {
    if (!settings || !settings.enabled) {
      return <Typography variant="body2">Reminders are disabled</Typography>;
    }
    
    return (
      <Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>Reminders will be sent:</Typography>
          {settings.schedule.map((reminder, index) => (
            <Chip
              key={index}
              icon={getNotificationTypeIcon(reminder.notificationType)}
              label={`${formatTimeString(reminder.time)} before due`}
              size="small"
              variant="outlined"
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </Box>
        
        {settings.priorityBased && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>Priority-based timing:</Typography>
            <Chip
              icon={<InfoIcon fontSize="small" />}
              label="High priority: 50% earlier reminders"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ mr: 1, mb: 1 }}
            />
            <Chip
              icon={<InfoIcon fontSize="small" />}
              label="Urgent priority: 2x earlier reminders"
              size="small"
              color="error"
              variant="outlined"
              sx={{ mr: 1, mb: 1 }}
            />
          </Box>
        )}
      </Box>
    );
  };
  
  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">
          <NotificationsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Reminder Settings
        </Typography>
        
        <Button 
          variant="outlined" 
          size="small"
          onClick={() => setOpenDialog(true)}
        >
          Configure
        </Button>
      </Box>
      
      <Divider sx={{ my: 1 }} />
      
      {loading ? (
        <Typography variant="body2">Loading settings...</Typography>
      ) : (
        renderReminderSummary()
      )}
      
      <ReminderSettingsDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        followupId={followupId}
        existingSettings={settings}
        onSave={handleSaveSettings}
      />
    </Paper>
  );
};

export default FollowUpReminderSettings;