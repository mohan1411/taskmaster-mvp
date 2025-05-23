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
  Chip,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  Google as GoogleIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import api from '../../services/api';

const EmailIntegrationSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [authDialog, setAuthDialog] = useState(false);
  const [authUrl, setAuthUrl] = useState('');

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    checkGoogleConnection();
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

  const checkGoogleConnection = async () => {
    try {
      setCheckingConnection(true);
      const response = await api.get('/api/settings/check-google-connection');
      setGoogleConnected(response.data.connected);
    } catch (err) {
      console.error('Error checking Google connection:', err);
      setGoogleConnected(false);
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await api.put('/api/settings', {
        emailSync: settings.emailSync,
        taskExtraction: settings.taskExtraction
      });
      
      setSuccess(true);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      // Get auth URL
      const response = await api.get('/api/settings/google-auth-url');
      setAuthUrl(response.data.authUrl);
      setAuthDialog(true);
    } catch (err) {
      console.error('Error getting auth URL:', err);
      setError('Failed to connect to Google');
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      setSaving(true);
      await api.post('/api/settings/disconnect-google');
      setGoogleConnected(false);
      setSuccess(true);
    } catch (err) {
      console.error('Error disconnecting Google:', err);
      setError('Failed to disconnect Google account');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleArrayChange = (section, field, value) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    handleSettingChange(section, field, array);
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
          Settings saved successfully!
        </Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Google Account Connection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <GoogleIcon sx={{ mr: 1, color: '#4285f4' }} />
          Google Account Connection
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1">
                  Google Gmail Integration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {googleConnected 
                    ? 'Your Google account is connected and ready for email sync'
                    : 'Connect your Google account to enable email sync and task extraction'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {checkingConnection && <CircularProgress size={20} sx={{ mr: 1 }} />}
                <Chip
                  icon={googleConnected ? <CheckIcon /> : <CloseIcon />}
                  label={googleConnected ? 'Connected' : 'Not Connected'}
                  color={googleConnected ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Box>
          </CardContent>
          <CardActions>
            {googleConnected ? (
              <Button
                variant="outlined"
                color="error"
                onClick={handleDisconnectGoogle}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} /> : <CloseIcon />}
              >
                Disconnect
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleConnectGoogle}
                startIcon={<GoogleIcon />}
              >
                Connect Google Account
              </Button>
            )}
            <IconButton
              onClick={checkGoogleConnection}
              disabled={checkingConnection}
              size="small"
              title="Refresh connection status"
            >
              <RefreshIcon />
            </IconButton>
          </CardActions>
        </Card>
      </Paper>

      {/* Email Sync Settings */}
      {settings && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <EmailIcon sx={{ mr: 1 }} />
            Email Sync Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailSync?.enabled || false}
                    onChange={(e) => handleSettingChange('emailSync', 'enabled', e.target.checked)}
                    disabled={!googleConnected}
                  />
                }
                label="Enable Email Sync"
              />
              {!googleConnected && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                  Connect your Google account to enable email sync
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Sync Frequency"
                value={settings.emailSync?.frequency || 'daily'}
                onChange={(e) => handleSettingChange('emailSync', 'frequency', e.target.value)}
                disabled={!googleConnected || !settings.emailSync?.enabled}
              >
                <MenuItem value="hourly">Every Hour</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="manual">Manual Only</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Emails per Sync"
                value={settings.emailSync?.maxEmailsToProcess || 50}
                onChange={(e) => handleSettingChange('emailSync', 'maxEmailsToProcess', parseInt(e.target.value))}
                disabled={!googleConnected || !settings.emailSync?.enabled}
                inputProps={{ min: 1, max: 500 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Include Labels (comma-separated)"
                value={settings.emailSync?.labels?.join(', ') || ''}
                onChange={(e) => handleArrayChange('emailSync', 'labels', e.target.value)}
                disabled={!googleConnected || !settings.emailSync?.enabled}
                helperText="Leave empty to sync all emails, or specify labels like: INBOX, IMPORTANT"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Exclude Labels (comma-separated)"
                value={settings.emailSync?.excludeLabels?.join(', ') || ''}
                onChange={(e) => handleArrayChange('emailSync', 'excludeLabels', e.target.value)}
                disabled={!googleConnected || !settings.emailSync?.enabled}
                helperText="Emails with these labels will be skipped: SPAM, TRASH, PROMOTIONS"
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Task Extraction Settings */}
      {settings && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 1 }} />
            Task Extraction Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.taskExtraction?.autoExtract || false}
                    onChange={(e) => handleSettingChange('taskExtraction', 'autoExtract', e.target.checked)}
                  />
                }
                label="Auto-extract tasks from emails"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                Automatically detect and extract tasks when syncing emails
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.taskExtraction?.confirmBeforeSaving || true}
                    onChange={(e) => handleSettingChange('taskExtraction', 'confirmBeforeSaving', e.target.checked)}
                  />
                }
                label="Confirm before saving extracted tasks"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                Review and approve tasks before they are saved
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Exclude Terms (comma-separated)"
                value={settings.taskExtraction?.excludeTerms?.join(', ') || ''}
                onChange={(e) => handleArrayChange('taskExtraction', 'excludeTerms', e.target.value)}
                helperText="Emails containing these terms will not be processed for task extraction"
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

      {/* Google Auth Dialog */}
      <Dialog open={authDialog} onClose={() => setAuthDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Connect Google Account</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Click the button below to open Google's authorization page in a new tab. 
            After granting permission, return here and refresh the connection status.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<GoogleIcon />}
              onClick={() => window.open(authUrl, '_blank')}
              disabled={!authUrl}
            >
              Open Google Authorization
            </Button>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              After authorizing, close this dialog and click the refresh button to check your connection status.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuthDialog(false)}>Close</Button>
          <Button
            onClick={() => {
              setAuthDialog(false);
              setTimeout(checkGoogleConnection, 1000);
            }}
            variant="contained"
          >
            I've Authorized - Check Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailIntegrationSettings;
