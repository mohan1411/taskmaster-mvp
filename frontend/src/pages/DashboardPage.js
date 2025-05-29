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
  CardHeader,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Stack
} from '@mui/material';
import {
  CheckCircleOutline,
  Error as ErrorIcon,
  Alarm as AlarmIcon,
  Email as EmailIcon,
  ArrowForward,
  NotificationsActive as NotificationIcon,
  TaskAlt as TaskIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import FollowUpWidget from '../components/followups/FollowUpWidget';
import './Dashboard.css';

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
  
  // Load dashboard data - fetch real statistics from API
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
          // Get all active tasks - remove limit to get actual count
          tasksResponse = await api.get('/api/tasks', {
            params: {
              status: 'pending,in-progress'
              // Removed limit to get all tasks for accurate counting
            }
          });
          
          console.log('Tasks API Response:', tasksResponse.data);
          
          if (tasksResponse.data && tasksResponse.data.tasks) {
            const allTasks = tasksResponse.data.tasks;
            pendingTasksCount = allTasks.length;
            
            console.log(`Found ${allTasks.length} total active tasks`);
            
            // Count overdue tasks
            overdueTasksCount = allTasks.filter(task => {
              if (!task.dueDate) return false;
              const dueDate = new Date(task.dueDate);
              return dueDate < today;
            }).length;
            
            console.log(`Found ${overdueTasksCount} overdue tasks`);
            
            // Get today's date for filtering due today tasks
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Filter for tasks due today
            const dueTasks = allTasks.filter(task => {
              if (!task.dueDate) return false;
              const dueDate = new Date(task.dueDate);
              return dueDate >= today && dueDate < tomorrow;
            });
            
            console.log(`Found ${dueTasks.length} tasks due today`);
            
            // Update task data
            setTaskData({
              recentTasks: allTasks.slice(0, 5),
              dueTasks: dueTasks
            });
          }
        } catch (taskErr) {
          console.error('Error fetching task data:', taskErr);
        }
        
        // Get follow-ups count - try both with and without status filter for debugging
        let followUpCount = 0;
        try {
          // First, try to get ALL follow-ups to see what exists
          const allFollowUpsResponse = await api.get('/api/followups');
          console.log('ALL Follow-ups API Response:', allFollowUpsResponse.data);
          
          if (allFollowUpsResponse.data && allFollowUpsResponse.data.followups) {
            console.log(`Total follow-ups in database: ${allFollowUpsResponse.data.followups.length}`);
            console.log('Follow-up statuses:', allFollowUpsResponse.data.followups.map(f => f.status));
            
            // Count only active follow-ups (not completed or ignored)
            const activeFollowUps = allFollowUpsResponse.data.followups.filter(f => 
              f.status !== 'completed' && f.status !== 'ignored'
            );
            followUpCount = activeFollowUps.length;
            console.log(`Found ${followUpCount} active follow-ups (excluding completed/ignored)`);
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
          // This is optional, so don't show as error
        }
        
        // Update stats with real data
        setStats({
          pendingTasks: pendingTasksCount,
          overdueCount: overdueTasksCount,
          followUpCount: followUpCount,
          unreadEmailCount: unreadEmailCount
        });
        
        // Debug log to check what we're actually setting
        console.log('🔍 Setting Stats:', {
          pendingTasksCount,
          overdueTasksCount,
          followUpCount,
          unreadEmailCount,
          totalTasksReceived: tasksResponse?.data?.tasks?.length || 0
        });
        
        console.log('🔍 Stats state after setting:', {
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
  
  // Stat card renderer - exact copy of what should work
  const StatCard = ({ icon, title, value, color, onClick }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: 3 } : {}
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {React.cloneElement(icon, { color: color || 'primary', fontSize: 'large' })}
          <Typography sx={{ ml: 1 }} color="text.secondary" gutterBottom noWrap>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
  
  // Empty state card component
  const EmptyStateCard = ({ title, icon, message, buttonText, onClick }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        {React.cloneElement(icon, { sx: { fontSize: 64, color: 'text.secondary', mb: 2 } })}
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
          {message}
        </Typography>
        <Button variant="outlined" onClick={onClick}>
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
  
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <div className="dashboard-page">
      {/* Welcome section */}
      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to FizzTask{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Here's your productivity overview for today.
        </Typography>
        
        {stats.overdueCount > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            You have {stats.overdueCount} overdue tasks that need attention.
          </Alert>
        )}
        
        {error && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>
      
      {/* Stats section */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Stats Overview
      </Typography>
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card" onClick={() => navigate('/tasks')}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CheckCircleOutline color="primary" fontSize="large" />
            <Typography sx={{ ml: 1 }} color="text.secondary" gutterBottom noWrap>
              Active Tasks
            </Typography>
          </Box>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {stats.pendingTasks}
          </Typography>
        </div>
        
        <div className="dashboard-stat-card" onClick={() => navigate('/tasks')}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ErrorIcon color="error" fontSize="large" />
            <Typography sx={{ ml: 1 }} color="text.secondary" gutterBottom noWrap>
              Overdue Tasks
            </Typography>
          </Box>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {stats.overdueCount}
          </Typography>
        </div>
        
        <div className="dashboard-stat-card" onClick={() => navigate('/followups')}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <NotificationIcon color="secondary" fontSize="large" />
            <Typography sx={{ ml: 1 }} color="text.secondary" gutterBottom noWrap>
              Follow-ups
            </Typography>
          </Box>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {stats.followUpCount}
          </Typography>
        </div>
        
        <div className="dashboard-stat-card" onClick={() => navigate('/emails')}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <EmailIcon color="info" fontSize="large" />
            <Typography sx={{ ml: 1 }} color="text.secondary" gutterBottom noWrap>
              Unread Emails
            </Typography>
          </Box>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {stats.unreadEmailCount}
          </Typography>
        </div>
      </div>
      
      {/* Two column layout */}
      <div className="dashboard-grid-container">
        {/* Due Today section */}
        <div>
          {taskData.dueTasks && taskData.dueTasks.length > 0 ? (
            <Card sx={{ height: '100%', minHeight: '400px' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                  <AlarmIcon color="warning" sx={{ mr: 1 }} />
                  Due Today
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List>
                  {taskData.dueTasks.map((task) => (
                    <ListItem key={task._id} alignItems="flex-start">
                      <ListItemIcon>
                        <CheckCircleOutline color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={
                          <React.Fragment>
                            <Typography variant="body2" color="text.secondary" component="span">
                              {task.description?.substring(0, 60) || 'No description'}
                              {task.description?.length > 60 ? '...' : ''}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip 
                                size="small" 
                                label={task.priority} 
                                color={priorityColors[task.priority] || 'default'} 
                                sx={{ mr: 1 }}
                              />
                              {task.dueDate && (
                                <Chip 
                                  size="small" 
                                  label={new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                                  variant="outlined" 
                                />
                              )}
                            </Box>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button 
                  size="small" 
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/tasks')}
                >
                  View All Tasks
                </Button>
              </CardActions>
            </Card>
          ) : (
            <EmptyStateCard
              title="No Tasks Due Today"
              icon={<AlarmIcon />}
              message="You don't have any tasks due today. You can check your task list for other pending and overdue tasks."
              buttonText="View All Tasks"
              onClick={() => navigate('/tasks')}
            />
          )}
        </div>
        
        {/* Follow-ups section */}
        <div>
          <FollowUpWidget />
        </div>
      </div>
      
      {/* Recent tasks section - Force visibility */}
      <Card sx={{ mb: 4, display: 'block !important', visibility: 'visible !important' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center">
            <CheckCircleOutline color="primary" sx={{ mr: 1 }} />
            Recent Tasks
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {taskData.recentTasks && taskData.recentTasks.length > 0 ? (
            <Grid container spacing={2}>
              {taskData.recentTasks.map((task) => (
                <Grid item xs={12} sm={6} md={4} key={task._id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" component="div" noWrap>
                        {task.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {task.description?.substring(0, 100) || 'No description'}
                        {task.description?.length > 100 ? '...' : ''}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Chip 
                          size="small" 
                          label={task.status}
                          color={task.status === 'in-progress' ? 'primary' : 'default'} 
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          size="small" 
                          label={task.priority} 
                          color={priorityColors[task.priority] || 'default'} 
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TaskIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>No Recent Tasks</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                Your recent tasks will appear here once you start creating or extracting tasks from emails.
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button variant="contained" onClick={() => navigate('/emails')}>
                  Go to Emails
                </Button>
                <Button variant="outlined" onClick={() => navigate('/tasks')}>
                  Create Task Manually
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
        {taskData.recentTasks && taskData.recentTasks.length > 0 && (
          <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
            <Button 
              size="small" 
              endIcon={<ArrowForward />}
              onClick={() => navigate('/tasks')}
            >
              View All Tasks
            </Button>
          </CardActions>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;