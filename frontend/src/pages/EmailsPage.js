import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Button, 
  CircularProgress, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  Pagination,
  IconButton,
  Grid
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Label as LabelIcon,
  Task as TaskIcon,
  Sync as SyncIcon,
  ErrorOutline as ErrorIcon,
  Info as InfoIcon,
  NotificationsActive as FollowUpIcon
} from '@mui/icons-material';
import GmailConnect from '../components/emails/GmailConnect';
import EmailDetail from '../components/emails/EmailDetail';
import emailService from '../services/emailService';
import taskService from '../services/taskService';
import followupService from '../services/followupService';

const EmailsPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [emails, setEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [extractedTasks, setExtractedTasks] = useState([]);
  const [currentEmailId, setCurrentEmailId] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    isRead: undefined,
    labels: [],
    page: 1,
    limit: 10
  });
  const [selectedEmail, setSelectedEmail] = useState(null);

  // Check connection status on mount
  useEffect(() => {
    const initializeEmails = async () => {
      await checkConnectionStatus();
    };
    
    initializeEmails();
  }, []);

  // Fetch emails when connection status or filters change
  useEffect(() => {
    if (isConnected) {
      fetchEmails();
      
      // Auto-sync emails if no emails are loaded yet
      if (emails.length === 0 && !isSyncing) {
        handleSyncEmails();
      }
    }
  }, [isConnected, filters]);

  // Handle Gmail connection status change
  const handleConnectionChange = (connected, refreshed = false) => {
    setIsConnected(connected);
    if (connected && refreshed) {
      // Token was refreshed, we should fetch emails again
      fetchEmails();
    }
  };

  // Check Gmail connection status
  const checkConnectionStatus = async () => {
    try {
      const { connected } = await emailService.checkGmailConnection();
      setIsConnected(connected);
    } catch (err) {
      console.error('Error checking connection status:', err);
      setError('Failed to check connection status. Please try again.');
    }
  };

  // Fetch emails from the server
  const fetchEmails = async () => {
    if (!isConnected) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await emailService.getEmails(filters);
      setEmails(response.emails || []);
      setTotalPages(response.pages || 1);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError('Failed to fetch emails. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync emails from Gmail
  const handleSyncEmails = async () => {
    if (!isConnected) return;

    try {
      setIsSyncing(true);
      setError(null);
      
      const response = await emailService.syncEmails();
      
      // Show success message or notification here
      
      // Refresh the email list after sync
      await fetchEmails();
    } catch (err) {
      console.error('Error syncing emails:', err);
      setError('Failed to sync emails from Gmail. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
    setFilters(prev => ({ ...prev, page: value }));
  };

  // Handle search
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setFilters(prev => ({ 
        ...prev, 
        search: searchTerm,
        page: 1 
      }));
    }
  };


// Extract tasks from email with detailed debugging
const handleExtractTasks = async (emailId) => {
  try {
    setIsLoading(true);
    setError(null);
    
    console.log('Starting task extraction for email:', emailId);
    
    // Make the API call with detailed logging
    try {
      console.log('Calling API to extract tasks...');
      const response = await emailService.extractTasksFromEmail(emailId);
      console.log('API response received:', response);
      
      if (response && response.alreadyExtracted) {
        console.log('Tasks were already extracted:', response.extractedTasks);
        alert(`This email already has ${response.extractedTasks.length} tasks extracted.`);
        
        // Refresh the email list to ensure badges are updated
        await fetchEmails();
      } else if (response && response.extractedTasks && response.extractedTasks.length > 0) {
        console.log('Successfully extracted tasks:', response.extractedTasks);
        
        // Save the extracted tasks
        try {
          console.log('Saving tasks to database...');
          const saveResult = await taskService.saveExtractedTasks(response.extractedTasks, emailId);
          console.log('Save result:', saveResult);
          
          // Check if the save result indicates tasks were already extracted
          if (saveResult && saveResult.alreadyExtracted) {
            alert(`This email already has ${saveResult.tasks.length} tasks extracted.`);
          } else {
            alert(`Successfully extracted ${response.extractedTasks.length} tasks!`);
          }
          
          // Refresh the email list to show updated badges
          await fetchEmails();
        } catch (saveError) {
          console.error('Error saving tasks:', saveError);
          setError('Tasks were extracted but could not be saved. Please try again.');
        }
      } else {
        console.log('No tasks found in response:', response);
        setError('No tasks found in this email.');
      }
    } catch (apiError) {
      console.error('API error details:', apiError);
      
      // Log the full error response if available
      if (apiError.response) {
        console.error('API error status:', apiError.response.status);
        console.error('API error data:', apiError.response.data);
      }
      
      setError('Failed to extract tasks from email. Please try again.');
    }
  } catch (err) {
    console.error('Unexpected error in task extraction:', err);
    setError('An unexpected error occurred. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

// Detect follow-up needs in email
const handleDetectFollowUp = async (emailId) => {
  try {
    setIsLoading(true);
    setError(null);
    
    console.log('Starting follow-up detection for email:', emailId);
    
    const response = await followupService.detectFollowUp(emailId);
    console.log('Follow-up detection response:', response);
    
    if (response.needsFollowUp) {
      alert(`Follow-up needed! Reason: ${response.reason}\nDue date: ${new Date(response.suggestedDate).toLocaleDateString()}`);
    } else {
      alert('No follow-up needed for this email.');
    }
    
    // Refresh emails to show updated status
    await fetchEmails();
  } catch (err) {
    console.error('Error detecting follow-up:', err);
    setError('Failed to detect follow-up needs. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Add function to handle email selection
  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
  };

  // Add function to handle email detail close
  const handleCloseEmailDetail = () => {
    setSelectedEmail(null);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Emails
        </Typography>
        
        {/* Gmail Connection */}
        <GmailConnect 
          onConnected={(refreshed) => handleConnectionChange(true, refreshed)} 
          onDisconnected={() => handleConnectionChange(false)} 
        />
        
        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {isConnected && (
          <>
            {/* Email actions */}
            <Box sx={{ mt: 3, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <TextField
                placeholder="Search emails..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: '300px' }}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<SyncIcon />}
                onClick={handleSyncEmails}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    Syncing Emails...
                  </>
                ) : (
                  'Sync Emails from Gmail'
                )}
              </Button>
            </Box>

            {/* Email List and Detail */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={selectedEmail ? 6 : 12}>
                <Paper sx={{ p: 3 }}>
                  {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : emails.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No emails found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try syncing your emails or adjusting your search filters
                  </Typography>
                </Box>
              ) : (
                <>
                  <List sx={{ width: '100%' }}>
                    {emails.map((email) => (
                      <React.Fragment key={email._id}>
                        <ListItem 
                          alignItems="flex-start" 
                          onClick={() => handleSelectEmail(email)}
                          sx={{ 
                            cursor: 'pointer',
                            bgcolor: email.isRead ? 'inherit' : 'rgba(25, 118, 210, 0.08)',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar alt={email.sender.name || 'Unknown'} src="/static/images/avatar/1.jpg" />
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography
                                  component="span"
                                  variant="subtitle1"
                                  fontWeight={email.isRead ? 'normal' : 'bold'}
                                >
                                  {email.subject || '(No Subject)'}
                                </Typography>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {formatDate(email.receivedAt)}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.primary"
                                >
                                  {email.sender.name} ({email.sender.email})
                                </Typography>
                                <Typography
                                  component="p"
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mt: 0.5 }}
                                >
                                  {email.snippet}
                                </Typography>
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                                  {email.labels.map((label) => (
                                    <Chip
                                      key={label}
                                      label={label.replace('CATEGORY_', '')}
                                      size="small"
                                      icon={<LabelIcon />}
                                      variant="outlined"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                  ))}
                                  
                                  {email.taskExtracted && (
                                    <Chip
                                      icon={<TaskIcon />}
                                      label="Tasks Extracted"
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                      title="This email has tasks extracted that are in your task list"
                                    />
                                  )}
                                  
                                  
                                  {email.needsFollowUp && (
                                    <Chip
                                      icon={<FollowUpIcon />}
                                      label="Needs Follow-up"
                                      size="small"
                                      color="warning"
                                      variant="outlined"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                      title="This email requires a follow-up response"
                                    />
                                  )}
                                  
                                  {email.taskExtracted && email.needsFollowUp && (
                                    <Chip
                                      icon={<InfoIcon />}
                                      label="Multiple Actions"
                                      size="small"
                                      color="success"
                                      variant="outlined"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                      title="This email requires both tasks and follow-up"
                                    />
                                  )}
                                  
                                  <Box sx={{ flexGrow: 1 }} />
                                  
                                  <IconButton 
                                    color="primary" 
                                    size="small"
                                    onClick={() => handleExtractTasks(email._id)}
                                    title="Extract actionable tasks from this email content and add them to your task list"
                                    disabled={email.taskExtracted}
                                  >
                                    <TaskIcon />
                                  </IconButton>
                                  
                                  <IconButton 
                                    color="warning" 
                                    size="small"
                                    onClick={() => handleDetectFollowUp(email._id)}
                                    title="Analyze if this email requires a follow-up response"
                                    disabled={email.needsFollowUp}
                                  >
                                    <FollowUpIcon />
                                  </IconButton>
                                </Box>
                              </>
                            }
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                  
                  {/* Pagination */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                    />
                  </Box>
                </>
              )}
                </Paper>
              </Grid>
              
              {/* Email Detail Panel */}
              {selectedEmail && (
                <Grid item xs={12} md={6}>
                  <EmailDetail 
                    email={selectedEmail} 
                    onClose={handleCloseEmailDetail}
                    onRefresh={fetchEmails}
                  />
                </Grid>
              )}
            </Grid>
          </>
        )}
        
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
      </Box>
    </Container>
  );
};

export default EmailsPage;
