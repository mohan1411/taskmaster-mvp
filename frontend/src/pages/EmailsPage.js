import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress, 
  Alert,
  Card,
  CardContent,
  Grid,
  Fab
} from '@mui/material';
import { 
  Email as EmailIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import GmailConnect from '../components/emails/GmailConnect';
import EmailList from '../components/emails/EmailList';
import EmailDetail from '../components/emails/EmailDetail';
import emailService from '../services/emailService';
import '../styles/GlobalPages.css';

const EmailsPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailStats, setEmailStats] = useState({
    total: 0,
    unread: 0,
    synced: 0
  });

  // Check connection status and load emails on mount
  useEffect(() => {
    checkConnectionAndLoadEmails();
  }, []);

  const checkConnectionAndLoadEmails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check Gmail connection
      try {
        const { connected } = await emailService.checkGmailConnection();
        setIsConnected(connected);
      } catch (err) {
        console.log('Gmail not connected, will show local emails');
        setIsConnected(false);
      }

      // Always load emails (both Gmail and local emails)
      await loadEmails();
    } catch (err) {
      console.error('Error checking connection:', err);
      setError('Failed to check Gmail connection');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmails = async () => {
    try {
      const emailData = await emailService.getEmails({ limit: 50 });
      setEmails(emailData.emails || []);
      setEmailStats({
        total: emailData.total || 0,
        unread: emailData.emails?.filter(email => !email.isRead).length || 0,
        synced: emailData.emails?.length || 0
      });
    } catch (err) {
      console.error('Error loading emails:', err);
      setError('Failed to load emails');
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setError(null);

      const result = await emailService.syncEmails();
      
      // Reload emails after sync
      await loadEmails();
      
      // Show success message
      if (result.syncedEmails && result.syncedEmails.length > 0) {
        setError(`✅ Successfully synced ${result.syncedEmails.length} new emails!`);
      } else {
        setError(`ℹ️ Sync completed. ${result.message || 'No new emails found.'}`);
      }
    } catch (err) {
      console.error('Error syncing emails:', err);
      setError('❌ Failed to sync emails. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectionChange = (connected) => {
    setIsConnected(connected);
    if (connected) {
      loadEmails();
    } else {
      setEmails([]);
      setEmailStats({ total: 0, unread: 0, synced: 0 });
    }
  };

  const handleExtractTasks = async (email) => {
    try {
      setError(null);
      console.log('Extracting tasks for email:', email._id);
      
      const result = await emailService.extractTasksFromEmail(email._id);
      console.log('Extract tasks result:', result);
      
      // Show success message
      if (result.extractedTasks && result.extractedTasks.length > 0) {
        setError(`✅ Extracted ${result.extractedTasks.length} tasks from email!`);
      } else {
        setError(`ℹ️ Task extraction completed. ${result.message || 'No tasks found in this email.'}`);
      }
      
      // Reload emails to update extraction status
      await loadEmails();
    } catch (err) {
      console.error('Error extracting tasks:', err);
      setError(`❌ Failed to extract tasks: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDetectFollowUp = async (email) => {
    try {
      setError(null);
      console.log('Detecting follow-up for email:', email._id);
      
      const result = await emailService.detectFollowUp(email._id);
      console.log('Detect follow-up result:', result);
      
      // Show result message
      if (result.needsFollowUp) {
        setError(`✅ Follow-up detected! Due date: ${result.suggestedDate}`);
      } else {
        setError(`ℹ️ Follow-up detection completed. ${result.message || 'No follow-up needed for this email.'}`);
      }
      
      // Reload emails to update follow-up status
      await loadEmails();
    } catch (err) {
      console.error('Error detecting follow-up:', err);
      setError(`❌ Failed to detect follow-up: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
  };

  const handleCloseEmailDetail = () => {
    setSelectedEmail(null);
  };

  const handleRefresh = () => {
    loadEmails();
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Emails
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your Gmail integration and extract tasks from emails.
            </Typography>
          </Box>
          
          {isConnected && (
            <Fab
              color="primary"
              variant="extended"
              onClick={handleSync}
              disabled={isSyncing}
              sx={{ minWidth: 120 }}
            >
              {isSyncing ? (
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
              ) : (
                <SyncIcon sx={{ mr: 1 }} />
              )}
              {isSyncing ? 'Syncing...' : 'Sync Emails'}
            </Fab>
          )}
        </Box>

        {error && (
          <Alert 
            severity={
              error.includes('✅') ? 'success' : 
              error.includes('ℹ️') ? 'info' : 'error'
            } 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
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
              onConnectionChange={handleConnectionChange}
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
              <>
                {/* Email Stats */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary.main">
                          {emailStats.synced}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Synced Emails
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {emailStats.unread}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Unread Emails
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {emailStats.total}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Emails
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Use EmailList component for displaying emails */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={selectedEmail ? 6 : 12}>
                    <EmailList
                      emails={emails}
                      loading={isLoading}
                      error={null}
                      onRefresh={handleRefresh}
                      onSelectEmail={handleSelectEmail}
                      onExtractTasks={handleExtractTasks}
                      onDetectFollowUp={handleDetectFollowUp}
                    />
                  </Grid>
                  
                  {selectedEmail && (
                    <Grid item xs={12} md={6}>
                      <EmailDetail
                        email={selectedEmail}
                        onClose={handleCloseEmailDetail}
                        onRefresh={handleRefresh}
                      />
                    </Grid>
                  )}
                </Grid>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EmailsPage;
