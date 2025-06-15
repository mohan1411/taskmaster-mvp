import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tabs,
  Tab,
  Alert,
  Button,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  Psychology as FlowIcon,
  Timer as TimeIcon,
  Block as BlockIcon,
  CheckCircle as TaskIcon,
  LocalFireDepartment as StreakIcon,
  EmojiEvents as TrophyIcon,
  Insights as InsightIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useFocus } from '../../context/FocusContext';

// Mock analytics data - in real app this would come from the focus tracker
const generateMockAnalytics = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  return {
    weekly: {
      totalFocusTime: 420, // minutes
      sessionsCompleted: 12,
      averageFlowTime: 35,
      distractionsBlocked: 67,
      tasksCompleted: 28,
      longestSession: 120,
      flowSessions: 8,
      dailyData: days.map(day => ({
        day,
        focusTime: Math.floor(Math.random() * 120) + 30,
        flowTime: Math.floor(Math.random() * 60) + 10,
        sessions: Math.floor(Math.random() * 3) + 1,
        distractions: Math.floor(Math.random() * 15) + 5
      }))
    },
    productivity: {
      peakHours: [9, 10, 14, 15, 16],
      heatmap: hours.map(hour => ({
        hour,
        productivity: Math.random() * 100,
        sessions: Math.floor(Math.random() * 5)
      })),
      bestDay: 'Tuesday',
      averageSessionLength: 65,
      completionRate: 0.82
    },
    insights: [
      {
        type: 'peak_time',
        title: 'Peak Performance',
        message: 'You perform best between 9-11 AM with 90% flow rate',
        impact: 'high',
        recommendation: 'Schedule your most challenging tasks during this window'
      },
      {
        type: 'distraction',
        title: 'Distraction Pattern',
        message: 'Email notifications peak at 2 PM, disrupting afternoon focus',
        impact: 'medium',
        recommendation: 'Enable strict blocking mode after lunch'
      },
      {
        type: 'break_timing',
        title: 'Break Optimization',
        message: 'Taking breaks every 45 minutes improves your flow duration by 23%',
        impact: 'medium',
        recommendation: 'Set break reminders for 45-minute intervals'
      },
      {
        type: 'task_size',
        title: 'Task Sizing',
        message: 'Sessions with 2-3 tasks have highest completion rates',
        impact: 'low',
        recommendation: 'Limit sessions to 2-3 focused tasks'
      }
    ],
    trends: {
      focusTime: { value: 420, change: 15.3, direction: 'up' },
      flowRate: { value: 67, change: -2.1, direction: 'down' },
      distractionResistance: { value: 89, change: 8.7, direction: 'up' },
      taskCompletion: { value: 82, change: 5.2, direction: 'up' }
    }
  };
};

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const FocusAnalytics = () => {
  const { userMetrics } = useFocus();
  const [tabValue, setTabValue] = useState(0);
  const [analytics] = useState(generateMockAnalytics());
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const getInsightIcon = (type) => {
    switch (type) {
      case 'peak_time': return <ScheduleIcon />;
      case 'distraction': return <BlockIcon />;
      case 'break_timing': return <TimeIcon />;
      case 'task_size': return <TaskIcon />;
      default: return <InsightIcon />;
    }
  };
  
  const getInsightColor = (impact) => {
    switch (impact) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };
  
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 500 }}>
          Focus Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your attention patterns and optimize your focus sessions
        </Typography>
      </Box>
      
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Productivity" />
        <Tab label="Insights" />
      </Tabs>
      
      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        {/* Weekly Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1, width: 48, height: 48 }}>
                  <TimeIcon />
                </Avatar>
                <Typography variant="h4" color="primary.main" sx={{ fontSize: '1.75rem' }}>
                  {formatTime(analytics.weekly.totalFocusTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Total Focus Time
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <TrendUpIcon color="success" fontSize="small" />
                  <Typography variant="caption" color="success.main">
                    +{analytics.trends.focusTime.change}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 1, width: 48, height: 48 }}>
                  <FlowIcon />
                </Avatar>
                <Typography variant="h4" color="secondary.main" sx={{ fontSize: '1.75rem' }}>
                  {analytics.weekly.flowSessions}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Flow Sessions
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                  <TrendDownIcon color="error" fontSize="small" />
                  <Typography variant="caption" color="error.main">
                    -{analytics.trends.flowRate.change}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1, width: 48, height: 48 }}>
                  <BlockIcon />
                </Avatar>
                <Typography variant="h4" color="warning.main" sx={{ fontSize: '1.75rem' }}>
                  {analytics.weekly.distractionsBlocked}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Distractions Blocked
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                  <TrendUpIcon color="success" fontSize="small" />
                  <Typography variant="caption" color="success.main">
                    +{analytics.trends.distractionResistance.change}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1, width: 48, height: 48 }}>
                  <TaskIcon />
                </Avatar>
                <Typography variant="h4" color="success.main" sx={{ fontSize: '1.75rem' }}>
                  {analytics.weekly.tasksCompleted}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Tasks Completed
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                  <TrendUpIcon color="success" fontSize="small" />
                  <Typography variant="caption" color="success.main">
                    +{analytics.trends.taskCompletion.change}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Weekly Focus Pattern */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Weekly Focus Pattern
            </Typography>
            <Grid container spacing={1}>
              {analytics.weekly.dailyData.map((day, index) => (
                <Grid item xs key={day.day}>
                  <Box sx={{ textAlign: 'center', px: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {day.day}
                    </Typography>
                    <Box sx={{ height: 100, display: 'flex', alignItems: 'end', justifyContent: 'center', mt: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: `${(day.focusTime / 120) * 100}%`,
                          bgcolor: 'primary.main',
                          borderRadius: 1,
                          minHeight: 4
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', fontSize: '0.7rem' }}>
                      {formatTime(day.focusTime)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
        
        {/* Personal Records */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Personal Records
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrophyIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="body1">Longest Focus Session</Typography>
                    <Typography variant="h6" color="primary.main">
                      {formatTime(analytics.weekly.longestSession)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StreakIcon color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="body1">Current Streak</Typography>
                    <Typography variant="h6" color="warning.main">
                      {userMetrics.streak} days
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Productivity Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Productivity Heatmap
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Your focus intensity throughout the day
                </Typography>
                <Grid container spacing={1}>
                  {analytics.productivity.heatmap.map((hour) => (
                    <Grid item key={hour.hour} xs={1}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: 0.5,
                            bgcolor: `rgba(25, 118, 210, ${hour.productivity / 100})`,
                            border: 1,
                            borderColor: 'divider',
                            mb: 0.5
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {hour.hour}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Key Metrics
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={analytics.productivity.completionRate * 100}
                      sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" fontWeight="bold">
                      {Math.round(analytics.productivity.completionRate * 100)}%
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Average Session
                  </Typography>
                  <Typography variant="h6">
                    {formatTime(analytics.productivity.averageSessionLength)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Best Day
                  </Typography>
                  <Chip 
                    label={analytics.productivity.bestDay}
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Insights Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          AI-Powered Insights
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Personalized recommendations to improve your focus
        </Typography>
        
        <List>
          {analytics.insights.map((insight, index) => (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: `${getInsightColor(insight.impact)}.main` }}>
                    {getInsightIcon(insight.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">
                        {insight.title}
                      </Typography>
                      <Chip
                        label={insight.impact}
                        size="small"
                        color={getInsightColor(insight.impact)}
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {insight.message}
                      </Typography>
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          <strong>Recommendation:</strong> {insight.recommendation}
                        </Typography>
                      </Alert>
                    </Box>
                  }
                />
              </ListItem>
              {index < analytics.insights.length - 1 && <Divider sx={{ my: 2 }} />}
            </React.Fragment>
          ))}
        </List>
      </TabPanel>
    </Box>
  );
};

export default FocusAnalytics;