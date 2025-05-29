import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import emailService from '../services/emailService';

const GmailCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract authorization code from URL
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          setError(`OAuth error: ${error}`);
          setLoading(false);
          return;
        }

        if (!code) {
          setError('No authorization code received');
          setLoading(false);
          return;
        }

        // Send code to backend
        await emailService.connectGmail(code);

        // Redirect to emails page
        navigate('/emails', { 
          state: { message: 'Gmail connected successfully!' }
        });
      } catch (err) {
        console.error('Error connecting Gmail:', err);
        setError('Failed to connect Gmail account. Please try again.');
        setLoading(false);
      }
    };

    handleCallback();
  }, [location, navigate]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center'
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Connecting your Gmail account...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This should only take a moment
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        p: 3
      }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body1" color="text.secondary">
          You can close this window and try connecting again.
        </Typography>
      </Box>
    );
  }

  return null;
};

export default GmailCallbackPage;
