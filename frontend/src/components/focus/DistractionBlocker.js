import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Collapse,
  Divider
} from '@mui/material';
import {
  Block,
  NotificationsOff,
  NotificationsActive,
  Add,
  Delete,
  Warning,
  EmergencyShare,
  Web,
  Timer,
  TrendingUp
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import distractionService from '../../services/distractionService';

const DistractionBlocker = ({ isActive, onSettingsChange }) => {
  const theme = useTheme();
  const [settings, setSettings] = useState({
    blockNotifications: true,
    blockSites: true,
    showReminders: true,
    strictMode: false
  });
  
  const [customSites, setCustomSites] = useState([]);
  const [newSite, setNewSite] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [newContact, setNewContact] = useState('');
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [blockingStatus, setBlockingStatus] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isActive) {
      startBlocking();
    } else {
      stopBlocking();
    }
  }, [isActive, settings]);

  const startBlocking = async () => {
    const status = await distractionService.startBlocking({
      blockNotifications: settings.blockNotifications,
      blockSites: settings.blockSites,
      emergencyContacts,
      customSites
    });
    setBlockingStatus(status);
  };

  const stopBlocking = async () => {
    const result = await distractionService.stopBlocking();
    setBlockingStatus(null);
    
    // Show summary of blocked notifications
    if (result.queuedNotifications.length > 0) {
      // Handle queued notifications
      console.log(`${result.queuedNotifications.length} notifications were blocked`);
    }
  };

  const handleSettingChange = (setting) => (event) => {
    const newSettings = {
      ...settings,
      [setting]: event.target.checked
    };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const addCustomSite = () => {
    if (newSite && !customSites.includes(newSite)) {
      const site = newSite.replace(/^https?:\/\//, '').replace(/\/$/, '');
      setCustomSites([...customSites, site]);
      distractionService.addBlockedSite(site);
      setNewSite('');
    }
  };

  const removeCustomSite = (site) => {
    setCustomSites(customSites.filter(s => s !== site));
    distractionService.removeBlockedSite(site);
  };

  const addEmergencyContact = () => {
    if (newContact && !emergencyContacts.includes(newContact)) {
      setEmergencyContacts([...emergencyContacts, newContact]);
      setNewContact('');
    }
  };

  const removeEmergencyContact = (contact) => {
    setEmergencyContacts(emergencyContacts.filter(c => c !== contact));
  };

  const handleEmergencyOverride = () => {
    distractionService.emergencyOverride();
    setShowEmergencyDialog(false);
  };

  const defaultBlockedSites = [
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'reddit.com',
    'youtube.com'
  ];

  return (
    <Card 
      sx={{ 
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(145deg, #1e1e1e 0%, #2d2d2d 100%)'
          : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
        boxShadow: theme.shadows[4]
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Block sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Distraction Blocking
          </Typography>
          {isActive && (
            <Chip 
              label="Active" 
              color="success" 
              size="small"
              icon={<Timer />}
            />
          )}
        </Box>

        {/* Quick Settings */}
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.blockNotifications}
                onChange={handleSettingChange('blockNotifications')}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <NotificationsOff sx={{ mr: 1, fontSize: 20 }} />
                Block Notifications
              </Box>
            }
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
            Pauses all browser notifications during focus sessions
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.blockSites}
                onChange={handleSettingChange('blockSites')}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Web sx={{ mr: 1, fontSize: 20 }} />
                Block Distracting Sites
              </Box>
            }
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
            Warns when visiting social media and entertainment sites
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.strictMode}
                onChange={handleSettingChange('strictMode')}
                color="error"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning sx={{ mr: 1, fontSize: 20 }} />
                Strict Mode
              </Box>
            }
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
            Blocks all notifications except emergencies
          </Typography>
        </Box>

        {/* Advanced Settings */}
        <Button
          size="small"
          onClick={() => setShowAdvanced(!showAdvanced)}
          sx={{ mb: 2 }}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </Button>

        <Collapse in={showAdvanced}>
          <Divider sx={{ my: 2 }} />
          
          {/* Emergency Contacts */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Emergency Contacts
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Notifications from these contacts will always come through
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                placeholder="Add contact name"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addEmergencyContact()}
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={addEmergencyContact}
                disabled={!newContact}
              >
                Add
              </Button>
            </Box>
            
            <List dense>
              {emergencyContacts.map((contact) => (
                <ListItem key={contact}>
                  <ListItemText primary={contact} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small" onClick={() => removeEmergencyContact(contact)}>
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Custom Blocked Sites */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Custom Blocked Sites
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Add specific sites to block during focus sessions
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                placeholder="example.com"
                value={newSite}
                onChange={(e) => setNewSite(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomSite()}
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={addCustomSite}
                disabled={!newSite}
              >
                Add
              </Button>
            </Box>
            
            <List dense>
              {customSites.map((site) => (
                <ListItem key={site}>
                  <ListItemText primary={site} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" size="small" onClick={() => removeCustomSite(site)}>
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            
            <Typography variant="caption" color="text.secondary">
              Default blocked: {defaultBlockedSites.join(', ')}
            </Typography>
          </Box>
        </Collapse>

        {/* Status Display */}
        {isActive && blockingStatus && (
          <Alert 
            severity="info" 
            sx={{ mt: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                startIcon={<EmergencyShare />}
                onClick={() => setShowEmergencyDialog(true)}
              >
                Emergency
              </Button>
            }
          >
            Distraction blocking is active. {blockingStatus.blockedNotifications > 0 && 
              `${blockingStatus.blockedNotifications} notifications blocked.`}
          </Alert>
        )}

        {/* Emergency Override Dialog */}
        <Dialog open={showEmergencyDialog} onClose={() => setShowEmergencyDialog(false)}>
          <DialogTitle>Emergency Override</DialogTitle>
          <DialogContent>
            <Typography>
              This will disable all distraction blocking and end your focus session.
              Use this only for genuine emergencies.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEmergencyDialog(false)}>
              Cancel
            </Button>
            <Button 
              color="error" 
              variant="contained"
              onClick={handleEmergencyOverride}
            >
              Emergency Override
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DistractionBlocker;