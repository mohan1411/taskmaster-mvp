import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tooltip,
  Collapse,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Alarm as AlarmIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Email as EmailIcon,
  Task as TaskIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MoreVert as MoreVertIcon,
  NotificationAdd as NotificationAddIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/GlobalPages.css';

const FollowUpsPageCompact = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [followUps, setFollowUps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0
  });
  
  const [expandedSections, setExpandedSections] = useState({
    analytics: true,
    active: true,
    completed: false
  });
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    relatedEmail: '',
    relatedTask: ''
  });
  
  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Fetch follow-ups
  const fetchFollowUps = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/followups');
      const data = response.data.followUps || response.data;
      setFollowUps(data);
      
      // Calculate analytics
      const now = new Date();
      const stats = {
        total: data.length,
        pending: data.filter(f => f.status === 'pending').length,
        completed: data.filter(f => f.status === 'completed').length,
        overdue: data.filter(f => 
          f.status === 'pending' && 
          f.dueDate && 
          new Date(f.dueDate) < now
        ).length
      };
      setAnalytics(stats);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      setError('Failed to load follow-ups');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFollowUps();
  }, []);
  
  // Delete follow-up
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this follow-up?')) return;
    
    try {
      await api.delete(`/api/followups/${id}`);
      fetchFollowUps();
    } catch (error) {
      console.error('Error deleting follow-up:', error);
      alert('Failed to delete follow-up');
    }
  };
  
  // Mark as complete
  const handleComplete = async (id) => {
    try {
      await api.patch(`/api/followups/${id}`, { status: 'completed' });
      fetchFollowUps();
    } catch (error) {
      console.error('Error completing follow-up:', error);
      alert('Failed to complete follow-up');
    }
  };
  
  // Compact Analytics Card
  const AnalyticsCard = ({ icon, label, value, color }) => (
    <Card sx={{ 
      height: 64,
      border: '1px solid',
      borderColor: 'divider',
      transition: 'all 0.2s',
      '&:hover': {
        boxShadow: 1,
        borderColor: `${color}.main`
      }
    }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 1,
            bgcolor: `${color}.50`,
            mr: 1.5
          }}>
            {React.cloneElement(icon, { 
              sx: { fontSize: 18, color: `${color}.main` } 
            })}
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.688rem' }}>
              {label}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
  
  // Compact Follow-up Item
  const FollowUpItem = ({ followUp }) => {
    const isOverdue = followUp.status === 'pending' && 
                     followUp.dueDate && 
                     new Date(followUp.dueDate) < new Date();
    
    return (
      <ListItem
        sx={{
          py: 1,
          px: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          '&:last-child': { borderBottom: 0 },
          '&:hover': {
            bgcolor: 'action.hover',
            '& .followup-actions': { opacity: 1 }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
          <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
            {followUp.status === 'completed' ? (
              <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
            ) : (
              <ScheduleIcon sx={{ fontSize: 18, color: isOverdue ? 'error.main' : 'warning.main' }} />
            )}
          </ListItemIcon>
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: '0.813rem', 
                fontWeight: 500,
                textDecoration: followUp.status === 'completed' ? 'line-through' : 'none'
              }}
            >
              {followUp.title}
            </Typography>
            
            {followUp.description && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.688rem' }}>
                {followUp.description}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              {followUp.dueDate && (
                <Chip
                  size="small"
                  icon={<AlarmIcon sx={{ fontSize: 12 }} />}
                  label={new Date(followUp.dueDate).toLocaleDateString()}
                  color={isOverdue ? 'error' : 'default'}
                  sx={{ height: 18, fontSize: '0.625rem' }}
                />
              )}
              
              <Chip
                size="small"
                label={followUp.priority}
                color={
                  followUp.priority === 'high' ? 'error' :
                  followUp.priority === 'medium' ? 'warning' : 'success'
                }
                sx={{ height: 18, fontSize: '0.625rem' }}
              />
              
              {followUp.relatedEmail && (
                <Tooltip title="From email">
                  <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                </Tooltip>
              )}
              
              {followUp.relatedTask && (
                <Tooltip title="Has task">
                  <TaskIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                </Tooltip>
              )}
            </Box>
          </Box>
          
          <Box 
            className="followup-actions" 
            sx={{ 
              opacity: 0, 
              transition: 'opacity 0.2s',
              display: 'flex',
              gap: 0.5
            }}
          >            {followUp.status !== 'completed' && (
              <>
                <Tooltip title="Mark complete">
                  <IconButton 
                    size="small" 
                    onClick={() => handleComplete(followUp._id)}
                    sx={{ p: 0.5 }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      setEditingFollowUp(followUp);
                      setFormData({
                        title: followUp.title,
                        description: followUp.description || '',
                        dueDate: followUp.dueDate ? followUp.dueDate.split('T')[0] : '',
                        priority: followUp.priority,
                        relatedEmail: followUp.relatedEmail || '',
                        relatedTask: followUp.relatedTask || ''
                      });
                      setOpenDialog(true);
                    }}
                    sx={{ p: 0.5 }}
                  >
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip title="Delete">
              <IconButton 
                size="small" 
                onClick={() => handleDelete(followUp._id)}
                sx={{ p: 0.5 }}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </ListItem>
    );
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const activeFollowUps = followUps.filter(f => f.status !== 'completed');
  const completedFollowUps = followUps.filter(f => f.status === 'completed');
  
  return (
    <Box className="page-container">
      <Container maxWidth={false} className="page-content">
        {/* Compact Page Header */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h1" sx={{ fontSize: '1.75rem', fontWeight: 600 }}>
            Follow-ups
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingFollowUp(null);
              setFormData({
                title: '',
                description: '',
                dueDate: '',
                priority: 'medium',
                relatedEmail: '',
                relatedTask: ''
              });
              setOpenDialog(true);
            }}
            sx={{ height: 32, fontSize: '0.813rem' }}
          >
            New Follow-up
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Compact Analytics Grid */}
        <Paper sx={{ mb: 2, p: 1.5 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 1.5,
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 }
            }}
            onClick={() => toggleSection('analytics')}
          >
            <Typography variant="subtitle1" fontWeight={500} sx={{ fontSize: '0.875rem' }}>
              Overview
            </Typography>
            <IconButton size="small">
              {expandedSections.analytics ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
          
          <Collapse in={expandedSections.analytics}>
            <Grid container spacing={1.5}>
              <Grid item xs={6} sm={3}>
                <AnalyticsCard
                  icon={<TrendingUpIcon />}
                  label="Total"
                  value={analytics.total}
                  color="primary"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <AnalyticsCard
                  icon={<ScheduleIcon />}
                  label="Pending"
                  value={analytics.pending}
                  color="warning"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <AnalyticsCard
                  icon={<CheckCircleIcon />}
                  label="Completed"
                  value={analytics.completed}
                  color="success"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <AnalyticsCard
                  icon={<AlarmIcon />}
                  label="Overdue"
                  value={analytics.overdue}
                  color="error"
                />
              </Grid>
            </Grid>
          </Collapse>
        </Paper>
        
        {/* Active Follow-ups - Compact List */}
        <Paper sx={{ mb: 2 }}>
          <Box 
            sx={{ 
              p: 1.5, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              bgcolor: 'grey.50',
              '&:hover': { bgcolor: 'action.hover' }
            }}
            onClick={() => toggleSection('active')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NotificationAddIcon color="warning" sx={{ mr: 1, fontSize: 18 }} />
              <Typography variant="subtitle1" fontWeight={500} sx={{ fontSize: '0.875rem' }}>
                Active Follow-ups
              </Typography>
              <Chip 
                label={activeFollowUps.length} 
                size="small" 
                sx={{ ml: 1, height: 20, fontSize: '0.688rem' }}
              />
            </Box>
            <IconButton size="small">
              {expandedSections.active ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
          
          <Divider />
          
          <Collapse in={expandedSections.active}>
            {activeFollowUps.length > 0 ? (
              <List dense sx={{ py: 0 }}>
                {activeFollowUps.map(followUp => (
                  <FollowUpItem key={followUp._id} followUp={followUp} />
                ))}
              </List>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.813rem' }}>
                  No active follow-ups
                </Typography>
                <Button 
                  variant="contained" 
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenDialog(true)}
                  sx={{ mt: 1, fontSize: '0.75rem' }}
                >
                  Create Your First Follow-up
                </Button>
              </Box>
            )}
          </Collapse>
        </Paper>
        
        {/* Completed Follow-ups - Collapsed by default */}
        {completedFollowUps.length > 0 && (
          <Paper>
            <Box 
              sx={{ 
                p: 1.5, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
                bgcolor: 'grey.50',
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => toggleSection('completed')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 18 }} />
                <Typography variant="subtitle1" fontWeight={500} sx={{ fontSize: '0.875rem' }}>
                  Completed Follow-ups
                </Typography>
                <Chip 
                  label={completedFollowUps.length} 
                  size="small" 
                  color="success"
                  sx={{ ml: 1, height: 20, fontSize: '0.688rem' }}
                />
              </Box>
              <IconButton size="small">
                {expandedSections.completed ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Box>
            
            <Divider />
            
            <Collapse in={expandedSections.completed}>
              <List dense sx={{ py: 0 }}>
                {completedFollowUps.map(followUp => (
                  <FollowUpItem key={followUp._id} followUp={followUp} />
                ))}
              </List>
            </Collapse>
          </Paper>
        )}
        
        {/* Dialog would go here - keeping existing dialog code */}
      </Container>
    </Box>
  );
};

export default FollowUpsPageCompact;
