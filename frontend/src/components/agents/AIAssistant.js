import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  IconButton,
  Collapse,
  Stack,
  Paper,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Psychology as AIIcon,
  Schedule as ScheduleIcon,
  Task as TaskIcon,
  Email as EmailIcon,
  TipsAndUpdates as TipsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  AutoAwesome as AutoAwesomeIcon,
  EmojiObjects as InsightIcon,
  PlayArrow as StartIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const AIAssistant = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dailyPlan, setDailyPlan] = useState(null);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    tasks: true,
    focus: false,
    emails: false,
    coaching: false
  });

  // Load productivity insights on mount
  useEffect(() => {
    loadProductivityInsights();
  }, []);

  const loadProductivityInsights = async () => {
    try {
      const response = await api.get('/api/agents/productivity-insights');
      setInsights(response.data);
    } catch (err) {
      console.error('Failed to load insights:', err);
    }
  };

  const generateDailyPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/agents/daily-plan', {
        includeEmails: true,
        energyLevel: user?.currentEnergyLevel || 5
      });
      setDailyPlan(response.data.dailyPlan);
    } catch (err) {
      setError('Failed to generate daily plan. Please try again.');
      console.error('Daily plan error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getEnergyColor = (energy) => {
    switch (energy) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <AIIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          AI Productivity Assistant
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Let AI help you plan your day and boost your productivity
        </Typography>
      </Box>

      {/* Quick Insights */}
      {insights && (
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InsightIcon />
              Today's Insight
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {insights.motivationalMessage}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              <strong>Focus on:</strong> {insights.topPriority}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Generate Plan Button */}
      {!dailyPlan && (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
            onClick={generateDailyPlan}
            disabled={loading}
            sx={{
              background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
              color: 'white',
              px: 4,
              py: 1.5
            }}
          >
            {loading ? 'Generating Your Daily Plan...' : 'Generate AI Daily Plan'}
          </Button>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Daily Plan Results */}
      {dailyPlan && (
        <Stack spacing={3}>
          {/* Prioritized Tasks Section */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TaskIcon />
                  Prioritized Tasks
                </Typography>
                <IconButton onClick={() => toggleSection('tasks')}>
                  {expandedSections.tasks ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedSections.tasks}>
                <List>
                  {dailyPlan.prioritizedTasks?.slice(0, 5).map((task, index) => (
                    <ListItem key={task.taskId} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Chip 
                          label={`#${task.priority}`} 
                          size="small" 
                          color="primary"
                          sx={{ minWidth: 40 }}
                        />
                        <Typography variant="subtitle1" sx={{ flex: 1 }}>
                          {task.title}
                        </Typography>
                        <Chip 
                          label={task.estimatedEnergy} 
                          size="small" 
                          color={getEnergyColor(task.estimatedEnergy)}
                        />
                        <Chip 
                          label={task.bestTimeSlot} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 7 }}>
                        {task.reasoning}
                      </Typography>
                      {index < dailyPlan.prioritizedTasks.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </ListItem>
                  ))}
                </List>
                
                {dailyPlan.generalAdvice && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Strategy:</strong> {dailyPlan.generalAdvice}
                    </Typography>
                  </Alert>
                )}
              </Collapse>
            </CardContent>
          </Card>

          {/* Focus Session Plan */}
          {dailyPlan.focusSession && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon />
                    Recommended Focus Session
                  </Typography>
                  <IconButton onClick={() => toggleSection('focus')}>
                    {expandedSections.focus ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                
                <Collapse in={expandedSections.focus}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Chip 
                        label={`${dailyPlan.focusSession.recommendedDuration} min`} 
                        color="primary"
                        icon={<ScheduleIcon />}
                      />
                      <Chip 
                        label={dailyPlan.focusSession.sessionType} 
                        variant="outlined"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      <strong>Expected Outcome:</strong> {dailyPlan.focusSession.expectedOutcome}
                    </Typography>
                    
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Focus Tips:
                      </Typography>
                      <List dense>
                        {dailyPlan.focusSession.focusTips?.map((tip, index) => (
                          <ListItem key={index}>
                            <ListItemIcon sx={{ minWidth: 30 }}>
                              <TipsIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText primary={tip} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                    
                    <Button
                      variant="contained"
                      startIcon={<StartIcon />}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Start This Session
                    </Button>
                  </Stack>
                </Collapse>
              </CardContent>
            </Card>
          )}

          {/* New Tasks from Email */}
          {dailyPlan.newTasksFromEmail?.length > 0 && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon />
                    Tasks Found in Emails ({dailyPlan.newTasksFromEmail.length})
                  </Typography>
                  <IconButton onClick={() => toggleSection('emails')}>
                    {expandedSections.emails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                
                <Collapse in={expandedSections.emails}>
                  <List>
                    {dailyPlan.newTasksFromEmail.map((task, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={task.title}
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary">
                                {task.description}
                              </Typography>
                              <Box sx={{ mt: 1 }}>
                                <Chip 
                                  label={getPriorityColor(task.priority)} 
                                  size="small" 
                                  color={getPriorityColor(task.priority)}
                                  sx={{ mr: 1 }}
                                />
                                {task.dueDate && (
                                  <Chip 
                                    label={`Due: ${new Date(task.dueDate).toLocaleDateString()}`} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Button variant="outlined" sx={{ mt: 2 }}>
                    Add All to Task List
                  </Button>
                </Collapse>
              </CardContent>
            </Card>
          )}

          {/* Coaching Insights */}
          {dailyPlan.coachingInsights && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Psychology />
                    Productivity Coaching
                  </Typography>
                  <IconButton onClick={() => toggleSection('coaching')}>
                    {expandedSections.coaching ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                
                <Collapse in={expandedSections.coaching}>
                  <Stack spacing={2}>
                    {dailyPlan.coachingInsights.insights?.map((insight, index) => (
                      <Paper key={index} sx={{ p: 2, bgcolor: 'background.default' }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {insight.message}
                        </Typography>
                        {insight.recommendation && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Recommendation:</strong> {insight.recommendation}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                    
                    {dailyPlan.coachingInsights.progressHighlight && (
                      <Alert severity="success">
                        <Typography variant="body2">
                          <strong>Great job!</strong> {dailyPlan.coachingInsights.progressHighlight}
                        </Typography>
                      </Alert>
                    )}
                  </Stack>
                </Collapse>
              </CardContent>
            </Card>
          )}

          {/* Regenerate Button */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={generateDailyPlan}
              disabled={loading}
            >
              Regenerate Plan
            </Button>
          </Box>
        </Stack>
      )}

      {/* Floating AI Assistant Button */}
      <Tooltip title="AI Assistant">
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <AIIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default AIAssistant;