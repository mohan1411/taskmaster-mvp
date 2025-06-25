import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Tabs,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  Timer as TimeIcon,
  Psychology as FlowIcon,
  Block as BlockIcon,
  CheckCircle as TaskIcon,
  TrendingUp,
  Refresh
} from '@mui/icons-material';
import { useFocus } from '../../context/FocusContext';
import { useTasks } from '../../hooks/useTasks';
import focusService from '../../services/focusService';
import taskService from '../../services/taskService';
import SessionHistoryChart from './analytics/SessionHistoryChart';
import ProductivityHeatmap from './analytics/ProductivityHeatmap';
import FocusInsights from './analytics/FocusInsights';
import SessionList from './analytics/SessionList';

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const FocusAnalyticsV2 = () => {
  const { userMetrics } = useFocus();
  const { tasks } = useTasks();
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    sessions: [],
    stats: null,
    pattern: null
  });
  const [completedTasksCount, setCompletedTasksCount] = useState(0);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch multiple data sources in parallel
      const [sessionsRes, statsRes, patternRes, tasksRes] = await Promise.all([
        focusService.getSessionHistory({ 
          days: timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 7 
        }),
        focusService.getFocusStats(
          timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 7
        ),
        focusService.getFocusPattern(),
        taskService.getTasks({ 
          status: 'completed',
          limit: 1000
        })
      ]);

      setAnalyticsData({
        sessions: sessionsRes.sessions || [],
        stats: statsRes,
        pattern: patternRes
      });
      
      // Set the total completed tasks count
      setCompletedTasksCount(tasksRes.total || tasksRes.tasks.length);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTimeRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Calculate summary statistics
  const calculateSummaryStats = () => {
    const { sessions } = analyticsData;
    
    const totalFocusTime = sessions.reduce((sum, s) => 
      sum + (s.actualDuration || s.plannedDuration || 0), 0
    );
    
    const flowSessions = sessions.filter(s => 
      s.flowMetrics?.totalFlowTime > 0
    );
    
    const totalDistractions = sessions.reduce((sum, s) => 
      sum + (s.distractions?.blocked || 0), 0
    );
    
    const totalTasks = sessions.reduce((sum, s) => 
      sum + (s.completedTasks?.length || 0), 0
    );
    
    const avgScore = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + (s.focusScore || 0), 0) / sessions.length
      : 0;

    return {
      totalFocusTime,
      totalSessions: sessions.length,
      flowSessions: flowSessions.length,
      totalDistractions,
      totalTasks,
      avgScore: Math.round(avgScore)
    };
  };

  const stats = calculateSummaryStats();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" onClick={fetchAnalyticsData}>
              <Refresh />
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
            Focus Analytics
          </Typography>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            size="small"
          >
            <ToggleButton value="7d">7 Days</ToggleButton>
            <ToggleButton value="30d">30 Days</ToggleButton>
            <ToggleButton value="all">All Time</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Track your attention patterns and optimize your focus sessions
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1, width: 48, height: 48 }}>
                <TimeIcon />
              </Avatar>
              <Typography variant="h4" color="primary.main" sx={{ fontSize: '1.75rem' }}>
                {formatTime(stats.totalFocusTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Total Focus Time
              </Typography>
              {analyticsData.stats?.trends?.focusTime && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <TrendingUp color="success" fontSize="small" />
                  <Typography variant="caption" color="success.main">
                    +{analyticsData.stats.trends.focusTime.change}%
                  </Typography>
                </Box>
              )}
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
                {stats.flowSessions}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Flow Sessions
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.totalSessions > 0 
                  ? `${Math.round((stats.flowSessions / stats.totalSessions) * 100)}% rate`
                  : '0% rate'}
              </Typography>
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
                {stats.totalDistractions}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Distractions Blocked
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg {stats.totalSessions > 0 
                  ? Math.round(stats.totalDistractions / stats.totalSessions)
                  : 0}/session
              </Typography>
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
                {completedTasksCount}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Tasks Completed
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.totalSessions > 0 ? `Score: ${stats.avgScore}/100` : 'No focus sessions yet'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Productivity" />
        <Tab label="Sessions" />
        <Tab label="Insights" />
      </Tabs>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SessionHistoryChart 
              sessions={analyticsData.sessions} 
              timeRange={timeRange}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Achievements
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {analyticsData.sessions.length > 0 ? (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Longest Session
                        </Typography>
                        <Typography variant="h6">
                          {formatTime(Math.max(...analyticsData.sessions.map(s => 
                            s.actualDuration || s.plannedDuration || 0
                          )))}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Current Streak
                        </Typography>
                        <Typography variant="h6">
                          {userMetrics?.streak || 0} days
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Best Focus Score
                        </Typography>
                        <Typography variant="h6">
                          {Math.max(...analyticsData.sessions.map(s => s.focusScore || 0))}/100
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Complete focus sessions to unlock achievements
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Stats
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Average Session Duration
                    </Typography>
                    <Typography variant="h6">
                      {stats.totalSessions > 0
                        ? formatTime(Math.round(stats.totalFocusTime / stats.totalSessions))
                        : '0m'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Sessions This Week
                    </Typography>
                    <Typography variant="h6">
                      {analyticsData.sessions.filter(s => {
                        const sessionDate = new Date(s.startTime);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return sessionDate >= weekAgo;
                      }).length}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Flow State Rate
                    </Typography>
                    <Typography variant="h6">
                      {stats.totalSessions > 0
                        ? `${Math.round((stats.flowSessions / stats.totalSessions) * 100)}%`
                        : '0%'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Productivity Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ProductivityHeatmap sessions={analyticsData.sessions} />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Sessions Tab */}
      <TabPanel value={tabValue} index={2}>
        <SessionList sessions={analyticsData.sessions} />
      </TabPanel>

      {/* Insights Tab */}
      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <FocusInsights 
              sessions={analyticsData.sessions} 
              tasks={tasks}
            />
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default FocusAnalyticsV2;