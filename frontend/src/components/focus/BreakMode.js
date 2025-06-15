import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Grid,
  Chip,
  Avatar,
  Alert,
  IconButton,
  Collapse,
  Stepper,
  Step,
  StepLabel,
  Fade
} from '@mui/material';
import {
  Coffee as CoffeeIcon,
  DirectionsWalk as WalkIcon,
  Visibility as EyeIcon,
  Air as BreathIcon,
  LocalDrink as WaterIcon,
  FitnessCenter as StretchIcon,
  Timer as TimerIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipNext as SkipIcon,
  Close as CloseIcon,
  Psychology as MeditateIcon,
  MusicNote as MusicIcon
} from '@mui/icons-material';
import { useFocus } from '../../context/FocusContext';

// Break activity types with instructions
const BREAK_ACTIVITIES = {
  'micro-break': {
    name: 'Micro Break',
    duration: 30, // seconds
    icon: <TimerIcon />,
    color: 'primary',
    activities: [
      {
        name: 'Eye Rest',
        icon: <EyeIcon />,
        instructions: 'Look away from screen and focus on something 20 feet away for 20 seconds',
        duration: 20
      },
      {
        name: 'Neck Stretch',
        icon: <StretchIcon />,
        instructions: 'Gently roll your neck in circles - 5 times each direction',
        duration: 10
      }
    ]
  },
  'short-break': {
    name: 'Short Break',
    duration: 300, // 5 minutes
    icon: <CoffeeIcon />,
    color: 'secondary',
    activities: [
      {
        name: 'Hydration',
        icon: <WaterIcon />,
        instructions: 'Drink a full glass of water slowly',
        duration: 60
      },
      {
        name: 'Gentle Walk',
        icon: <WalkIcon />,
        instructions: 'Take a short walk around your space or do light stretching',
        duration: 180
      },
      {
        name: 'Deep Breathing',
        icon: <BreathIcon />,
        instructions: 'Take 10 deep breaths - inhale for 4, hold for 4, exhale for 6',
        duration: 60
      }
    ]
  },
  'long-break': {
    name: 'Long Break',
    duration: 900, // 15 minutes
    icon: <MeditateIcon />,
    color: 'warning',
    activities: [
      {
        name: 'Mindful Meditation',
        icon: <MeditateIcon />,
        instructions: 'Close your eyes and focus on your breathing for 5 minutes',
        duration: 300
      },
      {
        name: 'Physical Activity',
        icon: <WalkIcon />,
        instructions: 'Go for a proper walk outside or do some exercise',
        duration: 480
      },
      {
        name: 'Snack & Hydration',
        icon: <CoffeeIcon />,
        instructions: 'Have a healthy snack and plenty of water',
        duration: 120
      }
    ]
  }
};

// Guided breathing component
const BreathingGuide = ({ duration, onComplete }) => {
  const [phase, setPhase] = useState('inhale'); // inhale, hold, exhale
  const [count, setCount] = useState(4);
  const [cycle, setCycle] = useState(1);
  const [isActive, setIsActive] = useState(true);
  
  const totalCycles = Math.floor(duration / 14); // 14 seconds per cycle (4+4+6)
  
  useEffect(() => {
    if (!isActive) return;
    
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          // Move to next phase
          if (phase === 'inhale') {
            setPhase('hold');
            return 4;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return 6;
          } else {
            // Complete cycle
            setCycle(prev => prev + 1);
            if (cycle >= totalCycles) {
              setIsActive(false);
              onComplete?.();
              return 0;
            }
            setPhase('inhale');
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [phase, cycle, totalCycles, isActive, onComplete]);
  
  const getPhaseInstruction = () => {
    switch (phase) {
      case 'inhale': return 'Breathe In...';
      case 'hold': return 'Hold...';
      case 'exhale': return 'Breathe Out...';
      default: return 'Complete!';
    }
  };
  
  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale': return 'primary';
      case 'hold': return 'warning';
      case 'exhale': return 'secondary';
      default: return 'success';
    }
  };
  
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Box
        sx={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          border: 4,
          borderColor: `${getPhaseColor()}.main`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          mx: 'auto',
          mb: 3,
          transition: 'all 0.5s ease',
          transform: phase === 'inhale' ? 'scale(1.1)' : 'scale(1)',
          background: `radial-gradient(circle, rgba(25, 118, 210, ${phase === 'hold' ? 0.3 : 0.1}) 0%, transparent 70%)`
        }}
      >
        <Typography variant="h3" color={`${getPhaseColor()}.main`}>
          {count}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {getPhaseInstruction()}
        </Typography>
      </Box>
      
      <Typography variant="h6" gutterBottom>
        Cycle {cycle} of {totalCycles}
      </Typography>
      
      <LinearProgress
        variant="determinate"
        value={(cycle / totalCycles) * 100}
        sx={{ width: 200, mx: 'auto', height: 8, borderRadius: 4 }}
      />
    </Box>
  );
};

// Activity timer component
const ActivityTimer = ({ activity, onComplete, onSkip }) => {
  const [timeLeft, setTimeLeft] = useState(activity.duration);
  const [isRunning, setIsRunning] = useState(true);
  
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onComplete]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            {activity.icon}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">{activity.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {activity.instructions}
            </Typography>
          </Box>
          <Typography variant="h4" color="primary.main">
            {formatTime(timeLeft)}
          </Typography>
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={((activity.duration - timeLeft) / activity.duration) * 100}
          sx={{ mb: 2, height: 8, borderRadius: 4 }}
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => setIsRunning(!isRunning)}
            color="primary"
          >
            {isRunning ? <PauseIcon /> : <PlayIcon />}
          </IconButton>
          <Button
            variant="outlined"
            size="small"
            onClick={onSkip}
            startIcon={<SkipIcon />}
          >
            Skip
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

const BreakMode = ({ breakType = 'short-break', onComplete, onSkip }) => {
  const { userMetrics, logFocusEvent } = useFocus();
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [breakStartTime] = useState(Date.now());
  const [showBreathingGuide, setShowBreathingGuide] = useState(false);
  
  const breakConfig = BREAK_ACTIVITIES[breakType];
  const currentActivity = breakConfig.activities[currentActivityIndex];
  const isLastActivity = currentActivityIndex === breakConfig.activities.length - 1;
  
  useEffect(() => {
    logFocusEvent('break_started', {
      breakType,
      duration: breakConfig.duration,
      activities: breakConfig.activities.length
    });
  }, [breakType, logFocusEvent]);
  
  const handleActivityComplete = () => {
    logFocusEvent('break_activity_completed', {
      activityName: currentActivity.name,
      activityIndex: currentActivityIndex
    });
    
    if (isLastActivity) {
      handleBreakComplete();
    } else {
      setCurrentActivityIndex(prev => prev + 1);
    }
  };
  
  const handleActivitySkip = () => {
    logFocusEvent('break_activity_skipped', {
      activityName: currentActivity.name,
      activityIndex: currentActivityIndex
    });
    
    if (isLastActivity) {
      handleBreakComplete();
    } else {
      setCurrentActivityIndex(prev => prev + 1);
    }
  };
  
  const handleBreakComplete = () => {
    const breakDuration = Math.round((Date.now() - breakStartTime) / 1000);
    logFocusEvent('break_completed', {
      breakType,
      plannedDuration: breakConfig.duration,
      actualDuration: breakDuration,
      completedActivities: currentActivityIndex + 1
    });
    
    onComplete?.();
  };
  
  const handleBreakSkip = () => {
    logFocusEvent('break_skipped', {
      breakType,
      activitiesCompleted: currentActivityIndex
    });
    
    onSkip?.();
  };
  
  // Special handling for breathing exercise
  if (currentActivity.name === 'Deep Breathing' && !showBreathingGuide) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <BreathIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Guided Breathing Exercise
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Follow the guided breathing pattern to help reset your focus and reduce stress.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => setShowBreathingGuide(true)}
              startIcon={<PlayIcon />}
            >
              Start Breathing Exercise
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }
  
  if (currentActivity.name === 'Deep Breathing' && showBreathingGuide) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
        <Card>
          <CardContent>
            <BreathingGuide
              duration={currentActivity.duration}
              onComplete={handleActivityComplete}
            />
          </CardContent>
        </Card>
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3, bgcolor: `${breakConfig.color}.50` }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: `${breakConfig.color}.main`, mr: 2, width: 56, height: 56 }}>
                {breakConfig.icon}
              </Avatar>
              <Box>
                <Typography variant="h5">{breakConfig.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.floor(breakConfig.duration / 60)} minute break
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleBreakSkip} color="inherit">
              <CloseIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
      
      {/* Progress Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={currentActivityIndex} alternativeLabel>
            {breakConfig.activities.map((activity, index) => (
              <Step key={activity.name}>
                <StepLabel
                  icon={
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: index <= currentActivityIndex ? 'primary.main' : 'grey.300'
                      }}
                    >
                      {activity.icon}
                    </Avatar>
                  }
                >
                  {activity.name}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>
      
      {/* Current Activity */}
      <Fade in={true} key={currentActivityIndex}>
        <Box>
          <ActivityTimer
            activity={currentActivity}
            onComplete={handleActivityComplete}
            onSkip={handleActivitySkip}
          />
        </Box>
      </Fade>
      
      {/* Break Benefits */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Break Benefits:</strong> Regular breaks improve focus, reduce eye strain, 
          boost creativity, and help maintain energy levels throughout your work session.
        </Typography>
      </Alert>
      
      {/* Today's Break Stats */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Today's Wellness
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary.main">
                  {userMetrics.weeklyStats?.breaksToday || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Breaks Taken
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="success.main">
                  {userMetrics.weeklyStats?.stepsToday || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Steps
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="info.main">
                  {userMetrics.weeklyStats?.waterGlasses || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Water Glasses
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BreakMode;