import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  ButtonGroup,
  Grid,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Slider,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  PlayArrow,
  Tune,
  Analytics,
  Task,
  Timer,
  Psychology,
  BatteryChargingFull,
  Schedule,
  Coffee,
  GpsFixed,
  Lightbulb,
  AutoAwesome
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useFocus } from '../../context/FocusContext';
import { useNavigate } from 'react-router-dom';
import DistractionBlocker from './DistractionBlocker';
import SmartTaskSelector from './SmartTaskSelector';
import EnergyLevelTracker from './EnergyLevelTracker';
import focusService from '../../services/focusService';

const QUICK_START_OPTIONS = [
  { duration: 25, label: '25 min', description: 'Quick Focus' },
  { duration: 45, label: '45 min', description: 'Regular Session' },
  { duration: 90, label: '90 min', description: 'Deep Work' }
];

const SESSION_TYPES = [
  { value: 'deep_work', label: 'Deep Work', icon: Psychology },
  { value: 'regular', label: 'Regular', icon: Task },
  { value: 'light', label: 'Light', icon: Coffee },
  { value: 'creative', label: 'Creative', icon: Psychology }
];

const FocusModeLauncherV2 = ({ tasks = [] }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { startFocusSession, focusPreferences, userMetrics, calculateCurrentEnergy } = useFocus();
  
  const [duration, setDuration] = useState(45);
  const [sessionType, setSessionType] = useState('regular');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [energyLevel, setEnergyLevel] = useState(7);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pauseNotifications, setPauseNotifications] = useState(true);
  const [ambientSound, setAmbientSound] = useState('lofi');
  const [suggestedTasks, setSuggestedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [distractionSettings, setDistractionSettings] = useState({
    blockNotifications: true,
    blockSites: false,
    showReminders: true,
    strictMode: false
  });
  const [useSmartSelection, setUseSmartSelection] = useState(true);
  const [recentSessions, setRecentSessions] = useState([]);
  const [smartSelectedTasks, setSmartSelectedTasks] = useState([]);

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      if (!useSmartSelection) {
        loadSuggestedTasks();
      }
    }
    const currentEnergy = calculateCurrentEnergy ? calculateCurrentEnergy() : 0.7;
    setEnergyLevel(Math.round(currentEnergy * 10));
    
    // Load recent sessions for smart selection
    loadRecentSessions();
  }, [tasks, duration, useSmartSelection]);

  // Debug effect
  useEffect(() => {
    console.log('Smart Selection State:', {
      useSmartSelection,
      smartSelectedTasks,
      selectedTasks,
      smartCount: smartSelectedTasks.length,
      manualCount: selectedTasks.length
    });
  }, [useSmartSelection, smartSelectedTasks, selectedTasks]);

  const loadRecentSessions = async () => {
    try {
      const response = await focusService.getSessionHistory({ days: 7 });
      setRecentSessions(response.sessions || []);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
    }
  };

  const loadSuggestedTasks = async () => {
    // Filter incomplete tasks - include all priority levels
    const incompleteTasks = tasks.filter(task => 
      task.status !== 'completed' && 
      (!task.estimatedDuration || task.estimatedDuration <= duration)
    );

    // Sort by priority and due date
    const sorted = incompleteTasks.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority] || 1;
      const bPriority = priorityWeight[b.priority] || 1;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      
      return a.dueDate ? -1 : 1;
    });

    // Take top tasks that fit in the duration
    let totalTime = 0;
    const suggested = [];
    
    for (const task of sorted) {
      const taskDuration = task.estimatedDuration || 30;
      if (totalTime + taskDuration <= duration - 10) { // Leave 10 min buffer
        suggested.push(task);
        totalTime += taskDuration;
      }
      if (suggested.length >= 4) break; // Max 4 tasks per session
    }

    setSuggestedTasks(suggested);
    setSelectedTasks(suggested.map(t => t._id));
  };

  const handleQuickStart = (option) => {
    setDuration(option.duration);
    if (option.duration <= 25) {
      setSessionType('light');
    } else if (option.duration >= 90) {
      setSessionType('deep_work');
    } else {
      setSessionType('regular');
    }
  };

  const handleTaskToggle = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleStartSession = async () => {
    const taskIdsToUse = useSmartSelection ? smartSelectedTasks : selectedTasks;
    
    console.log('Starting focus session with:', {
      duration,
      sessionType,
      useSmartSelection,
      taskIds: taskIdsToUse,
      tasksCount: taskIdsToUse.length
    });
    
    if (taskIdsToUse.length === 0) {
      alert('Please select at least one task');
      return;
    }
    
    setIsLoading(true);
    try {
      const selectedTaskObjects = tasks.filter(t => taskIdsToUse.includes(t._id || t.id));
      
      console.log('Starting session with tasks:', selectedTaskObjects);
      
      const sessionId = await startFocusSession({
        duration,
        sessionType,
        tasks: selectedTaskObjects,
        environment: {
          ambientSound: showAdvanced ? ambientSound : 'lofi',
          pauseNotifications,
          blockNotifications: distractionSettings.blockNotifications,
          blockSites: distractionSettings.blockSites,
          theme: 'focus_dark',
          strictMode: distractionSettings.strictMode,
          emergencyContacts: [],
          customBlockedSites: []
        }
      });
      
      console.log('Session started with ID:', sessionId);
      
      // Don't reload - the state should update automatically
      
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start focus session. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const getNextFreeTime = () => {
    // TODO: Integrate with calendar API
    const now = new Date();
    const nextHour = new Date(now.setHours(now.getHours() + 1, 0, 0, 0));
    return {
      start: nextHour,
      duration: 120 // 2 hours free
    };
  };

  const freeTime = getNextFreeTime();
  const totalSelectedTime = suggestedTasks
    .filter(t => selectedTasks.includes(t._id))
    .reduce((sum, t) => sum + (t.estimatedDuration || 30), 0);

  return (
    <Card 
      sx={{ 
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(145deg, #1e1e1e 0%, #2d2d2d 100%)'
          : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
        boxShadow: theme.shadows[4]
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 1 }}>
            <GpsFixed sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h5" component="div">
              Ready to Focus?
            </Typography>
          </Box>
          <IconButton 
            size="small" 
            onClick={() => navigate('/focus/analytics')}
            sx={{ color: theme => theme.palette.text.primary }}
          >
            <Analytics />
          </IconButton>
        </Box>

        {freeTime && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Your next {Math.floor(freeTime.duration / 60)} hours are free until your next commitment
          </Alert>
        )}

        {/* Quick Start Options */}
        <Box sx={{ mb: 3, overflowX: { xs: 'auto', sm: 'visible' } }}>
          <ButtonGroup fullWidth variant="outlined" sx={{ minWidth: { xs: '400px', sm: 'auto' }, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            {QUICK_START_OPTIONS.map((option) => (
              <Button
                key={option.duration}
                onClick={() => handleQuickStart(option)}
                variant={duration === option.duration ? 'contained' : 'outlined'}
                sx={{ py: { xs: 1.5, sm: 2 }, minHeight: { xs: 60, sm: 'auto' }, flex: { xs: '1 1 50%', sm: '1' } }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>{option.label}</Typography>
                  <Typography variant="caption" display="block" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    {option.description}
                  </Typography>
                </Box>
              </Button>
            ))}
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant={showAdvanced ? 'contained' : 'outlined'}
              sx={{ py: { xs: 1.5, sm: 2 }, minHeight: { xs: 60, sm: 'auto' }, flex: { xs: '1 1 100%', sm: '1' } }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Custom</Typography>
                <Typography variant="caption" display="block" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                  Session
                </Typography>
              </Box>
            </Button>
          </ButtonGroup>
        </Box>

        {/* Smart Task Selection Toggle - Always show */}
        {tasks && tasks.length > 0 && (
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={useSmartSelection}
              exclusive
              onChange={(e, value) => value !== null && setUseSmartSelection(value)}
              size="small"
            >
              <ToggleButton value={true} sx={{ px: { xs: 2, sm: 3 } }}>
                <AutoAwesome sx={{ mr: 1, fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                <Box component="span" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Smart Selection</Box>
                  <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Smart</Box>
                </Box>
              </ToggleButton>
              <ToggleButton value={false} sx={{ px: { xs: 2, sm: 3 } }}>
                <Task sx={{ mr: 1, fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                <Box component="span" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Manual Selection</Box>
                  <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Manual</Box>
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {/* Smart Task Selector or Manual Selector */}
        {tasks && tasks.length > 0 && (
          useSmartSelection ? (
            <SmartTaskSelector
              tasks={tasks}
              sessionDuration={duration}
              sessionType={sessionType}
              energyLevel={energyLevel}
              onTasksSelected={setSmartSelectedTasks}
              recentSessions={recentSessions}
            />
          ) : (
            /* Suggested Session */
            suggestedTasks.length > 0 && (
          <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Lightbulb sx={{ color: theme.palette.warning.main }} />
              <Typography variant="h6">
                Suggested Deep Work Session
              </Typography>
            </Box>
            
            <List dense>
              {suggestedTasks.map((task) => (
                <ListItem key={task._id} disablePadding>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedTasks.includes(task._id)}
                      onChange={() => handleTaskToggle(task._id)}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {task.title}
                        <Chip 
                          label={`${task.estimatedDuration || 30} min`} 
                          size="small" 
                        />
                        {task.priority === 'high' && (
                          <Chip label="High Priority" size="small" color="error" />
                        )}
                      </Box>
                    }
                    secondary={task.dueDate && `Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>

            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2">
                Total: {totalSelectedTime} min
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(totalSelectedTime / duration) * 100} 
                sx={{ flexGrow: 1 }}
              />
              <Typography variant="body2">
                Cognitive Load: {Math.round((totalSelectedTime / duration) * 100)}%
              </Typography>
            </Box>
          </Card>
            )
          )
        )}

        {/* Energy Level Tracker - Always visible */}
        <Box sx={{ mb: 3 }}>
          <EnergyLevelTracker
            currentEnergy={energyLevel}
            onEnergyChange={setEnergyLevel}
            showRecommendations={true}
            historicalData={[]}
          />
        </Box>

        {/* Always show Smart Selection info */}
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          icon={<AutoAwesome />}
        >
          <Typography variant="body2" gutterBottom>
            <strong>🎯 New: Smart Task Selection with AI!</strong>
          </Typography>
          <Typography variant="body2">
            {tasks && tasks.length > 0 
              ? 'Toggle between Smart and Manual selection above to get AI-powered task recommendations.'
              : 'Create some tasks to unlock AI-powered recommendations based on your energy, deadlines, and patterns.'}
          </Typography>
        </Alert>

        {/* Distraction Blocking Settings */}
        <Box sx={{ mb: 3 }}>
          <DistractionBlocker 
            isActive={false}
            onSettingsChange={setDistractionSettings}
          />
        </Box>

        {/* Advanced Settings */}
        {showAdvanced && (
          <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Session Configuration
            </Typography>

            {/* Duration Slider */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Duration: {duration} minutes
              </Typography>
              <Slider
                value={duration}
                onChange={(e, v) => setDuration(v)}
                min={15}
                max={120}
                step={5}
                marks={[
                  { value: 15, label: '15m' },
                  { value: 25, label: '25m' },
                  { value: 45, label: '45m' },
                  { value: 60, label: '1h' },
                  { value: 90, label: '1.5h' },
                  { value: 120, label: '2h' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            {/* Session Type */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>Focus Type</Typography>
              <ButtonGroup size="small" fullWidth>
                {SESSION_TYPES.map((type) => (
                  <Button
                    key={type.value}
                    variant={sessionType === type.value ? 'contained' : 'outlined'}
                    onClick={() => setSessionType(type.value)}
                    startIcon={<type.icon />}
                  >
                    {type.label}
                  </Button>
                ))}
              </ButtonGroup>
            </Box>

            {/* Energy Level Tracker */}
            <EnergyLevelTracker
              currentEnergy={energyLevel}
              onEnergyChange={setEnergyLevel}
              showRecommendations={true}
              historicalData={[]}
            />

            {/* Environment Settings */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={pauseNotifications}
                    onChange={(e) => setPauseNotifications(e.target.checked)}
                  />
                }
                label="Pause All Notifications"
              />
            </Box>
          </Card>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleStartSession}
            disabled={isLoading || (useSmartSelection ? smartSelectedTasks.length === 0 : selectedTasks.length === 0)}
            startIcon={isLoading ? <CircularProgress size={20} /> : <PlayArrow />}
          >
            {isLoading ? 'Starting...' : 'Start Focus Session'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => setShowAdvanced(!showAdvanced)}
            startIcon={<Tune />}
          >
            Customize
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FocusModeLauncherV2;