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
  Rating
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
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { useFocus } from '../../context/FocusContext';

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
  
  // Base points for completion
  score += Math.min(sessionData.duration, 120) * 0.5; // 0.5 points per minute, max 60
  
  // Task completion bonus
  score += sessionData.tasksCompleted * 10;
  
  // Flow state bonus
  if (sessionData.flowDuration > 0) {
    score += sessionData.flowDuration * 2; // 2 points per flow minute
  }
  
  // Distraction resistance bonus
  score += sessionData.distractionsBlocked * 5;
  
  // Completion rate bonus
  const completionRate = sessionData.duration / sessionData.plannedDuration;
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
  const navigate = useNavigate();
  const [sessionRating, setSessionRating] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [newAchievements, setNewAchievements] = useState([]);
  
  const sessionScore = calculateSessionScore(sessionData);
  const completionRate = Math.round((sessionData.duration / sessionData.plannedDuration) * 100);
  
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
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <TrophyIcon sx={{ fontSize: 60, mb: 2, color: '#FFD700' }} />
          <Typography variant="h4" gutterBottom>
            Focus Session Complete!
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {sessionScore}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            points earned
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5">{sessionData.duration}</Typography>
              <Typography variant="caption">minutes focused</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5">{sessionData.tasksCompleted}</Typography>
              <Typography variant="caption">tasks completed</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5">{completionRate}%</Typography>
              <Typography variant="caption">completion rate</Typography>
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
              <Typography variant="h6" gutterBottom>
                Session Performance
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
                      {sessionData.flowDuration} minutes
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(sessionData.flowDuration / sessionData.duration) * 100}
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
                        {Math.floor(sessionData.duration / 60)}h {sessionData.duration % 60}m
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
                        {sessionData.distractionsBlocked}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Task Summary */}
          {sessionData.tasks && sessionData.tasks.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tasks Completed ({sessionData.tasksCompleted}/{sessionData.tasks.length})
                </Typography>
                <List dense>
                  {sessionData.tasks.map((task, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        {sessionData.completed.includes(task.id) ? (
                          <CheckIcon color="success" />
                        ) : (
                          <TaskIcon color="disabled" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={task.estimatedDuration ? `${task.estimatedDuration} min` : null}
                        sx={{
                          textDecoration: sessionData.completed.includes(task.id) ? 'line-through' : 'none',
                          opacity: sessionData.completed.includes(task.id) ? 0.7 : 1
                        }}
                      />
                      {sessionData.completed.includes(task.id) && (
                        <Chip label="Completed" size="small" color="success" />
                      )}
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>
        
        {/* Side Panel */}
        <Grid item xs={12} md={4}>
          {/* Session Rating */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Rate This Session
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
              <Typography variant="h6" gutterBottom>
                Today's Progress
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
                    {userMetrics.todaysFocusTime} min focused today
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
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Detailed Session Breakdown</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Time Distribution
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Planned Duration: {sessionData.plannedDuration} min
                  </Typography>
                  <Typography variant="body2">
                    Actual Duration: {sessionData.duration} min
                  </Typography>
                  {sessionData.flowDuration > 0 && (
                    <Typography variant="body2">
                      Flow State: {sessionData.flowDuration} min
                    </Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Focus Quality
                </Typography>
                <Box>
                  <Typography variant="body2">
                    Focus Score: {Math.round(sessionData.focusScore * 100)}%
                  </Typography>
                  <Typography variant="body2">
                    Interruptions: {sessionData.distractionsBlocked}
                  </Typography>
                  <Typography variant="body2">
                    Task Switches: {sessionData.taskSwitches || 0}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Card>
    </Box>
  );
};

export default SessionCompletion;