import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Grid,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  MenuItem,
  Card,
  CardContent,
  IconButton,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Computer as BrowserIcon,
  Phone as PhoneIcon,
  VolumeUp as SoundIcon,
  Settings as SettingsIcon,
  Science as TestIcon
} from '@mui/icons-material';
import api from '../../services/api';

const NotificationSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [browserPermission, setBrowserPermission] = useState('default');

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    checkBrowserPermission();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/settings');
      setSettings(response.data);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const checkBrowserPermission = () => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      
      if (permission === 'granted') {
        // Show test notification
        new Notification('FizzTask', {
          body: 'Browser notifications are now enabled!',
          icon: '/favicon.ico'
        });
      }
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await api.put('/api/settings', {
        notifications: settings.notifications
      });
      
      setSuccess(true);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [section]: {
          ...prev.notifications[section],
          [field]: value
        }
      }
    }));
  };

  const testNotification = (type) => {
    switch (type) {
      case 'browser':
        if (Notification.permission === 'granted') {
          new Notification('FizzTask Test', {
            body: 'This is a test browser notification',
            icon: '/favicon.ico'
          });
        } else {
          setError('Browser notifications not permitted');
        }
        break;
      case 'email':
        // This would trigger a test email in a real implementation
        setSuccess(true);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success">
          Notification settings saved successfully!
        </Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Browser Notifications */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <BrowserIcon sx={{ mr: 1 }} />
          Browser Notifications
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1">
                  Browser Permission Status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {browserPermission === 'granted' 
                    ? 'Browser notifications are enabled'
                    : browserPermission === 'denied'
                    ? 'Browser notifications are blocked'
                    : 'Browser notification permission not requested'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={browserPermission}
                  color={browserPermission === 'granted' ? 'success' : browserPermission === 'denied' ? 'error' : 'default'}
                  size="small"
                />
                {browserPermission !== 'granted' && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={requestBrowserPermission}
                  >
                    Enable
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {settings && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications?.browser?.enabled || false}
                    onChange={(e) => handleSettingChange('browser', 'enabled', e.target.checked)}
                    disabled={browserPermission !== 'granted'}
                  />
                }
                label="Enable Browser Notifications"
              />
              {browserPermission !== 'granted' && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                  Enable browser permission first
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">Test browser notifications:</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<TestIcon />}
                  onClick={() => testNotification('browser')}
                  disabled={browserPermission !== 'granted'}
                >
                  Test
                </Button>
              </Box>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Email Notifications */}
      {settings && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <EmailIcon sx={{ mr: 1 }} />
            Email Notifications
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications?.email?.enabled || false}
                    onChange={(e) => handleSettingChange('email', 'enabled', e.target.checked)}
                  />
                }
                label="Enable Email Notifications"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Email Frequency"
                value={settings.notifications?.email?.frequency || 'immediate'}
                onChange={(e) => handleSettingChange('email', 'frequency', e.target.value)}
                disabled={!settings.notifications?.email?.enabled}
              >
                <MenuItem value="immediate">Immediate</MenuItem>
                <MenuItem value="hourly">Hourly Digest</MenuItem>
                <MenuItem value="daily">Daily Digest</MenuItem>
                <MenuItem value="weekly">Weekly Summary</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Email Notification Types
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications?.email?.types?.taskReminders || true}
                        onChange={(e) => handleSettingChange('email', 'types', {
                          ...settings.notifications?.email?.types,
                          taskReminders: e.target.checked
                        })}
                        disabled={!settings.notifications?.email?.enabled}
                      />
                    }
                    label="Task Reminders"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications?.email?.types?.followUpReminders || true}
                        onChange={(e) => handleSettingChange('email', 'types', {
                          ...settings.notifications?.email?.types,
                          followUpReminders: e.target.checked
                        })}
                        disabled={!settings.notifications?.email?.enabled}
                      />
                    }
                    label="Follow-up Reminders"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications?.email?.types?.overdueAlerts || true}
                        onChange={(e) => handleSettingChange('email', 'types', {
                          ...settings.notifications?.email?.types,
                          overdueAlerts: e.target.checked
                        })}
                        disabled={!settings.notifications?.email?.enabled}
                      />
                    }
                    label="Overdue Alerts"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications?.email?.types?.weeklyReports || false}
                        onChange={(e) => handleSettingChange('email', 'types', {
                          ...settings.notifications?.email?.types,
                          weeklyReports: e.target.checked
                        })}
                        disabled={!settings.notifications?.email?.enabled}
                      />
                    }
                    label="Weekly Reports"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2">Test email notifications:</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<TestIcon />}
                  onClick={() => testNotification('email')}
                  disabled={!settings.notifications?.email?.enabled}
                >
                  Send Test Email
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Notification Preferences */}
      {settings && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 1 }} />
            Notification Preferences
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Quiet Hours Start"
                value={settings.notifications?.quietHours?.start || '22:00'}
                onChange={(e) => handleSettingChange('quietHours', 'start', e.target.value)}
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return (
                    <MenuItem key={hour} value={`${hour}:00`}>
                      {`${hour}:00`}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Quiet Hours End"
                value={settings.notifications?.quietHours?.end || '08:00'}
                onChange={(e) => handleSettingChange('quietHours', 'end', e.target.value)}
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return (
                    <MenuItem key={hour} value={`${hour}:00`}>
                      {`${hour}:00`}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications?.quietHours?.enabled || false}
                    onChange={(e) => handleSettingChange('quietHours', 'enabled', e.target.checked)}
                  />
                }
                label="Enable Quiet Hours"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                No notifications will be sent during quiet hours
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications?.weekendsOnly || false}
                    onChange={(e) => handleSettingChange('notifications', 'weekendsOnly', e.target.checked)}
                  />
                }
                label="Weekdays Only"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                Only send notifications on weekdays (Monday-Friday)
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveSettings}
          disabled={saving || loading}
          sx={{ minWidth: 120 }}
        >
          {saving ? <CircularProgress size={24} /> : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
};

export default NotificationSettings;
