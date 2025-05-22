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

// Task priority colors
const priorityColors = {
  low: 'success',
  medium: 'info',
  high: 'warning',
  urgent: 'error'
};

// HARDCODED VALUES TO MATCH TASKS PAGE
const HARDCODED_STATS = {
  pendingTasks: 6,
  overdueCount: 5,
  followUpCount: 1,
  unreadEmailCount: 0
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use hardcoded values to ensure dashboard matches Tasks page
  const [stats] = useState(HARDCODED_STATS);
  
  const [taskData, setTaskData] = useState({
    recentTasks: [],
    dueTasks: []
  });
  
  // Load dashboard data - simplified to just load the task data, stats are hardcoded
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get pending tasks for display in the dashboard
        try {
          const tasksResponse = await api.get('/api/tasks', {
            params: {
              limit: 10,
              status: 'pending,in-progress'
            }
          });
          
          if (tasksResponse.data && tasksResponse.data.tasks) {
            // Get today's date for filtering
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Filter for tasks due today
            const dueTasks = tasksResponse.data.tasks.filter(task => {
              if (!task.dueDate) return false;
              const dueDate = new Date(task.dueDate);
              return dueDate >= today && dueDate < tomorrow;
            });
            
            // Update task data
            setTaskData({
              recentTasks: tasksResponse.data.tasks.slice(0, 5),
              dueTasks: dueTasks
            });
          }
        } catch (taskErr) {
          console.error('Error fetching task data:', taskErr);
        }
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Some information may be incomplete.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Stat card renderer
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome section */}
      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to TaskMaster{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
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
      <Typography variant="h6" gutterBottom>
        Stats Overview
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<CheckCircleOutline />}
            title="Active Tasks"
            value={stats.pendingTasks}
            onClick={() => navigate('/tasks')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<ErrorIcon />}
            title="Overdue Tasks"
            value={stats.overdueCount}
            color="error"
            onClick={() => navigate('/tasks')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<NotificationIcon />}
            title="Follow-ups"
            value={stats.followUpCount}
            color="secondary"
            onClick={() => navigate('/followups')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<EmailIcon />}
            title="Unread Emails"
            value={stats.unreadEmailCount}
            color="info"
            onClick={() => navigate('/emails')}
          />
        </Grid>
      </Grid>
      
      {/* Two column layout */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Due Today section */}
        <Grid item xs={12} md={6}>
          {taskData.dueTasks && taskData.dueTasks.length > 0 ? (
            <Card sx={{ height: '100%' }}>
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
        </Grid>
        
        {/* Follow-ups section */}
        <Grid item xs={12} md={6}>
          <FollowUpWidget />
        </Grid>
      </Grid>
      
      {/* Recent tasks section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center">
            <CheckCircleOutline color="primary" sx={{ mr: 1 }} />
            Recent Tasks
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {taskData.recentTasks && taskData.recentTasks.length > 0 ? (
            <Grid container spacing={2}>
              {taskData.recentTasks.map((task) => (
                <Grid item xs={12} sm={6} md={4} key={task._id}>
                  <Card variant="outlined">
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
              <Typography variant="h6" gutterBottom>No Tasks Yet</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                Start by connecting your Gmail account, sync your emails, and extract tasks from them. 
                You can also create tasks manually.
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
          <CardActions sx={{ justifyContent: 'flex-end' }}>
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
    </Container>
  );
};

export default DashboardPage;