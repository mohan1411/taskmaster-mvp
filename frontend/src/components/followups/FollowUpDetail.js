import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Grid,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Done as DoneIcon,
  Assignment as AssignmentIcon,
  ChevronRight as ChevronRightIcon,
  FlagOutlined as FlagIcon,
  AddTask as AddTaskIcon,
  NotificationsActive as NotificationsIcon,
  Notifications as NotificationIcon,
  Computer as ComputerIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow, isToday, isPast, isTomorrow } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CustomDatePicker from '../common/CustomDatePicker';
import followupService from '../../services/followupService';
import FollowUpReminderSettings from './FollowUpReminderSettings';

const FollowUpDetail = ({ followupId, onUpdate, onDelete }) => {
  const [followup, setFollowup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Reminder dialog state
  const [reminderDialog, setReminderDialog] = useState({
    open: false,
    type: 'in-app'
  });
  
  // Edit dialog state
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editData, setEditData] = useState({
    subject: '',
    contactName: '',
    contactEmail: '',
    priority: 'medium',
    dueDate: new Date(),
    status: 'pending',
    notes: '',
    keyPoints: [],
    newKeyPoint: ''
  });
  
  // Completion dialog state
  const [completionDialog, setCompletionDialog] = useState({
    open: false,
    notes: ''
  });
  
  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState(false);
  
  // Fetch follow-up details on mount or ID change
  useEffect(() => {
    fetchFollowUp();
  }, [followupId]);
  
  const fetchFollowUp = async () => {
    if (!followupId) return;
    
    try {
      setLoading(true);
      const data = await followupService.getFollowUpById(followupId);
      setFollowup(data);
      
      // Initialize edit form data
      setEditData({
        subject: data.subject || '',
        contactName: data.contactName || '',
        contactEmail: data.contactEmail || '',
        priority: data.priority || 'medium',
        dueDate: new Date(data.dueDate) || new Date(),
        status: data.status || 'pending',
        notes: data.notes || '',
        keyPoints: data.keyPoints || [],
        newKeyPoint: ''
      });
    } catch (err) {
      console.error('Error fetching follow-up details:', err);
      setError('Failed to load follow-up details');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle edit form actions
  const handleOpenEditDialog = () => {
    setOpenEditDialog(true);
  };
  
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };
  
  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDateChange = (date) => {
    setEditData(prev => ({
      ...prev,
      dueDate: date
    }));
  };
  
  const handleAddKeyPoint = () => {
    if (editData.newKeyPoint.trim()) {
      setEditData(prev => ({
        ...prev,
        keyPoints: [...prev.keyPoints, prev.newKeyPoint.trim()],
        newKeyPoint: ''
      }));
    }
  };
  
  const handleRemoveKeyPoint = (index) => {
    setEditData(prev => ({
      ...prev,
      keyPoints: prev.keyPoints.filter((_, i) => i !== index)
    }));
  };
  
  const handleSaveEdit = async () => {
    try {
      await followupService.updateFollowUp(followupId, editData);
      setOpenEditDialog(false);
      fetchFollowUp();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error updating follow-up:', err);
      setError('Failed to update follow-up');
    }
  };
  
  // Handle status change
  const handleStatusChange = async (newStatus) => {
    try {
      await followupService.updateFollowUp(followupId, { status: newStatus });
      fetchFollowUp();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };
  
  // Handle completion
  const handleOpenCompletionDialog = () => {
    setCompletionDialog({ open: true, notes: '' });
  };
  
  const handleCloseCompletionDialog = () => {
    setCompletionDialog({ open: false, notes: '' });
  };
  
  const handleCompleteWithNotes = async () => {
    try {
      await followupService.updateFollowUp(followupId, {
        status: 'completed',
        completionNotes: completionDialog.notes
      });
      setCompletionDialog({ open: false, notes: '' });
      fetchFollowUp();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error completing follow-up:', err);
      setError('Failed to complete follow-up');
    }
  };
  
  // Handle delete
  const handleOpenDeleteDialog = () => {
    setDeleteDialog(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialog(false);
  };
  
  const handleDelete = async () => {
    try {
      await followupService.deleteFollowUp(followupId);
      setDeleteDialog(false);
      if (onDelete) onDelete();
    } catch (err) {
      console.error('Error deleting follow-up:', err);
      setError('Failed to delete follow-up');
    }
  };
  
  // Handle manual reminder
  const handleOpenReminderDialog = () => {
    setReminderDialog({ open: true, type: 'in-app' });
  };
  
  const handleCloseReminderDialog = () => {
    setReminderDialog({ open: false, type: 'in-app' });
  };
  
  const handleReminderTypeChange = (event) => {
    setReminderDialog(prev => ({
      ...prev,
      type: event.target.value
    }));
  };
  
  const handleSendReminder = async () => {
    try {
      await followupService.sendManualReminder(followupId, reminderDialog.type);
      handleCloseReminderDialog();
      
      // Show success message
      setError({ 
        type: 'success', 
        message: `Reminder sent successfully via ${reminderDialog.type}` 
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    } catch (err) {
      console.error('Error sending reminder:', err);
      setError('Failed to send reminder');
    }
  };
  
  // Helper functions
  const getPriorityIcon = (priority) => {
    const colors = {
      urgent: 'error.main',
      high: 'warning.main',
      medium: 'info.main',
      low: 'success.main'
    };
    return <FlagIcon sx={{ color: colors[priority] || 'action.active' }} />;
  };
  
  const getStatusIcon = (status) => {
    const icons = {
      pending: <ScheduleIcon />,
      'in-progress': <AssignmentIcon />,
      completed: <DoneIcon />,
      ignored: <CancelIcon />
    };
    const colors = {
      pending: 'warning',
      'in-progress': 'info',
      completed: 'success',
      ignored: 'default'
    };
    return <Chip icon={icons[status]} label={status} size="small" color={colors[status]} />;
  };
  
  const getDueDateText = (date) => {
    const dueDate = new Date(date);
    
    if (isPast(dueDate) && !isToday(dueDate)) {
      return { text: 'Overdue', color: 'error' };
    }
    if (isToday(dueDate)) {
      return { text: 'Due today', color: 'warning' };
    }
    if (isTomorrow(dueDate)) {
      return { text: 'Due tomorrow', color: 'info' };
    }
    return { text: format(dueDate, 'MMM d, yyyy'), color: 'default' };
  };
  
  // Loading state
  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }
  
  // Error state
  if (error && typeof error === 'string') {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }
  
  // No followup selected
  if (!followup) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No follow-up selected</Typography>
      </Paper>
    );
  }
  
  return (
    <>
      <Paper sx={{ p: 3 }}>
        {/* Success message */}
        {error && typeof error === 'object' && error.type === 'success' && (
          <Alert severity="success" sx={{ mb: 2 }}>{error.message}</Alert>
        )}
        
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <IconButton size="small" sx={{ mr: 1 }}>
                {getPriorityIcon(followup.priority)}
              </IconButton>
              <Typography variant="h5">
                {followup.subject}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {followup.contactName || followup.contactEmail}
              </Typography>
              {getStatusIcon(followup.status)}
              <Chip
                label={getDueDateText(followup.dueDate).text}
                color={getDueDateText(followup.dueDate).color}
                size="small"
              />
            </Box>
          </Box>
          
          <Box>
            <IconButton
              color="primary"
              onClick={handleOpenEditDialog}
              title="Edit follow-up"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              color="error"
              onClick={handleOpenDeleteDialog}
              title="Delete follow-up"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* Actions */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1}>
            {followup.status === 'pending' && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => handleStatusChange('in-progress')}
                startIcon={<AssignmentIcon />}
              >
                Start Working
              </Button>
            )}
            
            {(followup.status === 'pending' || followup.status === 'in-progress') && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleOpenCompletionDialog}
                  startIcon={<DoneIcon />}
                >
                  Complete
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleStatusChange('ignored')}
                  startIcon={<CancelIcon />}
                >
                  Ignore
                </Button>
                
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleOpenReminderDialog}
                  startIcon={<NotificationsIcon />}
                >
                  Send Reminder
                </Button>
              </>
            )}
            
            {(followup.status === 'completed' || followup.status === 'ignored') && (
              <Button
                variant="outlined"
                onClick={() => handleStatusChange('pending')}
                startIcon={<ScheduleIcon />}
              >
                Reopen
              </Button>
            )}
          </Stack>
        </Box>
        
        {/* Details */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Details
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Contact</Typography>
              <Typography>
                {followup.contactName || 'Not specified'}
                {followup.contactEmail && ` (${followup.contactEmail})`}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Due Date</Typography>
              <Typography>
                {format(new Date(followup.dueDate), 'PPP')}
                {isToday(new Date(followup.dueDate)) && ' (Today)'}
                {isPast(new Date(followup.dueDate)) && !isToday(new Date(followup.dueDate)) && 
                  ` (${formatDistanceToNow(new Date(followup.dueDate))} overdue)`}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Priority</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getPriorityIcon(followup.priority)}
                <Typography sx={{ ml: 1, textTransform: 'capitalize' }}>
                  {followup.priority}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Status</Typography>
              {getStatusIcon(followup.status)}
            </Box>
            
            {followup.completedAt && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Completed On</Typography>
                <Typography>
                  {format(new Date(followup.completedAt), 'PPP')}
                </Typography>
              </Box>
            )}
            
            {followup.completionNotes && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Completion Notes</Typography>
                <Typography>{followup.completionNotes}</Typography>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            {followup.notes && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {followup.notes}
                </Typography>
              </Box>
            )}
            
            {followup.keyPoints && followup.keyPoints.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Key Points
                </Typography>
                <List dense>
                  {followup.keyPoints.map((point, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <ChevronRightIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={point} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            {/* Related items section */}
            {followup.relatedTasks && followup.relatedTasks.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Related Tasks
                </Typography>
                <List dense>
                  {followup.relatedTasks.map((task, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <AddTaskIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={task} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Grid>
        </Grid>
        
        {/* Reminder Settings Section */}
        {followup.status !== 'completed' && followup.status !== 'ignored' && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <FollowUpReminderSettings followupId={followupId} />
          </Box>
        )}
      </Paper>
      
      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Follow-up</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              name="subject"
              label="Subject"
              fullWidth
              value={editData.subject}
              onChange={handleEditChange}
              required
            />
            <TextField
              name="contactName"
              label="Contact Name"
              fullWidth
              value={editData.contactName}
              onChange={handleEditChange}
            />
            <TextField
              name="contactEmail"
              label="Contact Email"
              fullWidth
              value={editData.contactEmail}
              onChange={handleEditChange}
              type="email"
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                name="priority"
                value={editData.priority}
                label="Priority"
                onChange={handleEditChange}
              >
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <CustomDatePicker
                label="Due Date"
                value={editData.dueDate}
                onChange={handleDateChange}
                fullWidth
              />
            </LocalizationProvider>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={editData.status}
                label="Status"
                onChange={handleEditChange}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="ignored">Ignored</MenuItem>
              </Select>
            </FormControl>
            <TextField
              name="notes"
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={editData.notes}
              onChange={handleEditChange}
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Key Points
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  name="newKeyPoint"
                  value={editData.newKeyPoint}
                  onChange={handleEditChange}
                  placeholder="Add a key point"
                  size="small"
                  fullWidth
                />
                <Button onClick={handleAddKeyPoint} variant="outlined">
                  Add
                </Button>
              </Box>
              <Stack spacing={1}>
                {editData.keyPoints.map((point, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ChevronRightIcon fontSize="small" />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {point}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveKeyPoint(index)}
                    >
                      <DeleteIcon fontSize="small" sx={{ color: theme => theme.palette.text.primary }} />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Completion Dialog */}
      <Dialog 
        open={completionDialog.open} 
        onClose={handleCloseCompletionDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Complete Follow-up</DialogTitle>
        <DialogContent>
          <TextField
            label="Completion Notes"
            multiline
            rows={4}
            fullWidth
            value={completionDialog.notes}
            onChange={(e) => setCompletionDialog(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any notes about the completion..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompletionDialog}>
            Cancel
          </Button>
          <Button onClick={handleCompleteWithNotes} variant="contained" color="success">
            Complete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog} 
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Delete Follow-up</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this follow-up? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Send Reminder Dialog */}
      <Dialog 
        open={reminderDialog.open} 
        onClose={handleCloseReminderDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Follow-up Reminder</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3, mt: 1 }}>
            Send a reminder notification for this follow-up immediately. This will create a notification
            based on your selection below.
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Notification Type</InputLabel>
            <Select
              value={reminderDialog.type}
              label="Notification Type"
              onChange={handleReminderTypeChange}
            >
              <MenuItem value="in-app">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <NotificationIcon sx={{ mr: 1 }} />
                  In-app Notification
                </Box>
              </MenuItem>
              <MenuItem value="email">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon sx={{ mr: 1 }} />
                  Email Notification
                </Box>
              </MenuItem>
              <MenuItem value="browser">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ComputerIcon sx={{ mr: 1 }} />
                  Browser Notification
                </Box>
              </MenuItem>
              <MenuItem value="all">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <NotificationsIcon sx={{ mr: 1 }} />
                  All Channels
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          
          <Alert severity="info">
            This will send a reminder independent of the automated reminder schedule.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReminderDialog}>
            Cancel
          </Button>
          <Button onClick={handleSendReminder} variant="contained" color="primary">
            Send Reminder
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FollowUpDetail;