import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Alert
} from '@mui/material';
import {
  Psychology as BrainIcon,
  Timer as TimerIcon,
  Battery80 as EnergyIcon,
  AutoFixHigh as AiIcon,
  PlayArrow as StartIcon,
  Settings as SettingsIcon,
  TrendingUp as StatsIcon,
  LocalFireDepartment as StreakIcon
} from '@mui/icons-material';
import { useFocus } from '../../context/FocusContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Smart task selection algorithm
const selectTasksForTimeBlock = (tasks, availableMinutes, energyLevel) => {
  if (!tasks || tasks.length === 0) return [];
  
  // Filter tasks based on energy level
  const suitableTasks = tasks.filter(task => {
    const taskEnergy = {
      high: 0.8,
      medium: 0.5,
      low: 0.3
    }[task.priority] || 0.5;
    
    return taskEnergy <= energyLevel + 0.2; // Allow slight stretch
  });
  
  // Sort by priority and estimated duration
  const sortedTasks = suitableTasks.sort((a, b) => {
    const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
    const aPriority = priorityWeight[a.priority] || 2;
    const bPriority = priorityWeight[b.priority] || 2;
    
    if (aPriority !== bPriority) return bPriority - aPriority;
    return (a.estimatedDuration || 30) - (b.estimatedDuration || 30);
  });
  
  // Select tasks that fit in the available time
  const selectedTasks = [];
  let remainingTime = availableMinutes;
  
  for (const task of sortedTasks) {
    const taskDuration = task.estimatedDuration || 30;
    if (taskDuration <= remainingTime && selectedTasks.length < 5) {
      selectedTasks.push(task);
      remainingTime -= taskDuration;
    }
  }
  
  return selectedTasks;
};

// Calculate cognitive load visualization
const getCognitiveLoadColor = (load) => {
  if (load <= 0.3) return 'success';
  if (load <= 0.6) return 'warning';
  return 'error';
};

const FocusModeLauncher = ({ tasks = [], onStartSession }) => {
  const { 
    focusSession, 
    focusPreferences, 
    userMetrics, 
    startFocusSession,
    setFocusPreferences 
  } = useFocus();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [expanded, setExpanded] = useState(false);
  const [customDuration, setCustomDuration] = useState(focusPreferences.defaultDuration || 90);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [environment, setEnvironment] = useState({
    ambientSound: focusPreferences.ambientSound || 'lofi',
    blockNotifications: true,
    blockSites: true,
    theme: 'focus_dark'
  });
  
  // Get next available time slot from calendar (mock for now)
  const getNextAvailableSlot = () => {
    const now = new Date();
    const hour = now.getHours();
    
    // Find next 2-hour block
    let nextSlot = 120; // 2 hours default
    
    // Reduce if it's late in the day
    if (hour >= 16) nextSlot = 60;
    if (hour >= 18) nextSlot = 30;
    
    return {
      duration: nextSlot,
      until: `${Math.floor(nextSlot/60)}h ${nextSlot%60}m free`
    };
  };
  
  const nextSlot = getNextAvailableSlot();
  
  // Update local state when preferences change
  useEffect(() => {
    if (focusPreferences.defaultDuration) {
      setCustomDuration(focusPreferences.defaultDuration);
    }
    if (focusPreferences.ambientSound) {
      setEnvironment(prev => ({
        ...prev,
        ambientSound: focusPreferences.ambientSound
      }));
    }
  }, [focusPreferences.defaultDuration, focusPreferences.ambientSound]);
  
  // Auto-select tasks when duration changes
  useEffect(() => {
    const smartTasks = selectTasksForTimeBlock(
      tasks, 
      customDuration, 
      userMetrics?.currentEnergyLevel || 0.7
    );
    setSelectedTasks(smartTasks);
  }, [tasks, customDuration, userMetrics?.currentEnergyLevel]);
  
  const totalSelectedDuration = selectedTasks.reduce(
    (sum, task) => sum + (task.estimatedDuration || 30), 
    0
  );
  
  const cognitiveLoad = selectedTasks.reduce((sum, task) => {
    const weights = { urgent: 0.4, high: 0.3, medium: 0.2, low: 0.1 };
    return sum + (weights[task.priority] || 0.2);
  }, 0);
  
  const handleQuickStart = async (duration) => {
    const quickTasks = selectTasksForTimeBlock(tasks, duration, userMetrics?.currentEnergyLevel || 0.7);
    
    try {
      await startFocusSession({
        duration,
        tasks: quickTasks,
        environment
      });
      navigate('/focus');
      onStartSession?.();
    } catch (error) {
      console.error('Failed to start quick session:', error);
    }
  };
  
  const handleCustomStart = async () => {
    try {
      await startFocusSession({
        duration: customDuration,
        tasks: selectedTasks,
        environment
      });
      navigate('/focus');
      onStartSession?.();
    } catch (error) {
      console.error('Failed to start custom session:', error);
    }
  };
  
  const getEnergyEmoji = (level) => {
    if (level >= 0.8) return '🔥';
    if (level >= 0.6) return '⚡';
    if (level >= 0.4) return '💡';
    return '🪫';
  };
  
  const getTimeOfDayMessage = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) return 'Perfect time for deep work!';
    if (hour >= 10 && hour < 12) return 'Still good focus time.';
    if (hour >= 12 && hour < 14) return 'Consider lighter tasks.';
    if (hour >= 14 && hour < 16) return 'Good for creative work.';
    if (hour >= 16 && hour < 18) return 'Wrap up your day.';
    return 'Late night focus session?';
  };
  
  if (focusSession.active) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Focus session in progress. Complete your current session to start a new one.
      </Alert>
    );
  }
  
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BrainIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h2">
            Ready to Focus?
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            {(userMetrics?.streak || 0) > 0 && (
              <Chip 
                icon={<StreakIcon />} 
                label={`${userMetrics.streak} day streak!`}
                color="warning"
                size="small"
              />
            )}
            <Chip 
              icon={<EnergyIcon />} 
              label={`${getEnergyEmoji(userMetrics?.currentEnergyLevel || 0.7)} ${Math.round((userMetrics?.currentEnergyLevel || 0.7) * 100)}% energy`}
              size="small"
            />
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {getTimeOfDayMessage()} You have {nextSlot.until} until your next commitment.
        </Typography>
        
        {/* AI Suggested Session */}
        <Card variant="outlined" sx={{ mb: 3, bgcolor: 'primary.50' }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AiIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight={600}>
                AI Suggested Session
              </Typography>
            </Box>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box sx={{ mb: 2 }}>
                  {selectedTasks.slice(0, 3).map((task, index) => (
                    <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        ▶ {task.title} ({task.estimatedDuration || 30} min)
                      </Typography>
                      <Chip 
                        label={task.priority} 
                        size="small" 
                        color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}
                      />
                    </Box>
                  ))}
                  {selectedTasks.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{selectedTasks.length - 3} more tasks
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption">
                    Total: {totalSelectedDuration} min
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption">Cognitive Load:</Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={cognitiveLoad * 100} 
                      color={getCognitiveLoadColor(cognitiveLoad)}
                      sx={{ width: 60, height: 6 }}
                    />
                    <Typography variant="caption">
                      {Math.round(cognitiveLoad * 100)}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<StartIcon />}
                  onClick={() => handleQuickStart(nextSlot.duration)}
                  sx={{ mb: 1 }}
                >
                  Start {Math.floor(nextSlot.duration/60)}h {nextSlot.duration%60}m Session
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  startIcon={<SettingsIcon />}
                  onClick={() => setExpanded(!expanded)}
                >
                  Customize
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {/* Quick Start Options */}
        <Typography variant="subtitle2" gutterBottom>
          Quick Start
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleQuickStart(25)}
              sx={{ py: 1.5, flexDirection: 'column' }}
            >
              <TimerIcon sx={{ mb: 0.5 }} />
              <Typography variant="caption">25 min</Typography>
              <Typography variant="caption" color="text.secondary">Quick Focus</Typography>
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleQuickStart(45)}
              sx={{ py: 1.5, flexDirection: 'column' }}
            >
              <TimerIcon sx={{ mb: 0.5 }} />
              <Typography variant="caption">45 min</Typography>
              <Typography variant="caption" color="text.secondary">Regular</Typography>
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleQuickStart(90)}
              sx={{ py: 1.5, flexDirection: 'column' }}
            >
              <TimerIcon sx={{ mb: 0.5 }} />
              <Typography variant="caption">90 min</Typography>
              <Typography variant="caption" color="text.secondary">Deep Work</Typography>
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setExpanded(true)}
              sx={{ py: 1.5, flexDirection: 'column' }}
            >
              <SettingsIcon sx={{ mb: 0.5 }} />
              <Typography variant="caption">Custom</Typography>
              <Typography variant="caption" color="text.secondary">Configure</Typography>
            </Button>
          </Grid>
        </Grid>
        
        {/* Expanded Configuration */}
        {expanded && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Custom Session Configuration
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" gutterBottom>
                  Duration: {customDuration} minutes
                </Typography>
                <Slider
                  value={customDuration}
                  onChange={(e, value) => setCustomDuration(value)}
                  min={15}
                  max={180}
                  step={5}
                  marks={[
                    { value: 25, label: '25m' },
                    { value: 60, label: '1h' },
                    { value: 90, label: '1.5h' },
                    { value: 120, label: '2h' }
                  ]}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Ambient Sound</InputLabel>
                  <Select
                    value={environment.ambientSound}
                    label="Ambient Sound"
                    onChange={(e) => setEnvironment(prev => ({
                      ...prev,
                      ambientSound: e.target.value
                    }))}
                  >
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="rain">Rain</MenuItem>
                    <MenuItem value="lofi">Lo-fi Hip Hop</MenuItem>
                    <MenuItem value="forest">Forest Sounds</MenuItem>
                    <MenuItem value="whitenoise">White Noise</MenuItem>
                    <MenuItem value="binaural">Binaural Beats</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={environment.blockNotifications}
                        onChange={(e) => setEnvironment(prev => ({
                          ...prev,
                          blockNotifications: e.target.checked
                        }))}
                      />
                    }
                    label="Block Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={environment.blockSites}
                        onChange={(e) => setEnvironment(prev => ({
                          ...prev,
                          blockSites: e.target.checked
                        }))}
                      />
                    }
                    label="Block Distracting Sites"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={environment.theme === 'focus_dark'}
                        onChange={(e) => setEnvironment(prev => ({
                          ...prev,
                          theme: e.target.checked ? 'focus_dark' : 'normal'
                        }))}
                      />
                    }
                    label="Focus Dark Mode"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleCustomStart}
                  startIcon={<StartIcon />}
                  disabled={selectedTasks.length === 0}
                  sx={{ mr: 2 }}
                >
                  Start Custom Session
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setExpanded(false)}
                >
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </>
        )}
        
        {/* Today's Stats */}
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <StatsIcon sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Today: {userMetrics?.todaysFocusTime || 0} min focused
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {userMetrics?.weeklyStats?.distractionsBlocked || 0} distractions blocked this week
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FocusModeLauncher;