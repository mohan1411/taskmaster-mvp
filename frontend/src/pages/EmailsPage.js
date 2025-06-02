import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Button, 
  CircularProgress, 
  Alert
} from '@mui/material';
import { 
  Email as EmailIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import GmailConnect from '../components/emails/GmailConnect';
import '../styles/GlobalPages.css';

const EmailsPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check connection status on mount
  useEffect(() => {
    // Simple connection check
    setIsLoading(false);
  }, []);

  return (
    <div className="page-container">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Emails
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage your Gmail integration and extract tasks from emails.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <GmailConnect 
              onConnectionChange={(connected) => setIsConnected(connected)}
            />
            
            {!isConnected && (
              <Paper sx={{ p: 3, mt: 3, textAlign: 'center' }}>
                <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Connect your Gmail account to get started
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Once connected, you'll be able to sync your emails, extract tasks, and manage follow-ups.
                </Typography>
              </Paper>
            )}

            {isConnected && (
              <Paper sx={{ p: 3, mt: 3, textAlign: 'center' }}>
                <SyncIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Gmail Connected Successfully
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Your Gmail account is connected. Email features will be available soon.
                </Typography>
              </Paper>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default EmailsPage;
