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
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Slider,
  Chip,
  Avatar
} from '@mui/material';
import {
  Palette as PaletteIcon,
  ViewModule as ViewIcon,
  Language as LanguageIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import api from '../../services/api';

const InterfaceSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [previewTheme, setPreviewTheme] = useState('light');

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/settings');
      setSettings(response.data);
      setPreviewTheme(response.data.ui?.theme || 'light');
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await api.put('/api/settings', {
        ui: settings.ui
      });
      
      setSuccess(true);
      
      // Apply theme immediately (this would be handled by a theme context in a real app)
      if (settings.ui?.theme) {
        document.documentElement.setAttribute('data-theme', settings.ui.theme);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save interface settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        [field]: value
      }
    }));
  };

  const themes = [
    { id: 'light', name: 'Light', color: '#fff' },
    { id: 'dark', name: 'Dark', color: '#121212' },
    { id: 'blue', name: 'Blue', color: '#1976d2' },
    { id: 'green', name: 'Green', color: '#388e3c' },
    { id: 'purple', name: 'Purple', color: '#7b1fa2' }
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' }
  ];

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ];

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
          Interface settings saved successfully!
        </Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Theme Settings */}
      {settings && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <PaletteIcon sx={{ mr: 1 }} />
            Theme & Appearance
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormLabel component="legend">Color Theme</FormLabel>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                {themes.map((theme) => (
                  <Card
                    key={theme.id}
                    variant="outlined"
                    sx={{
                      minWidth: 120,
                      cursor: 'pointer',
                      border: previewTheme === theme.id ? 2 : 1,
                      borderColor: previewTheme === theme.id ? 'primary.main' : 'divider'
                    }}
                    onClick={() => {
                      setPreviewTheme(theme.id);
                      handleSettingChange('theme', theme.id);
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: theme.color,
                          width: 40,
                          height: 40,
                          mx: 'auto',
                          mb: 1,
                          border: '2px solid #ddd'
                        }}
                      >
                        {theme.name[0]}
                      </Avatar>
                      <Typography variant="body2">{theme.name}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ui?.autoTheme || false}
                    onChange={(e) => handleSettingChange('autoTheme', e.target.checked)}
                  />
                }
                label="Auto-switch theme based on system preference"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Interface Density
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={settings.ui?.density || 50}
                  onChange={(e, value) => handleSettingChange('density', value)}
                  min={0}
                  max={100}
                  step={25}
                  marks={[
                    { value: 0, label: 'Compact' },
                    { value: 50, label: 'Comfortable' },
                    { value: 100, label: 'Spacious' }
                  ]}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* View Settings */}
      {settings && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <ViewIcon sx={{ mr: 1 }} />
            Default Views
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Default Dashboard View"
                value={settings.ui?.defaultDashboardView || 'overview'}
                onChange={(e) => handleSettingChange('defaultDashboardView', e.target.value)}
              >
                <MenuItem value="overview">Overview</MenuItem>
                <MenuItem value="tasks">Tasks</MenuItem>
                <MenuItem value="followups">Follow-ups</MenuItem>
                <MenuItem value="calendar">Calendar</MenuItem>
                <MenuItem value="analytics">Analytics</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Default Task View"
                value={settings.ui?.defaultTaskView || 'list'}
                onChange={(e) => handleSettingChange('defaultTaskView', e.target.value)}
              >
                <MenuItem value="list">List View</MenuItem>
                <MenuItem value="board">Board View</MenuItem>
                <MenuItem value="calendar">Calendar View</MenuItem>
                <MenuItem value="timeline">Timeline View</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ui?.showCompletedTasks || false}
                    onChange={(e) => handleSettingChange('showCompletedTasks', e.target.checked)}
                  />
                }
                label="Show completed tasks by default"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ui?.showSidebar || true}
                    onChange={(e) => handleSettingChange('showSidebar', e.target.checked)}
                  />
                }
                label="Show sidebar by default"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ui?.enableAnimations || true}
                    onChange={(e) => handleSettingChange('enableAnimations', e.target.checked)}
                  />
                }
                label="Enable UI animations"
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Language & Localization */}
      {settings && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <LanguageIcon sx={{ mr: 1 }} />
            Language & Localization
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Language"
                value={settings.ui?.language || 'en'}
                onChange={(e) => handleSettingChange('language', e.target.value)}
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: 8 }}>{lang.flag}</span>
                      {lang.name}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Timezone"
                value={settings.ui?.timezone || 'America/New_York'}
                onChange={(e) => handleSettingChange('timezone', e.target.value)}
              >
                {timezones.map((tz) => (
                  <MenuItem key={tz} value={tz}>
                    {tz.replace('_', ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Date Format"
                value={settings.ui?.dateFormat || 'MM/DD/YYYY'}
                onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
              >
                <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                <MenuItem value="DD MMM YYYY">DD MMM YYYY</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Time Format"
                value={settings.ui?.timeFormat || '12'}
                onChange={(e) => handleSettingChange('timeFormat', e.target.value)}
              >
                <MenuItem value="12">12-hour (AM/PM)</MenuItem>
                <MenuItem value="24">24-hour</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Dashboard Customization */}
      {settings && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon sx={{ mr: 1 }} />
            Dashboard Customization
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Widget Visibility
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.ui?.widgets?.taskSummary !== false}
                        onChange={(e) => handleSettingChange('widgets', {
                          ...settings.ui?.widgets,
                          taskSummary: e.target.checked
                        })}
                      />
                    }
                    label="Task Summary"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.ui?.widgets?.upcomingTasks !== false}
                        onChange={(e) => handleSettingChange('widgets', {
                          ...settings.ui?.widgets,
                          upcomingTasks: e.target.checked
                        })}
                      />
                    }
                    label="Upcoming Tasks"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.ui?.widgets?.followUpReminders !== false}
                        onChange={(e) => handleSettingChange('widgets', {
                          ...settings.ui?.widgets,
                          followUpReminders: e.target.checked
                        })}
                      />
                    }
                    label="Follow-up Reminders"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.ui?.widgets?.recentActivity !== false}
                        onChange={(e) => handleSettingChange('widgets', {
                          ...settings.ui?.widgets,
                          recentActivity: e.target.checked
                        })}
                      />
                    }
                    label="Recent Activity"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.ui?.widgets?.analytics || false}
                        onChange={(e) => handleSettingChange('widgets', {
                          ...settings.ui?.widgets,
                          analytics: e.target.checked
                        })}
                      />
                    }
                    label="Analytics Chart"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.ui?.widgets?.calendar || false}
                        onChange={(e) => handleSettingChange('widgets', {
                          ...settings.ui?.widgets,
                          calendar: e.target.checked
                        })}
                      />
                    }
                    label="Calendar Widget"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Items per page"
                value={settings.ui?.itemsPerPage || 20}
                onChange={(e) => handleSettingChange('itemsPerPage', parseInt(e.target.value))}
                inputProps={{ min: 5, max: 100 }}
                helperText="Number of items to display per page in lists"
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Accessibility Settings */}
      {settings && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <VisibilityIcon sx={{ mr: 1 }} />
            Accessibility
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ui?.highContrast || false}
                    onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
                  />
                }
                label="High contrast mode"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ui?.reducedMotion || false}
                    onChange={(e) => handleSettingChange('reducedMotion', e.target.checked)}
                  />
                }
                label="Reduce motion and animations"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ui?.largeText || false}
                    onChange={(e) => handleSettingChange('largeText', e.target.checked)}
                  />
                }
                label="Large text mode"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ui?.keyboardNavigation || true}
                    onChange={(e) => handleSettingChange('keyboardNavigation', e.target.checked)}
                  />
                }
                label="Enhanced keyboard navigation"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Font Size
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={settings.ui?.fontSize || 100}
                  onChange={(e, value) => handleSettingChange('fontSize', value)}
                  min={75}
                  max={150}
                  step={25}
                  marks={[
                    { value: 75, label: 'Small' },
                    { value: 100, label: 'Normal' },
                    { value: 125, label: 'Large' },
                    { value: 150, label: 'Extra Large' }
                  ]}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Advanced Settings */}
      {settings && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <ScheduleIcon sx={{ mr: 1 }} />
            Advanced Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ui?.autoSave || true}
                    onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                  />
                }
                label="Auto-save changes"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                Automatically save changes without clicking save button
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ui?.confirmDelete || true}
                    onChange={(e) => handleSettingChange('confirmDelete', e.target.checked)}
                  />
                }
                label="Confirm before deleting"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                Show confirmation dialog before deleting items
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.ui?.showTooltips || true}
                    onChange={(e) => handleSettingChange('showTooltips', e.target.checked)}
                  />
                }
                label="Show helpful tooltips"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                Display helpful hints and explanations on hover
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Auto-refresh interval (minutes)"
                value={settings.ui?.autoRefreshInterval || 5}
                onChange={(e) => handleSettingChange('autoRefreshInterval', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 60 }}
                helperText="How often to automatically refresh data (0 to disable)"
              />
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

export default InterfaceSettings;
