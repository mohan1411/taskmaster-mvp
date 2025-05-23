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
  Slider,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import {
  Psychology as AIIcon,
  Transform as ExtractIcon,
  AutoFixHigh as AutoIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import api from '../../services/api';

const TaskExtractionSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [aiStatus, setAiStatus] = useState('checking');

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    checkAIStatus();
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

  const checkAIStatus = async () => {
    try {
      // This would check if OpenAI is configured and working
      setAiStatus('connected');
    } catch (err) {
      setAiStatus('error');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await api.put('/api/settings', {
        taskExtraction: settings.taskExtraction,
        followUps: settings.followUps
      });
      
      setSuccess(true);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save task extraction settings');
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
          Task extraction settings saved successfully!
        </Alert>
      </Snackbar>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* AI Status */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AIIcon sx={{ mr: 1 }} />
          AI Engine Status
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1">
                  OpenAI Integration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {aiStatus === 'connected' 
                    ? 'AI task extraction is available and ready'
                    : aiStatus === 'checking'
                    ? 'Checking AI availability...'
                    : 'AI services are currently unavailable'}
                </Typography>
              </Box>
              <Chip
                icon={aiStatus === 'checking' ? <CircularProgress size={16} /> : undefined}
                label={aiStatus === 'connected' ? 'Connected' : aiStatus === 'checking' ? 'Checking' : 'Unavailable'}
                color={aiStatus === 'connected' ? 'success' : aiStatus === 'checking' ? 'default' : 'error'}
                size="small"
              />
            </Box>
          </CardContent>
        </Card>
      </Paper>

      {/* Task Extraction Settings */}
      {settings && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <ExtractIcon sx={{ mr: 1 }} />
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
                    disabled={aiStatus !== 'connected'}
                  />
                }
                label="Auto-extract tasks from emails"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                Automatically detect and extract tasks when processing emails
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
                label="Review extracted tasks before saving"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                Show extracted tasks for approval before adding them to your task list
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.taskExtraction?.smartCategorization || true}
                    onChange={(e) => handleSettingChange('taskExtraction', 'smartCategorization', e.target.checked)}
                    disabled={aiStatus !== 'connected'}
                  />
                }
                label="Smart categorization"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                Automatically categorize extracted tasks based on content
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.taskExtraction?.priorityDetection || true}
                    onChange={(e) => handleSettingChange('taskExtraction', 'priorityDetection', e.target.checked)}
                    disabled={aiStatus !== 'connected'}
                  />
                }
                label="Priority detection"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                Automatically set task priority based on urgency indicators in emails
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Extraction Sensitivity
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={settings.taskExtraction?.sensitivity || 50}
                  onChange={(e, value) => handleSettingChange('taskExtraction', 'sensitivity', value)}
                  min={10}
                  max={90}
                  step={10}
                  marks={[
                    { value: 10, label: 'Conservative' },
                    { value: 50, label: 'Balanced' },
                    { value: 90, label: 'Aggressive' }
                  ]}
                  disabled={aiStatus !== 'connected'}
                />
                <Typography variant="caption" color="text.secondary">
                  Conservative: Only extract obvious tasks | Aggressive: Extract potential tasks
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Exclude Terms (comma-separated)"
                value={settings.taskExtraction?.excludeTerms?.join(', ') || ''}
                onChange={(e) => handleArrayChange('taskExtraction', 'excludeTerms', e.target.value)}
                helperText="Emails containing these terms will not be processed for task extraction"
                placeholder="newsletter, unsubscribe, automated, noreply"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Required Keywords (comma-separated)"
                value={settings.taskExtraction?.requiredKeywords?.join(', ') || ''}
                onChange={(e) => handleArrayChange('taskExtraction', 'requiredKeywords', e.target.value)}
                helperText="Only extract tasks from emails containing at least one of these keywords (leave empty to process all emails)"
                placeholder="action, task, todo, deadline, urgent"
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Follow-up Detection Settings */}
      {settings && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <AutoIcon sx={{ mr: 1 }} />
            Follow-up Detection Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.followUps?.autoDetect || false}
                    onChange={(e) => handleSettingChange('followUps', 'autoDetect', e.target.checked)}
                    disabled={aiStatus !== 'connected'}
                  />
                }
                label="Auto-detect follow-up needs"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                Automatically detect when emails require follow-up actions
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Default Reminder Days"
                value={settings.followUps?.defaultReminderDays || 3}
                onChange={(e) => handleSettingChange('followUps', 'defaultReminderDays', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 30 }}
                helperText="Days after email date to set follow-up reminder"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Default Priority</InputLabel>
                <Select
                  value={settings.followUps?.defaultPriority || 'medium'}
                  onChange={(e) => handleSettingChange('followUps', 'defaultPriority', e.target.value)}
                  label="Default Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
                <FormHelperText>Default priority for auto-detected follow-ups</FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.followUps?.smartScheduling || true}
                    onChange={(e) => handleSettingChange('followUps', 'smartScheduling', e.target.checked)}
                    disabled={aiStatus !== 'connected'}
                  />
                }
                label="Smart scheduling"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                Automatically adjust follow-up dates based on email content and urgency
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Performance Settings */}
      {settings && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <SpeedIcon sx={{ mr: 1 }} />
            Performance Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Batch Size"
                value={settings.taskExtraction?.batchSize || 10}
                onChange={(e) => handleSettingChange('taskExtraction', 'batchSize', parseInt(e.target.value))}
                inputProps={{ min: 1, max: 50 }}
                helperText="Number of emails to process at once"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Processing Delay (seconds)"
                value={settings.taskExtraction?.processingDelay || 2}
                onChange={(e) => handleSettingChange('taskExtraction', 'processingDelay', parseInt(e.target.value))}
                inputProps={{ min: 0, max: 30 }}
                helperText="Delay between processing batches to avoid rate limits"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.taskExtraction?.enableCaching || true}
                    onChange={(e) => handleSettingChange('taskExtraction', 'enableCaching', e.target.checked)}
                  />
                }
                label="Enable result caching"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                Cache extraction results to avoid reprocessing the same emails
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Privacy & Security */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ mr: 1 }} />
          Privacy & Security
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Your email content is processed securely and only the extracted task information is stored. 
            Original email content is never permanently stored in our systems.
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.taskExtraction?.anonymizeData || true}
                  onChange={(e) => handleSettingChange('taskExtraction', 'anonymizeData', e.target.checked)}
                />
              }
              label="Anonymize personal data"
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
              Remove or mask personal information from extracted tasks
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.taskExtraction?.logProcessing || false}
                  onChange={(e) => handleSettingChange('taskExtraction', 'logProcessing', e.target.checked)}
                />
              }
              label="Enable processing logs"
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
              Keep logs of extraction operations for debugging (may impact privacy)
            </Typography>
          </Grid>
        </Grid>
      </Paper>

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

export default TaskExtractionSettings;
