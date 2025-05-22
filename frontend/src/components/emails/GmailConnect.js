import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import {
  Mail as MailIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon
} from '@mui/icons-material';
import emailService from '../../services/emailService';

const GmailConnect = ({ onConnected, onDisconnected }) => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [authUrl, setAuthUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check connection status on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Check Gmail connection status
  const checkConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setConnectionStatus('checking');
      
      const { connected, refreshed } = await emailService.checkGmailConnection();
      
      setConnectionStatus(connected ? 'connected' : 'disconnected');
      
      if (connected && onConnected) {
        onConnected(refreshed);
      }
    } catch (err) {
      console.error('Error checking Gmail connection:', err);
      setError('Failed to check Gmail connection status. Please try again.');
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Get Gmail auth URL
  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { authUrl } = await emailService.getGmailAuthUrl();
      
      // Instead of opening in a new window, redirect the current window
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error getting Gmail auth URL:', err);
      setError('Failed to generate authorization URL. Please try again.');
      setIsLoading(false);
    }
  };

  // Disconnect Gmail
  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await emailService.disconnectGmail();
      
      setConnectionStatus('disconnected');
      
      if (onDisconnected) {
        onDisconnected();
      }
    } catch (err) {
      console.error('Error disconnecting Gmail:', err);
      setError('Failed to disconnect Gmail. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful OAuth callback (called by parent after URL redirect)
  const handleAuthCallback = async (authCode) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await emailService.connectGmail(authCode);
      
      setConnectionStatus('connected');
      
      if (onConnected) {
        onConnected(false);
      }
    } catch (err) {
      console.error('Error connecting Gmail:', err);
      setError('Failed to connect Gmail account. Please try again.');
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <MailIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6">
          Gmail Integration
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Connection status */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Connection Status:
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {connectionStatus === 'checking' || isLoading ? (
            <CircularProgress size={16} sx={{ mr: 1 }} />
          ) : connectionStatus === 'connected' ? (
            <CheckCircleIcon color="success" sx={{ mr: 1 }} />
          ) : connectionStatus === 'error' ? (
            <ErrorIcon color="error" sx={{ mr: 1 }} />
          ) : (
            <LinkOffIcon color="action" sx={{ mr: 1 }} />
          )}
          
          <Chip 
            label={
              connectionStatus === 'checking' ? 'Checking...' :
              connectionStatus === 'connected' ? 'Connected' :
              connectionStatus === 'error' ? 'Connection Error' :
              'Disconnected'
            }
            color={
              connectionStatus === 'connected' ? 'success' :
              connectionStatus === 'error' ? 'error' :
              connectionStatus === 'checking' ? 'info' :
              'default'
            }
          />
          
          <Button 
            variant="text" 
            startIcon={<RefreshIcon />}
            onClick={checkConnection}
            disabled={isLoading}
            size="small"
            sx={{ ml: 2 }}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {/* Connection actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {connectionStatus === 'connected' ? (
          <Button
            variant="outlined"
            color="error"
            startIcon={<LinkOffIcon />}
            onClick={handleDisconnect}
            disabled={isLoading}
          >
            Disconnect Gmail
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            startIcon={<LinkIcon />}
            onClick={handleConnect}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Connect Gmail'}
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default GmailConnect;
