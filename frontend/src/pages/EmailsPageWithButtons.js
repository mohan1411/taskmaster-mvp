import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Button, 
  CircularProgress, 
  Alert,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Fab,
  Tooltip
} from '@mui/material';
import { 
  Email as EmailIcon,
  Sync as SyncIcon,
  Refresh as RefreshIcon,
  TaskAlt as TaskAltIcon,
  ReplyAll as FollowUpIcon
} from '@mui/icons-material';
import GmailConnect from '../components/emails/GmailConnect';
import emailService from '../services/emailService';
import '../styles/GlobalPages.css';

const EmailsPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [emails, setEmails] = useState([]);
  const [processingEmails, setProcessingEmails] = useState(new Set());
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
      const { connected } = await emailService.checkGmailConnection();
      setIsConnected(connected);

      if (connected) {
        // Load emails if connected
        await loadEmails();
      }
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

  const extractTasks = async (emailId) => {
    try {
      setProcessingEmails(prev => new Set(prev).add(emailId));
      
      const result = await emailService.extractTasksFromEmail(emailId);
      
      // Show success message
      if (result.extractedTasks && result.extractedTasks.length > 0) {
        setError(`✅ Extracted ${result.extractedTasks.length} tasks from email!`);
      } else {
        setError(`ℹ️ No tasks found in this email.`);
      }
      
      // Reload emails to update extraction status
      await loadEmails();
    } catch (err) {
      console.error('Error extracting tasks:', err);
      setError(`❌ Failed to extract tasks: ${err.response?.data?.message || err.message}`);
    } finally {
      setProcessingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(emailId);
        return newSet;
      });
    }
  };

  const detectFollowUp = async (emailId) => {
    try {
      setProcessingEmails(prev => new Set(prev).add(emailId));
      
      const result = await emailService.detectFollowUp(emailId);
      
      // Show result message
      if (result.needsFollowUp) {
        setError(`✅ Follow-up detected! Due date: ${result.suggestedDate}`);
      } else {
        setError(`ℹ️ No follow-up needed for this email.`);
      }
      
      // Reload emails to update follow-up status
      await loadEmails();
    } catch (err) {
      console.error('Error detecting follow-up:', err);
      setError(`❌ Failed to detect follow-up: ${err.response?.data?.message || err.message}`);
    } finally {
      setProcessingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(emailId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="page-container">
      <Container maxWidth="lg" sx={{ py: 4 }}>
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
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setError(null)}
              >
                ×
              </IconButton>
            }
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

                {/* Email List */}
                {emails.length === 0 ? (
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      No emails found
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      Click "Sync Emails" to fetch your recent emails from Gmail.
                    </Typography>
                    <Button 
                      variant="contained" 
                      onClick={handleSync} 
                      disabled={isSyncing}
                      startIcon={<SyncIcon />}
                    >
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                  </Paper>
                ) : (
                  <Paper sx={{ p: 0 }}>
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">
                        Recent Emails ({emails.length})
                      </Typography>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={loadEmails}
                        startIcon={<RefreshIcon />}
                      >
                        Refresh
                      </Button>
                    </Box>
                    
                    {emails.map((email, index) => (
                      <Box key={email._id}>
                        <Box sx={{ p: 2, '&:hover': { bgcolor: 'action.hover' } }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {!email.isRead && (
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      bgcolor: 'primary.main',
                                      mr: 1
                                    }}
                                  />
                                )}
                                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>
                                  {email.sender.name || email.sender.email}
                                </Typography>
                              </Box>
                              <Typography variant="body1" fontWeight={email.isRead ? 'normal' : 'bold'} noWrap>
                                {email.subject}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {email.snippet}
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={12} md={3}>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {email.taskExtracted && (
                                  <Chip 
                                    label="Tasks Extracted" 
                                    color="success" 
                                    size="small"
                                    icon={<TaskAltIcon />}
                                  />
                                )}
                                {email.needsFollowUp && (
                                  <Chip 
                                    label="Follow-up Needed" 
                                    color="warning" 
                                    size="small"
                                    icon={<FollowUpIcon />}
                                  />
                                )}
                              </Box>
                            </Grid>
                            
                            <Grid item xs={12} md={3}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(email.receivedAt)}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title={email.taskExtracted ? "Tasks already extracted" : "Extract tasks from this email"}>
                                    <span>
                                      <IconButton 
                                        size="small" 
                                        onClick={() => extractTasks(email._id)}
                                        disabled={processingEmails.has(email._id)}
                                        color={email.taskExtracted ? "success" : "default"}
                                      >
                                        {processingEmails.has(email._id) ? (
                                          <CircularProgress size={16} />
                                        ) : (
                                          <TaskAltIcon />
                                        )}
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  
                                  <Tooltip title={email.needsFollowUp ? "Follow-up already detected" : "Detect if follow-up is needed"}>
                                    <span>
                                      <IconButton 
                                        size="small" 
                                        onClick={() => detectFollowUp(email._id)}
                                        disabled={processingEmails.has(email._id)}
                                        color={email.needsFollowUp ? "warning" : "default"}
                                      >
                                        {processingEmails.has(email._id) ? (
                                          <CircularProgress size={16} />
                                        ) : (
                                          <FollowUpIcon />
                                        )}
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                        
                        {index < emails.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </Paper>
                )}
              </>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default EmailsPage;
