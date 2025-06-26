import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  Checkbox,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Schedule as TimeIcon,
  Psychology as FlowIcon,
  TrendingUp as StatsIcon,
  Star as StarIcon,
  Share as ShareIcon,
  GetApp as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Assignment as TaskIcon,
  Block as BlockIcon,
  LocalFireDepartment as StreakIcon,
  EmojiEvents as TrophyIcon,
  RadioButtonUnchecked as UncheckedIcon,
  CheckCircleOutline as CompletedIcon
} from '@mui/icons-material';
import { useFocus } from '../../context/FocusContext';
import taskService from '../../services/taskService';
import { useNotification } from '../../context/NotificationContext';
import '../../styles/GlobalPages.css';

// Achievement badges system
const ACHIEVEMENTS = {
  'first_session': {
    name: 'First Focus',
    description: 'Completed your first focus session',
    icon: '🎯',
    rarity: 'common'
  },
  'flow_master': {
    name: 'Flow Master',
    description: 'Achieved flow state for 30+ minutes',
    icon: '🌊',
    rarity: 'rare'
  },
  'distraction_warrior': {
    name: 'Distraction Warrior',
    description: 'Blocked 50+ distractions in one session',
    icon: '🛡️',
    rarity: 'epic'
  },
  'early_bird': {
    name: 'Early Bird',
    description: 'Started a session before 8 AM',
    icon: '🌅',
    rarity: 'common'
  },
  'night_owl': {
    name: 'Night Owl',
    description: 'Focused after 10 PM',
    icon: '🦉',
    rarity: 'uncommon'
  },
  'task_crusher': {
    name: 'Task Crusher',
    description: 'Completed 5+ tasks in one session',
    icon: '💪',
    rarity: 'rare'
  },
  'consistency_king': {
    name: 'Consistency King',
    description: 'Maintained a 7-day focus streak',
    icon: '👑',
    rarity: 'legendary'
  }
};

// Calculate session score
const calculateSessionScore = (sessionData) => {
  let score = 0;
  
  const duration = sessionData.duration || 0;
  const tasksCompleted = sessionData.tasksCompleted || 0;
  const flowDuration = sessionData.flowDuration || 0;
  const distractionsBlocked = sessionData.distractionsBlocked || 0;
  const plannedDuration = sessionData.plannedDuration || sessionData.sessionDuration || duration || 1;
  
  // Base points for completion
  score += Math.min(duration, 120) * 0.5; // 0.5 points per minute, max 60
  
  // Task completion bonus
  score += tasksCompleted * 10;
  
  // Flow state bonus
  if (flowDuration > 0) {
    score += flowDuration * 2; // 2 points per flow minute
  }
  
  // Distraction resistance bonus
  score += distractionsBlocked * 5;
  
  // Completion rate bonus
  const completionRate = duration / plannedDuration;
  if (completionRate >= 1) score += 20; // Full completion bonus
  else if (completionRate >= 0.8) score += 10; // 80% completion bonus
  
  return Math.round(score);
};

// Check for new achievements
const checkAchievements = (sessionData, userMetrics) => {
  const newAchievements = [];
  
  // First session
  if (userMetrics.weeklyStats.sessionsCompleted === 1) {
    newAchievements.push('first_session');
  }
  
  // Flow master
  if (sessionData.flowDuration >= 30) {
    newAchievements.push('flow_master');
  }
  
  // Distraction warrior
  if (sessionData.distractionsBlocked >= 50) {
    newAchievements.push('distraction_warrior');
  }
  
  // Time-based achievements
  const startHour = new Date(sessionData.startTime).getHours();
  if (startHour < 8) newAchievements.push('early_bird');
  if (startHour >= 22) newAchievements.push('night_owl');
  
  // Task crusher
  if (sessionData.tasksCompleted >= 5) {
    newAchievements.push('task_crusher');
  }
  
  // Consistency king
  if (userMetrics.streak >= 7) {
    newAchievements.push('consistency_king');
  }
  
  return newAchievements;
};

const SessionCompletion = ({ sessionData, onStartNew, onViewAnalytics, onClose }) => {
  const { userMetrics, logFocusEvent } = useFocus();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [sessionRating, setSessionRating] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [newAchievements, setNewAchievements] = useState([]);
  const [pendingTaskCompletions, setPendingTaskCompletions] = useState(new Set());
  const [isUpdatingTasks, setIsUpdatingTasks] = useState(false);
  
  const sessionScore = calculateSessionScore(sessionData);
  const duration = sessionData.duration || 0;
  const plannedDuration = sessionData.plannedDuration || sessionData.sessionDuration || duration || 1;
  const completionRate = Math.round((duration / plannedDuration) * 100);
  
  useEffect(() => {
    const achievements = checkAchievements(sessionData, userMetrics);
    setNewAchievements(achievements);
    
    // Log session completion
    logFocusEvent('session_completed_view', {
      sessionId: sessionData.sessionId,
      score: sessionScore,
      achievements: achievements.length
    });
  }, [sessionData, userMetrics, sessionScore, logFocusEvent]);
  
  const handleShare = () => {
    const shareText = `🎯 Just completed a ${sessionData.duration}-minute focus session! \n` +
                     `✅ ${sessionData.tasksCompleted} tasks completed\n` +
                     `${sessionData.flowDuration > 0 ? `🌊 ${sessionData.flowDuration} minutes in flow state\n` : ''}` +
                     `Score: ${sessionScore} points\n\n#FizzTask #ProductivityWin`;
    
    if (navigator.share) {
      navigator.share({
        title: 'FizzTask Focus Session Complete',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText);
      // Could show a toast notification here
    }
  };
  
  const handleTaskCompletionToggle = (taskId) => {
    setPendingTaskCompletions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };
  
  const handleUpdateTaskCompletions = async () => {
    if (pendingTaskCompletions.size === 0) return;
    
    setIsUpdatingTasks(true);
    try {
      // Update each task
      const updatePromises = Array.from(pendingTaskCompletions).map(taskId =>
        taskService.updateTaskStatus(taskId, 'completed')
      );
      
      await Promise.all(updatePromises);
      
      showSuccess(`${pendingTaskCompletions.size} task(s) marked as completed`);
      
      // Clear the pending completions
      setPendingTaskCompletions(new Set());
      
      // Log the event
      logFocusEvent('post_session_task_completion', {
        taskIds: Array.from(pendingTaskCompletions),
        count: pendingTaskCompletions.size
      });
    } catch (error) {
      console.error('Error updating task completions:', error);
      showError('Failed to update task status');
    } finally {
      setIsUpdatingTasks(false);
    }
  };
  
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'default';
      case 'uncommon': return 'primary';
      case 'rare': return 'secondary';
      case 'epic': return 'warning';
      case 'legendary': return 'error';
      default: return 'default';
    }
  };
  
  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'error';
  };
  
  return (
    <div className="page-container">
      <div className="page-content">
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 500 }}>
            Focus Session Complete
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Great work! Here's your session summary and achievements.
          </Typography>
        </Box>
        
        {/* Score Card */}
        <Card sx={{ 
          mb: 3, 
          bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
          color: theme => theme.palette.text.primary
        }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <TrophyIcon sx={{ fontSize: 60, mb: 2, color: 'warning.main' }} />
          <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
            {sessionScore}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            points earned
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {Math.round(sessionData.duration || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                minutes focused
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {sessionData.tasksCompleted || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                tasks completed
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                {completionRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                completion rate
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* New Achievements */}
      {newAchievements.length > 0 && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            🎉 New Achievements Unlocked!
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {newAchievements.map((achievementId) => {
              const achievement = ACHIEVEMENTS[achievementId];
              return (
                <Chip
                  key={achievementId}
                  label={`${achievement.icon} ${achievement.name}`}
                  color={getRarityColor(achievement.rarity)}
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
              );
            })}
          </Box>
        </Alert>
      )}
      
      {/* Session Summary */}
      <Grid container spacing={3}>
        {/* Performance Metrics */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StatsIcon color="primary" /> Session Performance
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Completion Rate</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {completionRate}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={completionRate}
                  color={getPerformanceColor(completionRate)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              {sessionData.flowDuration > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Flow State Duration</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {Math.round(sessionData.flowDuration || 0)} minutes
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.round(((sessionData.flowDuration || 0) / (sessionData.duration || 1)) * 100))}
                    color="secondary"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Time Focused
                      </Typography>
                      <Typography variant="h6">
                        {Math.floor((sessionData.duration || 0) / 60)}h {Math.round((sessionData.duration || 0) % 60)}m
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BlockIcon color="warning" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Distractions Blocked
                      </Typography>
                      <Typography variant="h6">
                        {sessionData.distractionsBlocked || 0}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Task Summary */}
          {sessionData.tasks && sessionData.tasks.length > 0 && (
            <Card sx={{ mt: 2, border: 2, borderColor: 'primary.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TaskIcon color="primary" /> Tasks ({sessionData.tasksCompleted}/{sessionData.tasks.length})
                  </Typography>
                  {pendingTaskCompletions.size > 0 && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleUpdateTaskCompletions}
                      disabled={isUpdatingTasks}
                      startIcon={<CheckIcon />}
                    >
                      Mark {pendingTaskCompletions.size} as Complete
                    </Button>
                  )}
                </Box>
                <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, p: 1 }}>
                  {sessionData.tasks.map((task, index) => {
                    const taskId = typeof task === 'string' ? task : (task.id || task._id);
                    const taskTitle = typeof task === 'string' ? `Task ${taskId}` : task.title;
                    const taskDuration = typeof task === 'object' ? task.estimatedDuration : null;
                    const isCompleted = sessionData.completed.includes(taskId);
                    const isPendingCompletion = pendingTaskCompletions.has(taskId);
                    
                    
                    return (
                      <Box 
                        key={index}
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          mb: 1,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          bgcolor: isPendingCompletion ? 'action.selected' : 'background.paper',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {isCompleted ? (
                            <CheckIcon color="success" />
                          ) : isPendingCompletion ? (
                            <CompletedIcon color="primary" />
                          ) : (
                            <TaskIcon color="disabled" />
                          )}
                          <Box>
                            <Typography 
                              variant="body1"
                              sx={{
                                textDecoration: isCompleted ? 'line-through' : 'none',
                                opacity: isCompleted ? 0.7 : 1
                              }}
                            >
                              {taskTitle}
                            </Typography>
                            {taskDuration && (
                              <Typography variant="caption" color="text.secondary">
                                {taskDuration} min
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {isCompleted ? (
                            <Chip label="Completed" size="small" color="success" />
                          ) : (
                            <>
                              {!isPendingCompletion && (
                                <Typography variant="caption" color="info.main" sx={{ mr: 1 }}>
                                  Click checkbox →
                                </Typography>
                              )}
                              <Checkbox
                                checked={isPendingCompletion}
                                onChange={() => handleTaskCompletionToggle(taskId)}
                                disabled={isUpdatingTasks}
                                sx={{
                                  '& .MuiSvgIcon-root': { 
                                    fontSize: 32,
                                    color: isPendingCompletion ? 'primary.main' : 'action.active'
                                  },
                                  bgcolor: 'background.default',
                                  borderRadius: 1,
                                  p: 1,
                                  '&:hover': {
                                    bgcolor: 'action.hover'
                                  }
                                }}
                              />
                            </>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
                {sessionData.tasks.some(task => {
                  const taskId = typeof task === 'string' ? task : (task.id || task._id);
                  return !sessionData.completed.includes(taskId);
                }) && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Did you complete any tasks you forgot to mark during the session? Check the boxes above to mark them as complete!
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                      Look for checkboxes on the right side of each uncompleted task.
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
        
        {/* Side Panel */}
        <Grid item xs={12} md={4}>
          {/* Session Rating */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <StarIcon color="warning" /> Rate This Session
              </Typography>
              <Rating
                value={sessionRating}
                onChange={(event, newValue) => setSessionRating(newValue)}
                size="large"
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                How productive did you feel?
              </Typography>
            </CardContent>
          </Card>
          
          {/* Quick Stats */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StreakIcon color="warning" /> Today's Progress
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <StreakIcon color="warning" />
                  <Typography variant="body2">
                    {userMetrics.streak} day streak
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TimeIcon color="primary" />
                  <Typography variant="body2">
                    {Math.round(userMetrics.todaysFocusTime || 0)} min focused today
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StatsIcon color="success" />
                  <Typography variant="body2">
                    {userMetrics.weeklyStats.sessionsCompleted} sessions this week
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<FlowIcon />}
              onClick={onStartNew}
              size="large"
            >
              Start New Session
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<StatsIcon />}
              onClick={() => navigate('/focus/analytics')}
            >
              View Analytics
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShare}
            >
              Share Results
            </Button>
            
            <Button
              variant="text"
              onClick={onClose}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Grid>
      </Grid>
      
        {/* Detailed Breakdown */}
        <Card sx={{ mt: 3 }}>
          <Accordion defaultExpanded>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                '&:hover': {
                  backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'
                }
              }}
            >
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StatsIcon /> Detailed Session Breakdown
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' 
                  }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimeIcon color="primary" /> Time Distribution
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Planned Duration:</Typography>
                        <Typography variant="body2" fontWeight="500">
                          {Math.round(sessionData.plannedDuration || sessionData.sessionDuration || sessionData.duration || 0)} min
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Actual Duration:</Typography>
                        <Typography variant="body2" fontWeight="500">
                          {Math.round(sessionData.duration || 0)} min
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ textAlign: 'center', mt: 1 }}>
                        <Typography variant="h4" color="primary" fontWeight="600">
                          {Math.round(sessionData.duration || 0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          total minutes
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(100, (sessionData.duration / (sessionData.plannedDuration || sessionData.sessionDuration || sessionData.duration || 1)) * 100)} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: 'primary.main'
                              }
                            }} 
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' 
                  }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FlowIcon color="secondary" /> Focus Quality
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Interruptions Blocked:</Typography>
                        <Typography variant="body2" fontWeight="500">
                          {sessionData.distractionsBlocked || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Task Switches:</Typography>
                        <Typography variant="body2" fontWeight="500">
                          {sessionData.taskSwitches || 0}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ textAlign: 'center', mt: 1 }}>
                        <Typography variant="h4" color="secondary" fontWeight="600">
                          {Math.round((sessionData.focusScore || 0) * 100)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          focus score
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.round((sessionData.focusScore || 0) * 100)} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: 'secondary.main'
                              }
                            }} 
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' 
                  }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrophyIcon color="warning" /> Performance Score
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Session Score:</Typography>
                        <Typography variant="body2" fontWeight="500">
                          {sessionScore} pts
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Performance:</Typography>
                        <Typography variant="body2" fontWeight="500" color={getPerformanceColor(completionRate)}>
                          {completionRate >= 90 ? 'Excellent' : completionRate >= 70 ? 'Good' : 'Fair'}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ textAlign: 'center', mt: 1 }}>
                        <Typography variant="h4" color="primary" fontWeight="600">
                          {sessionScore}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          total points
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(100, (sessionScore / 200) * 100)} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: 'primary.main'
                              }
                            }} 
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Card>
      </div>
    </div>
  );
};

export default SessionCompletion;