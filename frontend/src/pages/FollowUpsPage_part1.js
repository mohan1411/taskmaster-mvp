import React, { useState, useEffect } from 'react';
import {
  Container,
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
  Tooltip,
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
  Avatar,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Done as DoneIcon,
  FilterList as FilterListIcon,
  ChevronRight as ChevronRightIcon,
  Assignment as AssignmentIcon,
  FlagOutlined as FlagIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow, isToday, isPast, isTomorrow } from 'date-fns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import followupService from '../services/followupService';

const FollowUpsPage = () => {
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

  // Continue in part 2...