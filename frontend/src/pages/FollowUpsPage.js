import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Paper,
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
  IconButton,
  Pagination,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Done as DoneIcon,
  FilterList as FilterListIcon,
  ChevronRight as ChevronRightIcon,
  Assignment as AssignmentIcon,
  FlagOutlined as FlagIcon
} from '@mui/icons-material';
import { format, isToday, isPast, isTomorrow } from 'date-fns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CustomDatePicker from '../components/common/CustomDatePicker';
import followupService from '../services/followupService';
import FollowUpDetail from '../components/followups/FollowUpDetail';
import '../styles/GlobalPages.css';

const FollowUpsPage = () => {
  // URL parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const followupIdParam = searchParams.get('id');
  
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState({ before: null, after: null });
  const [statusFilter, setStatusFilter] = useState(['pending', 'in-progress']);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  
  // Dialog states
  const [openForm, setOpenForm] = useState(false);
  const [formType, setFormType] = useState('create'); // 'create' or 'edit'
  const [formData, setFormData] = useState({
    subject: '',
    contactName: '',
    contactEmail: '',
    priority: 'medium',
    dueDate: new Date(),
    status: 'pending',
    notes: '',
    keyPoints: [],
    newKeyPoint: '',
    _id: null
  });
  
  const [completionDialog, setCompletionDialog] = useState({
    open: false,
    followupId: null,
    notes: ''
  });
  
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    followupId: null
  });
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch follow-ups and analytics on mount and when filters change
  useEffect(() => {
    fetchFollowUps();
    fetchAnalytics();
  }, [page, statusFilter, priorityFilter, dueDateFilter]);
  
  // Fetch selected follow-up when URL parameter changes
  useEffect(() => {
    if (followupIdParam) {
      fetchSelectedFollowup(followupIdParam);
    } else {
      setSelectedFollowup(null);
    }
  }, [followupIdParam]);
  
  const fetchSelectedFollowup = async (id) => {
    try {
      const data = await followupService.getFollowUpById(id);
      setSelectedFollowup(data);
    } catch (err) {
      console.error('Error fetching follow-up details:', err);
      setError('Failed to load follow-up details');
      setSelectedFollowup(null);
    }
  };

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const queryParams = {
        page,
        status: statusFilter.join(','),
        priority: priorityFilter || undefined,
        dueBefore: dueDateFilter.before ? dueDateFilter.before.toISOString() : undefined,
        dueAfter: dueDateFilter.after ? dueDateFilter.after.toISOString() : undefined
      };
      
      const response = await followupService.getFollowUps(queryParams);
      setFollowups(response.followups);
      setTotalPages(response.pages);
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
      setError('Failed to load follow-ups');
      showSnackbar('Failed to load follow-ups', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await followupService.getFollowUpAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(1);
    
    // Update status filter based on tab selection
    switch (newValue) {
      case 0: // All Active
        setStatusFilter(['pending', 'in-progress']);
        break;
      case 1: // Pending
        setStatusFilter(['pending']);
        break;
      case 2: // In Progress
        setStatusFilter(['in-progress']);
        break;
      case 3: // Completed
        setStatusFilter(['completed']);
        break;
      case 4: // Ignored
        setStatusFilter(['ignored']);
        break;
      default:
        setStatusFilter(['pending', 'in-progress']);
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setPriorityFilter('');
    setDueDateFilter({ before: null, after: null });
    setPage(1);
  };

  // Handle pagination
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Dialog handlers
  const handleOpenForm = (type, followup = null) => {
    setFormType(type);
    if (type === 'edit' && followup) {
      setFormData({
        subject: followup.subject,
        contactName: followup.contactName || '',
        contactEmail: followup.contactEmail || '',
        priority: followup.priority,
        dueDate: new Date(followup.dueDate),
        status: followup.status,
        notes: followup.notes || '',
        keyPoints: followup.keyPoints || [],
        newKeyPoint: '',
        _id: followup._id
      });
    } else {
      setFormData({
        subject: '',
        contactName: '',
        contactEmail: '',
        priority: 'medium',
        dueDate: new Date(),
        status: 'pending',
        notes: '',
        keyPoints: [],
        newKeyPoint: '',
        _id: null
      });
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dueDate: date
    }));
  };

  const handleAddKeyPoint = () => {
    if (formData.newKeyPoint.trim()) {
      setFormData(prev => ({
        ...prev,
        keyPoints: [...prev.keyPoints, prev.newKeyPoint.trim()],
        newKeyPoint: ''
      }));
    }
  };

  const handleRemoveKeyPoint = (index) => {
    setFormData(prev => ({
      ...prev,
      keyPoints: prev.keyPoints.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitForm = async () => {
    try {
      if (formType === 'create') {
        await followupService.createFollowUp(formData);
        showSnackbar('Follow-up created successfully', 'success');
      } else {
        await followupService.updateFollowUp(formData._id, formData);
        showSnackbar('Follow-up updated successfully', 'success');
      }
      handleCloseForm();
      fetchFollowUps();
      fetchAnalytics();
    } catch (err) {
      console.error('Error saving follow-up:', err);
      showSnackbar('Failed to save follow-up', 'error');
    }
  };

  // Status change handlers
  const handleStatusChange = async (followupId, newStatus) => {
    try {
      await followupService.updateFollowUp(followupId, { status: newStatus });
      showSnackbar(`Follow-up marked as ${newStatus}`, 'success');
      fetchFollowUps();
      fetchAnalytics();
    } catch (err) {
      console.error('Error updating status:', err);
      showSnackbar('Failed to update status', 'error');
    }
  };

  const handleOpenCompletionDialog = (followupId) => {
    setCompletionDialog({
      open: true,
      followupId,
      notes: ''
    });
  };

  const handleCompleteWithNotes = async () => {
    try {
      await followupService.updateFollowUp(completionDialog.followupId, {
        status: 'completed',
        completionNotes: completionDialog.notes
      });
      showSnackbar('Follow-up completed', 'success');
      setCompletionDialog({ open: false, followupId: null, notes: '' });
      fetchFollowUps();
      fetchAnalytics();
    } catch (err) {
      console.error('Error completing follow-up:', err);
      showSnackbar('Failed to complete follow-up', 'error');
    }
  };

  // Delete handlers
  const handleOpenDeleteDialog = (followupId) => {
    setDeleteDialog({
      open: true,
      followupId
    });
  };

  const handleDeleteFollowup = async () => {
    try {
      await followupService.deleteFollowUp(deleteDialog.followupId);
      showSnackbar('Follow-up deleted successfully', 'success');
      setDeleteDialog({ open: false, followupId: null });
      fetchFollowUps();
      fetchAnalytics();
    } catch (err) {
      console.error('Error deleting follow-up:', err);
      showSnackbar('Failed to delete follow-up', 'error');
    }
  };

  // Snackbar handlers
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
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
  
  // Handle follow-up selection
  const handleFollowupClick = (followupId) => {
    setSearchParams({ id: followupId });
  };
  
  // Handle back from detail view
  const handleBackToList = () => {
    setSearchParams({});
  };
  
  // Handle update from detail view
  const handleFollowupUpdate = () => {
    fetchFollowUps();
    fetchAnalytics();
    if (followupIdParam) {
      fetchSelectedFollowup(followupIdParam);
    }
  };
  
  // Handle deletion from detail view
  const handleFollowupDelete = () => {
    fetchFollowUps();
    fetchAnalytics();
    setSearchParams({});
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

  // Error boundary
  if (error) {
    return (
      <div className="page-container">
        <div className="page-content">
          <Alert severity="error">{error}</Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h4" gutterBottom>
              Follow-ups
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your follow-up tasks and track progress
            </Typography>
          </Grid>
          <Grid item>
            {selectedFollowup ? (
              <Button
                variant="outlined"
                onClick={handleBackToList}
              >
                Back to List
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenForm('create')}
              >
                Create Follow-up
              </Button>
            )}
          </Grid>
        </Grid>
      </Box>
      
      {/* Show either detail view or list view */}
      {selectedFollowup ? (
        <FollowUpDetail 
          followupId={followupIdParam} 
          onUpdate={handleFollowupUpdate} 
          onDelete={handleFollowupDelete} 
        />
      ) : (
        <>
          {/* Analytics Cards */}
      {analytics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Follow-ups
                </Typography>
                <Typography variant="h4">
                  {analytics?.totalFollowUps || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {analytics.statusCounts?.pending || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Overdue
                </Typography>
                <Typography variant="h4" color="error.main">
                  {analytics?.overdueCount || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Due This Week
                </Typography>
                <Typography variant="h4" color="info.main">
                  {analytics?.dueThisWeek || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs and Filters */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Active" />
            <Tab label="Pending" />
            <Tab label="In Progress" />
            <Tab label="Completed" />
            <Tab label="Ignored" />
          </Tabs>
        </Box>

        {/* Filter Section */}
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <CustomDatePicker
                  label="Due After"
                  value={dueDateFilter.after}
                  onChange={(date) => setDueDateFilter(prev => ({ ...prev, after: date }))}
                  size="small"
                  fullWidth
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <CustomDatePicker
                  label="Due Before"
                  value={dueDateFilter.before}
                  onChange={(date) => setDueDateFilter(prev => ({ ...prev, before: date }))}
                  size="small"
                  fullWidth
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                startIcon={<FilterListIcon />}
                onClick={handleClearFilters}
                variant="outlined"
                fullWidth
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Follow-ups List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : followups.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No follow-ups found
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            {statusFilter.includes('pending') ? 
              'Create your first follow-up to get started' : 
              'No follow-ups with the selected filters'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm('create')}
            sx={{ mt: 2 }}
          >
            Create Follow-up
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {followups.map((followup) => (
            <Paper 
              key={followup._id} 
              sx={{ 
                p: 2, 
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                  transition: 'background-color 0.3s'
                }
              }}
              onClick={() => handleFollowupClick(followup._id)}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={7}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <IconButton size="small" sx={{ mr: 1 }}>
                      {getPriorityIcon(followup.priority)}
                    </IconButton>
                    <Typography variant="h6">
                      {followup.subject}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                      {followup.contactName || followup.contactEmail}
                    </Typography>
                    {getStatusIcon(followup.status)}
                  </Box>
                  <Chip
                    label={getDueDateText(followup.dueDate).text}
                    color={getDueDateText(followup.dueDate).color}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {followup.linkedEmail && (
                    <Chip
                      icon={<EmailIcon />}
                      label="Linked to Email"
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                  )}
                  {followup.linkedTask && (
                    <Chip
                      icon={<AssignmentIcon />}
                      label="Linked to Task"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Grid>
                <Grid item xs={12} md={5}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    {followup.status === 'pending' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(followup._id, 'in-progress');
                        }}
                      >
                        Start
                      </Button>
                    )}
                    {(followup.status === 'pending' || followup.status === 'in-progress') && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCompletionDialog(followup._id);
                          }}
                        >
                          Complete
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(followup._id, 'ignored');
                          }}
                        >
                          Ignore
                        </Button>
                      </>
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation(); 
                        handleOpenForm('edit', followup);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDeleteDialog(followup._id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>

              {/* Expandable content for notes and key points */}
              {(followup.notes || followup.keyPoints?.length > 0) && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ mb: 1 }} />
                  {followup.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {followup.notes}
                    </Typography>
                  )}
                  {followup.keyPoints?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Key Points:
                      </Typography>
                      <List dense>
                        {followup.keyPoints.map((point, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <ChevronRightIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={point} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          ))}
        </Stack>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {formType === 'create' ? 'Create Follow-up' : 'Edit Follow-up'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              name="subject"
              label="Subject"
              fullWidth
              value={formData.subject}
              onChange={handleFormChange}
              required
            />
            <TextField
              name="contactName"
              label="Contact Name"
              fullWidth
              value={formData.contactName}
              onChange={handleFormChange}
            />
            <TextField
              name="contactEmail"
              label="Contact Email"
              fullWidth
              value={formData.contactEmail}
              onChange={handleFormChange}
              type="email"
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                name="priority"
                value={formData.priority}
                label="Priority"
                onChange={handleFormChange}
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
                value={formData.dueDate}
                onChange={handleDateChange}
                fullWidth
              />
            </LocalizationProvider>
            {formType === 'edit' && (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleFormChange}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="ignored">Ignored</MenuItem>
                </Select>
              </FormControl>
            )}
            <TextField
              name="notes"
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={formData.notes}
              onChange={handleFormChange}
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Key Points
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  name="newKeyPoint"
                  value={formData.newKeyPoint}
                  onChange={handleFormChange}
                  placeholder="Add a key point"
                  size="small"
                  fullWidth
                />
                <Button onClick={handleAddKeyPoint} variant="outlined">
                  Add
                </Button>
              </Box>
              <Stack spacing={1}>
                {formData.keyPoints.map((point, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ChevronRightIcon fontSize="small" />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {point}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveKeyPoint(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancel</Button>
          <Button onClick={handleSubmitForm} variant="contained">
            {formType === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog 
        open={completionDialog.open} 
        onClose={() => setCompletionDialog({ open: false, followupId: null, notes: '' })}
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
          <Button onClick={() => setCompletionDialog({ open: false, followupId: null, notes: '' })}>
            Cancel
          </Button>
          <Button onClick={handleCompleteWithNotes} variant="contained" color="success">
            Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => setDeleteDialog({ open: false, followupId: null })}
      >
        <DialogTitle>Delete Follow-up</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this follow-up? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, followupId: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteFollowup} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </>
      )}
      </div>
    </div>
  );
};

export default FollowUpsPage;
