import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Divider,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  AttachFile as AttachmentIcon,
  Task as TaskIcon,
  NotificationsActive as FollowUpIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CustomDatePicker from '../common/CustomDatePicker';
import emailService from '../../services/emailService';
import followupService from '../../services/followupService';
import EmailAttachments from './EmailAttachments';

const EmailDetail = ({ email, onClose, onRefresh }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Loading states
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDetectingFollowUp, setIsDetectingFollowUp] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // State for task count
  const [taskCount, setTaskCount] = useState(0);
  
  // Follow-up dialog state
  const [openFollowUpDialog, setOpenFollowUpDialog] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    reason: '',
    keyPoints: [],
    priority: 'medium',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    notes: ''
  });
  const [newKeyPoint, setNewKeyPoint] = useState('');
  
  // Debug email data
  useEffect(() => {
    if (email) {
      console.log('Email Detail - Email data:', {
        id: email._id,
        subject: email.subject,
        hasAttachments: email.hasAttachments,
        attachments: email.attachments,
        attachmentCount: email.attachments?.length || 0
      });
    }
  }, [email]);

  // Get task count when email changes
  useEffect(() => {
    const fetchTaskCount = async () => {
      if (email && email.taskExtracted) {
        try {
          // Try to use the API endpoint if available
          try {
            const response = await fetch(`/api/tasks/count?emailSource=${email.messageId}`);
            const data = await response.json();
            setTaskCount(data.count || 0);
          } catch (apiError) {
            // If API is not yet implemented, use a default value
            console.log('Task count API not yet available, using default count');
            setTaskCount(3); // Default value until API is implemented
          }
        } catch (err) {
          console.error('Error fetching task count:', err);
          setTaskCount(0);
        }
      }
    };
    
    fetchTaskCount();
  }, [email]);

  // Extract tasks from email
  const handleExtractTasks = async () => {
    try {
      setIsExtracting(true);
      setError(null);
      setSuccess(null);
      
      const response = await emailService.extractTasksFromEmail(email._id);
      
      if (response.alreadyExtracted) {
        // Handle case where tasks were already extracted
        setSuccess(`This email already has ${response.extractedTasks.length} tasks extracted.`);
      } else if (response.extractedTasks && response.extractedTasks.length > 0) {
        setSuccess(`Successfully extracted ${response.extractedTasks.length} tasks!`);
        if (onRefresh) onRefresh();
      } else {
        setError('No tasks found in this email.');
      }
    } catch (err) {
      console.error('Error extracting tasks:', err);
      setError('Failed to extract tasks. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Detect follow-up needs
  const handleDetectFollowUp = async () => {
    try {
      setIsDetectingFollowUp(true);
      setError(null);
      setSuccess(null);
      
      const response = await followupService.detectFollowUp(email._id);
      
      if (response.needsFollowUp) {
        // Pre-fill follow-up dialog with AI suggestions
        setFollowUpData({
          reason: response.reason || '',
          keyPoints: response.keyPoints || [],
          priority: 'medium',
          dueDate: new Date(response.suggestedDate || Date.now() + 7 * 24 * 60 * 60 * 1000),
          notes: response.reason || ''
        });
        setOpenFollowUpDialog(true);
      } else {
        setError('No follow-up needed for this email based on AI analysis.');
      }
    } catch (err) {
      console.error('Error detecting follow-up:', err);
      setError('Failed to analyze email for follow-up. Please try again.');
    } finally {
      setIsDetectingFollowUp(false);
    }
  };

  // Manually create follow-up
  const handleCreateFollowUp = () => {
    setOpenFollowUpDialog(true);
  };

  // Save follow-up
  const handleSaveFollowUp = async () => {
    try {
      setError(null);
      
      const data = {
        emailId: email.messageId,
        threadId: email.threadId,
        subject: email.subject,
        contactName: email.sender.name,
        contactEmail: email.sender.email,
        priority: followUpData.priority,
        dueDate: followUpData.dueDate,
        notes: followUpData.notes,
        reason: followUpData.reason,
        keyPoints: followUpData.keyPoints
      };
      
      // Close the dialog immediately to improve perceived responsiveness
      setOpenFollowUpDialog(false);
      
      // Then make the API call
      await followupService.createFollowUp(data);
      
      // Show success message
      setSuccess('Follow-up created successfully!');
      
      // Refresh the UI if needed
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error creating follow-up:', err);
      setError('Failed to create follow-up. Please try again.');
    }
  };

  // Add key point
  const handleAddKeyPoint = () => {
    if (newKeyPoint.trim()) {
      setFollowUpData(prev => ({
        ...prev,
        keyPoints: [...prev.keyPoints, newKeyPoint.trim()]
      }));
      setNewKeyPoint('');
    }
  };

  // Remove key point
  const handleRemoveKeyPoint = (index) => {
    setFollowUpData(prev => ({
      ...prev,
      keyPoints: prev.keyPoints.filter((_, i) => i !== index)
    }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'PPpp');
  };

  if (!email) return null;

  return (
    <Paper sx={{ 
      height: { xs: 'auto', sm: '100%' }, 
      maxHeight: { xs: '100vh', sm: '100%' },
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden' 
    }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="h2">
            {email.subject || '(No Subject)'}
          </Typography>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{ 
              minWidth: { xs: 44, sm: 'auto' },
              minHeight: { xs: 44, sm: 'auto' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* Email metadata */}
        <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {email.sender.name} ({email.sender.email})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ScheduleIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {formatDate(email.receivedAt)}
            </Typography>
          </Box>
        </Stack>
        
        {/* Status indicators - Compact badges */}
        <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
          {!email.isRead && (
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                bgcolor: 'primary.main',
                alignSelf: 'center',
                mr: 1
              }} 
              title="Unread"
            />
          )}
          {email.hasAttachments && (
            <Chip 
              icon={<AttachmentIcon sx={{ fontSize: 14 }} />} 
              label="Files" 
              size="small" 
              sx={{
                height: { xs: 24, sm: 20 },
                fontSize: { xs: '0.8rem', sm: '0.75rem' },
                bgcolor: 'grey.100',
                color: 'grey.700',
                border: 'none',
                '& .MuiChip-icon': {
                  marginLeft: '4px',
                  marginRight: '-2px'
                }
              }}
            />
          )}
          {email.taskExtracted && (
            <Chip 
              icon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />} 
              label="Tasks Extracted" 
              size="small" 
              sx={{
                height: { xs: 24, sm: 20 },
                fontSize: { xs: '0.8rem', sm: '0.75rem' },
                bgcolor: 'success.50',
                color: 'success.700',
                border: 'none',
                '& .MuiChip-icon': {
                  color: 'success.600',
                  marginLeft: '4px',
                  marginRight: '-2px'
                }
              }}
              title="This email has tasks extracted that are in your task list"
            />
          )}
          {email.needsFollowUp && (
            <Chip 
              icon={<ScheduleIcon sx={{ fontSize: 14 }} />} 
              label="Follow-up" 
              size="small" 
              sx={{
                height: { xs: 24, sm: 20 },
                fontSize: { xs: '0.8rem', sm: '0.75rem' },
                bgcolor: 'warning.50',
                color: 'warning.700',
                border: 'none',
                '& .MuiChip-icon': {
                  color: 'warning.600',
                  marginLeft: '4px',
                  marginRight: '-2px'
                }
              }}
              title="This email requires a follow-up response"
            />
          )}
        </Stack>
      </Box>
      
      {/* Action buttons - Compact Style */}
      <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          <Button
            size="small"
            variant={email.taskExtracted ? "outlined" : "contained"}
            color={email.taskExtracted ? "success" : "primary"}
            startIcon={email.taskExtracted ? <CheckCircleOutlineIcon fontSize="small" /> : <TaskIcon fontSize="small" />}
            onClick={handleExtractTasks}
            disabled={isExtracting}
            sx={{
              px: { xs: 2.5, sm: 2 },
              py: { xs: 1, sm: 0.5 },
              fontSize: { xs: '0.875rem', sm: '0.813rem' },
              minHeight: { xs: 40, sm: 'auto' },
              textTransform: 'none',
              fontWeight: 500,
              ...(email.taskExtracted && {
                bgcolor: 'success.50',
                borderColor: 'success.main',
                color: 'success.dark',
                '&:hover': {
                  bgcolor: 'success.100',
                  borderColor: 'success.dark'
                }
              })
            }}
          >
            {isExtracting ? 'Extracting...' : email.taskExtracted ? 'Tasks Extracted' : 'Extract Tasks'}
          </Button>
          
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<FollowUpIcon fontSize="small" />}
            onClick={handleDetectFollowUp}
            disabled={isDetectingFollowUp || email.needsFollowUp}
            sx={{
              px: { xs: 2.5, sm: 2 },
              py: { xs: 1, sm: 0.5 },
              fontSize: { xs: '0.875rem', sm: '0.813rem' },
              minHeight: { xs: 40, sm: 'auto' },
              textTransform: 'none',
              fontWeight: 500,
              bgcolor: 'warning.50',
              borderColor: 'warning.main',
              color: 'warning.dark',
              '&:hover': {
                bgcolor: 'warning.100',
                borderColor: 'warning.dark'
              }
            }}
          >
            {isDetectingFollowUp ? 'Analyzing...' : 'Detect Follow-up'}
          </Button>
          
          {/* More actions menu */}
          <IconButton 
            size="small" 
            sx={{ 
              ml: 'auto',
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' }
            }}
            onClick={handleCreateFollowUp}
            title="More actions"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
      
      {/* Multiple Action Guidance */}
      {email.taskExtracted && email.needsFollowUp && (
        <Alert severity="info" sx={{ m: 2 }}>
          <AlertTitle>This email requires multiple actions</AlertTitle>
          <Typography variant="body2">
            <strong>• Tasks:</strong> {taskCount > 0 ? `${taskCount} tasks have been extracted and added to your task list` : 'Tasks have been extracted from this email'}
            <br />
            <strong>• Follow-up:</strong> This email needs a follow-up response {email.followUpDueDate ? `by ${format(new Date(email.followUpDueDate), 'MMM d, yyyy')}` : 'soon'}
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => setOpenFollowUpDialog(true)}
            >
              View Follow-up Details
            </Button>
          </Box>
        </Alert>
      )}
      
      {/* Loading indicators */}
      {(isExtracting || isDetectingFollowUp) && <LinearProgress />}
      
      {/* Error/Success messages */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ m: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {/* Email content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: { xs: 1.5, sm: 2 } }}>
        {/* Email Attachments */}
        {email.hasAttachments && (
          <>
            {/* Temporary debug info */}
            {(!email.attachments || email.attachments.length === 0) && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <AlertTitle>Attachment Data Missing</AlertTitle>
                This email has attachments but the details are not loaded. 
                Please click "Sync Emails" to refresh the attachment information.
              </Alert>
            )}
            
            {email.attachments && email.attachments.length > 0 && (
              <EmailAttachments 
                key={`${email._id}-${email.attachments.length}`}
                email={email} 
                onTasksExtracted={(result) => {
                  // Refresh the email list to show updated task status
                  if (onRefresh) onRefresh();
                }}
              />
            )}
          </>
        )}
        
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          {email.body || email.snippet || 'Loading email content...'}
        </Typography>
      </Box>
      
      {/* Follow-up dialog */}
      <Dialog 
        open={openFollowUpDialog} 
        onClose={() => setOpenFollowUpDialog(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Create Follow-up</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Reason for Follow-up"
              fullWidth
              value={followUpData.reason}
              onChange={(e) => setFollowUpData(prev => ({ ...prev, reason: e.target.value }))}
              multiline
              rows={2}
            />
            
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={followUpData.priority}
                label="Priority"
                onChange={(e) => setFollowUpData(prev => ({ ...prev, priority: e.target.value }))}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <CustomDatePicker
                label="Due Date"
                value={followUpData.dueDate}
                onChange={(date) => setFollowUpData(prev => ({ ...prev, dueDate: date }))}
                fullWidth
              />
            </LocalizationProvider>
            
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Key Points to Address
              </Typography>
              <Box sx={{ display: 'flex', mb: 1 }}>
                <TextField
                  label="Add key point"
                  value={newKeyPoint}
                  onChange={(e) => setNewKeyPoint(e.target.value)}
                  size="small"
                  sx={{ flexGrow: 1, mr: 1 }}
                />
                <Button 
                  onClick={handleAddKeyPoint} 
                  variant="outlined" 
                  disabled={!newKeyPoint.trim()}
                  sx={{ minHeight: { xs: 40, sm: 'auto' } }}
                >
                  Add
                </Button>
              </Box>
              <Stack spacing={1}>
                {followUpData.keyPoints.map((point, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      • {point}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleRemoveKeyPoint(index)}
                      sx={{ minWidth: { xs: 40, sm: 'auto' }, minHeight: { xs: 40, sm: 'auto' } }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </Box>
            
            <TextField
              label="Notes"
              fullWidth
              value={followUpData.notes}
              onChange={(e) => setFollowUpData(prev => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFollowUpDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveFollowUp} variant="contained" color="primary">
            Create Follow-up
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EmailDetail;
