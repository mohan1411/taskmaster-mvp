import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import emailService from '../../services/emailService';

const GmailCallback = () => {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Process the OAuth callback on component mount
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from the URL query parameters
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        
        if (!code) {
          setError('No authorization code received from Google.');
          setStatus('error');
          return;
        }
        
        // Connect Gmail with the authorization code
        console.log('Connecting Gmail with authorization code...');
        await emailService.connectGmail(code);
        
        // Now immediately sync emails to populate the inbox
        console.log('Syncing emails after connection...');
        try {
          await emailService.syncEmails();
          console.log('Email sync completed successfully');
        } catch (syncError) {
          console.error('Error syncing emails:', syncError);
          // Continue even if sync fails - at least the connection was successful
        }
        
        setStatus('success');
        
        // Redirect to emails page after successful connection
        // Do this immediately rather than with a delay
        console.log('Redirecting to emails page...');
        navigate('/emails', { replace: true });
      } catch (err) {
        console.error('Error processing Gmail callback:', err);
        setError('Failed to connect your Gmail account. Please try again.');
        setStatus('error');
        
        // Redirect to emails page even on error after a short delay
        setTimeout(() => {
          navigate('/emails');
        }, 3000);
      }
    };
    
    handleCallback();
  }, [location, navigate]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      p: 2
    }}>
      <Paper sx={{ maxWidth: 500, width: '100%', p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Gmail Connection
        </Typography>
        
        {status === 'processing' && (
          <>
            <CircularProgress sx={{ my: 3 }} />
            <Typography>
              Connecting your Gmail account and syncing emails...
            </Typography>
          </>
        )}
        
        {status === 'success' && (
          <>
            <Alert severity="success" sx={{ my: 3 }}>
              Gmail account connected successfully!
            </Alert>
            <Typography>
              Redirecting to your emails...
            </Typography>
          </>
        )}
        
        {status === 'error' && (
          <>
            <Alert severity="error" sx={{ my: 3 }}>
              {error || 'An error occurred during Gmail connection.'}
            </Alert>
            <Typography>
              Redirecting to emails page...
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default GmailCallback;
