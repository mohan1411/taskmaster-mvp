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
  CardActions,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Stack,
  IconButton,
  Collapse
} from '@mui/material';
import {
  CheckCircleOutline,
  Error as ErrorIcon,
  Alarm as AlarmIcon,
  Email as EmailIcon,
  ArrowForward,
  NotificationsActive as NotificationIcon,
  TaskAlt as TaskIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import FollowUpWidget from '../components/followups/FollowUpWidget';
import FocusWidget from '../components/focus/FocusWidget';
import '../styles/GlobalPages.css';

// Task priority colors
const priorityColors = {
  low: 'success',
  medium: 'info',
  high: 'warning',
  urgent: 'error'
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    dueTasks: true,
    recentTasks: true
  });
  
  // Real stats from API calls
  const [stats, setStats] = useState({
    pendingTasks: 0,
    overdueCount: 0,
    followUpCount: 0,
    unreadEmailCount: 0
  });
  
  const [taskData, setTaskData] = useState({
    recentTasks: [],
    dueTasks: []
  });
  
  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Load dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch real statistics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get active/pending tasks count
        let pendingTasksCount = 0;
        let overdueTasksCount = 0;
        let tasksResponse = null;
        try {
          tasksResponse = await api.get('/api/tasks', {
            params: {
              status: 'pending,in-progress'
            }
          });
          
          if (tasksResponse.data && tasksResponse.data.tasks) {
            const allTasks = tasksResponse.data.tasks;
            pendingTasksCount = allTasks.length;
            
            // Count overdue tasks
            overdueTasksCount = allTasks.filter(task => {
              if (!task.dueDate) return false;
              const dueDate = new Date(task.dueDate);
              return dueDate < today;
            }).length;
            
            // Get today's date for filtering due today tasks
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Filter for tasks due today
            const dueTasks = allTasks.filter(task => {
              if (!task.dueDate) return false;
              const dueDate = new Date(task.dueDate);
              return dueDate >= today && dueDate < tomorrow;
            });
            
            // Update task data
            setTaskData({
              recentTasks: allTasks.slice(0, 5),
              dueTasks: dueTasks
            });
          }
        } catch (taskErr) {
          console.error('Error fetching task data:', taskErr);
        }
        
        // Get follow-ups count
        let followUpCount = 0;
        try {
          const allFollowUpsResponse = await api.get('/api/followups');
          
          if (allFollowUpsResponse.data && allFollowUpsResponse.data.followups) {
            const activeFollowUps = allFollowUpsResponse.data.followups.filter(f => 
              f.status !== 'completed' && f.status !== 'ignored'
            );
            followUpCount = activeFollowUps.length;
          }
        } catch (followUpErr) {
          console.error('Error fetching follow-up data:', followUpErr);
        }
        
        // Get unread emails count (if available)
        let unreadEmailCount = 0;
        try {
          const emailResponse = await api.get('/api/emails/stats');
          if (emailResponse.data && emailResponse.data.unreadCount !== undefined) {
            unreadEmailCount = emailResponse.data.unreadCount;
          }
        } catch (emailErr) {
          console.log('Email stats not available:', emailErr.message);
        }
        
        // Update stats with real data
        setStats({
          pendingTasks: pendingTasksCount,
          overdueCount: overdueTasksCount,
          followUpCount: followUpCount,
          unreadEmailCount: unreadEmailCount
        });
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Some information may be incomplete.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Compact stat card component
  const StatCard = ({ icon, title, value, color, onClick }) => (
    <Card 
      sx={{ 
        height: 80,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? { 
          transform: 'translateY(-2px)', 
          boxShadow: 2,
          bgcolor: 'action.hover' 
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 1,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? `${color}.900` : `${color}.100`,
            mr: 2
          }}>
            {React.cloneElement(icon, { 
              sx: { fontSize: 24, color: `${color}.main` } 
            })}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h3" sx={{ fontSize: '1.75rem', fontWeight: 600, lineHeight: 1, color: 'text.primary' }}>
              {value}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <div className="page-container">
      <div className="page-content">
        {/* Compact Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontSize: '1.5rem', fontWeight: 500, mb: 0.5, color: 'text.primary' }}>
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        
        {/* Alerts */}
        {stats.overdueCount > 0 && (
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
            action={
              <Button size="small" onClick={() => navigate('/tasks')}>
                View Tasks
              </Button>
            }
          >
            You have <strong>{stats.overdueCount}</strong> overdue tasks that need attention.
          </Alert>
        )}
        
        {error && (
          <Alert severity="info" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {/* Compact Stats Grid */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <StatCard
              icon={<CheckCircleOutline />}
              title="Active Tasks"
              value={stats.pendingTasks}
              color="primary"
              onClick={() => navigate('/tasks')}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              icon={<ErrorIcon />}
              title="Overdue"
              value={stats.overdueCount}
              color="error"
              onClick={() => navigate('/tasks')}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              icon={<NotificationIcon />}
              title="Follow-ups"
              value={stats.followUpCount}
              color="warning"
              onClick={() => navigate('/followups')}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              icon={<EmailIcon />}
              title="Unread"
              value={stats.unreadEmailCount}
              color="info"
              onClick={() => navigate('/emails')}
            />
          </Grid>
        </Grid>
        
        {/* Three column layout for main content */}
        <Grid container spacing={3}>
          {/* Due Today section - Compact */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ height: '100%' }}>
              <Box 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => toggleSection('dueTasks')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AlarmIcon color="warning" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="subtitle1" fontWeight={500}>
                    Due Today
                  </Typography>
                  <Chip 
                    label={taskData.dueTasks.length} 
                    size="small" 
                    sx={{ ml: 1, height: 20 }}
                  />
                </Box>
                <IconButton size="small">
                  {expandedSections.dueTasks ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Divider />
              
              <Collapse in={expandedSections.dueTasks}>
                {taskData.dueTasks.length > 0 ? (
                  <List dense sx={{ py: 0 }}>
                    {taskData.dueTasks.map((task) => (
                      <ListItem 
                        key={task._id} 
                        button
                        onClick={() => navigate('/tasks')}
                        sx={{ py: 1.5, px: 2 }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleOutline fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" noWrap>
                              {task.title}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip 
                                size="small" 
                                label={task.priority} 
                                color={priorityColors[task.priority]} 
                                sx={{ height: 18, fontSize: '0.7rem' }}
                              />
                              {task.dueDate && (
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(task.dueDate).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No tasks due today
                    </Typography>
                    <Button 
                      size="small" 
                      onClick={() => navigate('/tasks')}
                      sx={{ mt: 1 }}
                    >
                      View All Tasks
                    </Button>
                  </Box>
                )}
              </Collapse>
              
              {taskData.dueTasks.length > 0 && expandedSections.dueTasks && (
                <>
                  <Divider />
                  <Box sx={{ p: 1, textAlign: 'center' }}>
                    <Button 
                      size="small" 
                      endIcon={<ArrowForward fontSize="small" />}
                      onClick={() => navigate('/tasks')}
                    >
                      View All Tasks
                    </Button>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
          
          {/* Follow-ups section */}
          <Grid item xs={12} md={4}>
            <FollowUpWidget />
          </Grid>
          
          {/* Focus Mode section */}
          <Grid item xs={12} md={4}>
            <FocusWidget />
          </Grid>
        </Grid>
        
        {/* Recent Tasks - Compact List View */}
        <Paper sx={{ mt: 3 }}>
          <Box 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' }
            }}
            onClick={() => toggleSection('recentTasks')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight={500}>
                Recent Activity
              </Typography>
            </Box>
            <IconButton size="small">
              {expandedSections.recentTasks ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          <Divider />
          
          <Collapse in={expandedSections.recentTasks}>
            {taskData.recentTasks.length > 0 ? (
              <List dense sx={{ py: 0 }}>
                {taskData.recentTasks.map((task) => (
                  <ListItem 
                    key={task._id}
                    button
                    onClick={() => navigate('/tasks')}
                    sx={{ 
                      py: 1.5, 
                      px: 2,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="body2" noWrap sx={{ mr: 2 }}>
                            {task.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Chip 
                              size="small" 
                              label={task.status.replace('-', ' ')}
                              color={task.status === 'in-progress' ? 'primary' : 'default'} 
                              sx={{ height: 18, fontSize: '0.7rem' }}
                            />
                            <Chip 
                              size="small" 
                              label={task.priority} 
                              color={priorityColors[task.priority]} 
                              sx={{ height: 18, fontSize: '0.7rem' }}
                            />
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {task.description || 'No description'}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <TaskIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  No recent tasks
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => navigate('/emails')}
                  >
                    Check Emails
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => navigate('/tasks')}
                  >
                    Create Task
                  </Button>
                </Stack>
              </Box>
            )}
          </Collapse>
          
          {taskData.recentTasks.length > 0 && expandedSections.recentTasks && (
            <>
              <Divider />
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Button 
                  size="small" 
                  endIcon={<ArrowForward fontSize="small" />}
                  onClick={() => navigate('/tasks')}
                >
                  View All Tasks
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </div>
    </div>
  );
};

export default DashboardPage;
