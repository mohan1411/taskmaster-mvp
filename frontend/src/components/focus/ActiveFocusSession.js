import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  CircularProgress,
  IconButton,
  Button,
  Card,
  CardContent,
  Fab,
  Slide,
  Collapse,
  TextField,
  Chip,
  Tooltip,
  Slider,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  SkipNext as SkipIcon,
  Check as CheckIcon,
  Notes as NotesIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as VolumeOffIcon,
  Psychology as FlowIcon,
  Timer as TimerIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';
import { useFocus } from '../../context/FocusContext';
import BreakMode from './BreakMode';
import FocusTimer from './FocusTimer';
import distractionService from '../../services/distractionService';
import axios from 'axios';

// Ambient background component
const AmbientBackground = ({ soundType, playing }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    
    // Simple particle animation based on sound type
    const particles = [];
    const particleCount = soundType === 'rain' ? 100 : 20;
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
        size: Math.random() * 2 + 1
      });
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (playing) {
        particles.forEach(particle => {
          // Rain effect
          if (soundType === 'rain') {
            particle.y += particle.speed;
            if (particle.y > canvas.height) {
              particle.y = -10;
              particle.x = Math.random() * canvas.width;
            }
            
            ctx.strokeStyle = `rgba(100, 150, 255, ${particle.opacity})`;
            ctx.lineWidth = particle.size;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particle.x - 2, particle.y + 10);
            ctx.stroke();
          }
          // Floating particles for other sounds
          else {
            particle.y += Math.sin(Date.now() * 0.001 + particle.x * 0.01) * 0.3;
            particle.x += 0.1;
            if (particle.x > canvas.width) particle.x = -10;
            
            ctx.fillStyle = `rgba(100, 200, 255, ${particle.opacity})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();
    animate();
    
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [soundType, playing]);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.3,
        zIndex: -1
      }}
    />
  );
};

// Breathing timer component
const BreathingTimer = ({ duration, elapsed, isRunning }) => {
  const progress = (elapsed / duration) * 100;
  const remainingSeconds = Math.max(0, duration - elapsed);
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingSecondsDisplay = Math.floor(remainingSeconds % 60);
  
  // Breathing animation - slow pulse during focus
  const breathingStyle = {
    animation: isRunning ? 'focusBreathing 4s ease-in-out infinite' : 'none',
    transition: 'all 0.3s ease'
  };
  
  return (
    <Box sx={{ textAlign: 'center', mb: 4, mt: 2 }}>
      <Box
        sx={{
          position: 'relative',
          display: 'inline-block',
          ...breathingStyle
        }}
      >
        <Box
          sx={{
            width: 250,
            height: 250,
            borderRadius: '50%',
            border: 6,
            borderColor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            position: 'relative',
            background: theme => theme.palette.mode === 'dark'
              ? 'radial-gradient(circle, rgba(25, 118, 210, 0.2) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(25, 118, 210, 0.1) 0%, transparent 70%)',
            boxShadow: theme => theme.palette.mode === 'dark'
              ? '0 0 50px rgba(25, 118, 210, 0.3), inset 0 0 30px rgba(25, 118, 210, 0.1)'
              : '0 0 50px rgba(25, 118, 210, 0.2), inset 0 0 30px rgba(25, 118, 210, 0.05)'
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 400,
              fontSize: '3rem',
              color: 'primary.main',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {String(remainingMinutes).padStart(2, '0')}:{String(remainingSecondsDisplay).padStart(2, '0')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            remaining
          </Typography>
        </Box>
        
        <CircularProgress
          variant="determinate"
          value={progress}
          size={270}
          thickness={2}
          sx={{
            position: 'absolute',
            top: -10,
            left: -10,
            color: theme => theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
            opacity: 0.3
          }}
        />
        
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            position: 'absolute',
            bottom: -30,
            left: -50,
            right: -50,
            height: 4,
            borderRadius: 2,
            bgcolor: 'rgba(0,0,0,0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 2,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
            }
          }}
        />
      </Box>
      
      <Typography 
        variant="h6" 
        sx={{ 
          mt: 2, 
          opacity: 0.9,
          fontWeight: 300,
          letterSpacing: '0.05em'
        }}
      >
        {Math.round(progress)}% Complete
      </Typography>
    </Box>
  );
};

const ActiveFocusSession = ({ onEndSession }) => {
  const theme = useTheme();
  const {
    focusSession,
    focusPreferences,
    endFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    completeCurrentTask,
    skipCurrentTask,
    trackActivity
  } = useFocus();
  
  console.log('ActiveFocusSession render - focusSession:', focusSession);
  
  // Disable body scroll when active
  useEffect(() => {
    if (focusSession.active) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [focusSession.active]);
  
  const [minimized, setMinimized] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [soundVolume, setSoundVolume] = useState(focusPreferences.volume * 100);
  const [soundPlaying, setSoundPlaying] = useState(true);
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const [inBreakMode, setInBreakMode] = useState(false);
  const [breakType, setBreakType] = useState('short-break');
  const [distractionStatus, setDistractionStatus] = useState(null);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const isEndingSessionRef = useRef(false);
  
  // Calculate session stats
  const tasksCompleted = focusSession.completed?.length || 0;
  const totalTasks = (focusSession.tasks?.length || 0) + tasksCompleted;
  const sessionProgress = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;
  
  // Track keystroke activity for flow detection
  useEffect(() => {
    const handleActivity = () => {
      trackActivity('keystroke');
    };
    
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('click', handleActivity);
    
    return () => {
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('click', handleActivity);
    };
  }, [trackActivity]);
  
  // Update distraction status
  useEffect(() => {
    const updateStatus = () => {
      const status = distractionService.getStatus();
      setDistractionStatus(status);
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Break reminder logic
  useEffect(() => {
    if (!focusSession.active) return;
    
    const breakInterval = focusPreferences.breakRatio * 60; // Convert to seconds
    const shouldShowBreak = focusSession.timeElapsed > 0 && 
                           focusSession.timeElapsed % breakInterval === 0 &&
                           !focusSession.breakTime;
    
    if (shouldShowBreak) {
      setShowBreakReminder(true);
    }
  }, [focusSession.timeElapsed, focusPreferences.breakRatio, focusSession.breakTime]);
  
  const handleEndSession = async (endData = {}) => {
    if (isEndingSession || isEndingSessionRef.current) {
      console.log('End session already in progress, ignoring click');
      return; // Prevent multiple clicks
    }
    
    console.log('Starting end session process');
    setIsEndingSession(true);
    isEndingSessionRef.current = true;
    try {
      // Capture session data BEFORE ending the session (which resets the state)
      const allTasks = [...(focusSession.tasks || [])];
      if (focusSession.currentTask) {
        allTasks.unshift(focusSession.currentTask);
      }
      
      const cleanTasks = allTasks.map(task => ({
        id: task._id || task.id,
        title: task.title,
        estimatedDuration: task.estimatedDuration
      }));
      
      const completedTaskIds = focusSession.completed.map(task => {
        if (typeof task === 'string') return task;
        if (typeof task === 'object' && task !== null) {
          return task._id || task.id;
        }
        return null;
      }).filter(id => id !== null);
      
      const sessionData = { 
        duration: Math.round(focusSession.timeElapsed || 0),
        sessionDuration: Math.round(focusSession.timeElapsed || 0),
        plannedDuration: focusSession.duration || 0,
        tasksCompleted: completedTaskIds.length,
        tasks: cleanTasks,
        completed: completedTaskIds,
        flowDuration: focusSession.flowState && focusSession.flowStartTime 
          ? Math.round((Date.now() - focusSession.flowStartTime) / 60000)
          : 0,
        distractionsBlocked: distractionStatus.queuedNotifications || 0,
        ...endData 
      };
      
      // Call the callback FIRST (before the session state is reset)
      onEndSession?.(sessionData);
      
      // THEN end the session (which will reset the state)
      await endFocusSession('user_ended', endData);
      
    } catch (error) {
      console.error('Error in handleEndSession:', error);
      setIsEndingSession(false); // Reset loading state on error
      isEndingSessionRef.current = false;
      // Still try to call onEndSession with minimal data
      const fallbackData = { 
        duration: focusSession.timeElapsed || 0,
        sessionDuration: focusSession.timeElapsed || 0,
        plannedDuration: focusSession.duration || 0,
        tasksCompleted: focusSession.completed.length || 0,
        tasks: [],
        completed: [],
        flowDuration: 0,
        distractionsBlocked: 0,
        ...endData 
      };
      onEndSession?.(fallbackData);
    }
  };
  
  const handleCompleteTask = () => {
    completeCurrentTask();
    trackActivity('task_completion');
  };
  
  const handlePauseResume = async () => {
    if (focusSession.breakTime) {
      await resumeFocusSession();
    } else {
      await pauseFocusSession();
    }
  };
  
  const handleSkipTask = () => {
    skipCurrentTask();
    trackActivity('task_skip');
  };
  
  const handleTakeBreak = (type = 'short-break') => {
    setShowBreakReminder(false);
    setBreakType(type);
    setInBreakMode(true);
  };
  
  const handleBreakComplete = () => {
    setInBreakMode(false);
    // Could show a motivational message here
  };
  
  const handleBreakSkip = () => {
    setInBreakMode(false);
  };
  
  const formatTime = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  if (!focusSession.active) {
    return null;
  }
  
  // Show break mode if active
  if (inBreakMode) {
    return (
      <BreakMode
        breakType={breakType}
        onComplete={handleBreakComplete}
        onSkip={handleBreakSkip}
      />
    );
  }
  
  // Minimized view
  if (minimized) {
    return (
      <Fab
        sx={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          zIndex: 1300,
          width: 100,
          height: 100,
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 6px 10px 4px rgba(33, 203, 243, .3)'
          },
          transition: 'all 0.3s ease'
        }}
        color="primary"
        onClick={() => setMinimized(false)}
      >
        <Box sx={{ textAlign: 'center' }}>
          <TimerIcon sx={{ fontSize: 32, mb: 0.5 }} />
          <Typography variant="caption" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
            {formatTime(focusSession.duration - focusSession.timeElapsed)}
          </Typography>
        </Box>
      </Fab>
    );
  }
  
  return (
    <>
      {/* CSS for breathing animation */}
      <style>
        {`
          @keyframes focusBreathing {
            0%, 100% { 
              transform: scale(1); 
              filter: brightness(1);
            }
            50% { 
              transform: scale(1.05); 
              filter: brightness(1.1);
            }
          }
          
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }
        `}
      </style>
      
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100dvh', // Use dynamic viewport height for mobile
          bgcolor: theme => theme.palette.mode === 'dark' 
            ? '#0a0a0a' 
            : '#fafafa',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          background: theme => theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)'
            : 'radial-gradient(circle at center, #ffffff 0%, #f5f5f5 100%)'
        }}
      >
        {/* Ambient Background */}
        <AmbientBackground 
          soundType={focusPreferences.ambientSound} 
          playing={soundPlaying} 
        />
        
        {/* Header Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            backdropFilter: 'blur(10px)',
            bgcolor: theme => theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.9)' 
              : 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 500,
              letterSpacing: '0.1em',
              color: 'primary.main'
            }}
          >
            🎯 FOCUS MODE ACTIVE
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {focusSession.flowState && (
              <Chip
                icon={<FlowIcon />}
                label="Flow State"
                color="success"
                size="small"
                sx={{ animation: 'pulse 2s infinite' }}
              />
            )}
            
            {distractionStatus?.isBlocking && (
              <Chip
                icon={<NotesIcon />}
                label={`${distractionStatus.blockedNotifications} Blocked`}
                color="warning"
                size="small"
              />
            )}
            
            <Tooltip title="Minimize">
              <IconButton onClick={() => setMinimized(true)}>
                <MinimizeIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="End Session">
              <IconButton onClick={handleEndSession} color="error" disabled={isEndingSession}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Session Stats Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 2, sm: 4 },
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: theme => theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.5)' 
              : 'rgba(255, 255, 255, 0.5)',
            flexShrink: 0,
            flexWrap: 'wrap'
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {focusSession.timeElapsed.toFixed(0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Minutes Focused
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {tasksCompleted}/{totalTasks}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tasks Complete
            </Typography>
          </Box>
          
          {focusSession.flowState && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">
                {Math.floor((Date.now() - focusSession.flowStartTime) / 60000)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Flow Minutes
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Main Content */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            minHeight: 0
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              p: 4,
              textAlign: 'center',
              pb: 4
            }}
          >
            {/* Timer */}
            <BreathingTimer
              duration={focusSession.duration * 60} // Convert minutes to seconds
              elapsed={focusSession.timeElapsed * 60} // Convert minutes to seconds
              isRunning={focusSession.active && !focusSession.breakTime}
            />
          
          {/* Current Task */}
          {focusSession.currentTask && (
            <Card 
              sx={{ 
                mb: 4, 
                maxWidth: 600, 
                width: '100%',
                bgcolor: theme => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.02)',
                backdropFilter: 'blur(10px)',
                border: 1,
                borderColor: theme => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)',
                boxShadow: theme => theme.palette.mode === 'dark'
                  ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                  : '0 4px 20px rgba(0, 0, 0, 0.1)'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="h5" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 500,
                    textAlign: 'center',
                    mb: 2
                  }}
                >
                  {focusSession.currentTask.title}
                </Typography>
                
                {focusSession.currentTask.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {focusSession.currentTask.description}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
                  <Chip 
                    label={focusSession.currentTask.priority} 
                    size="small"
                    color={
                      focusSession.currentTask.priority === 'high' ? 'error' :
                      focusSession.currentTask.priority === 'medium' ? 'warning' : 'default'
                    }
                  />
                  <Typography variant="caption">
                    Estimated: {focusSession.currentTask.estimatedDuration || 30} min
                  </Typography>
                </Box>
                
                {/* Task Progress */}
                <LinearProgress
                  variant="determinate"
                  value={75} // This would be calculated based on actual progress
                  sx={{ mb: 2 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Task Progress: 75% (estimated)
                </Typography>
              </CardContent>
            </Card>
          )}
          
          {/* Next Task Preview */}
          {focusSession.tasks.length > 1 && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3, 
                maxWidth: 600, 
                width: '100%',
                bgcolor: theme => theme.palette.mode === 'dark'
                  ? 'rgba(25, 118, 210, 0.1)'
                  : 'rgba(25, 118, 210, 0.05)',
                border: 1,
                borderColor: theme => theme.palette.mode === 'dark'
                  ? 'rgba(25, 118, 210, 0.3)'
                  : 'rgba(25, 118, 210, 0.2)'
              }}
            >
              <Typography variant="body2">
                <strong>Next up:</strong> {focusSession.tasks[1]?.title} ({focusSession.tasks[1]?.estimatedDuration || 30} min)
              </Typography>
            </Alert>
          )}
          
          {/* Notes Area */}
          <Collapse in={showNotes}>
            <Card sx={{ mb: 3, maxWidth: 600, width: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Session Notes
                </Typography>
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Jot down thoughts, insights, or progress..."
                  variant="outlined"
                  size="small"
                />
              </CardContent>
            </Card>
          </Collapse>
          </Box>
        </Box>
        
        {/* Control Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 1, sm: 2 },
            p: { xs: 2, sm: 3 },
            borderTop: 1,
            borderColor: 'divider',
            backdropFilter: 'blur(10px)',
            bgcolor: theme => theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.9)' 
              : 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
            flexShrink: 0,
            mt: 'auto',
            flexWrap: 'wrap'
          }}
        >
          <Button
            variant="outlined"
            startIcon={focusSession.breakTime ? <PlayIcon /> : <PauseIcon />}
            onClick={handlePauseResume}
            size="large"
            sx={{ 
              borderRadius: 2,
              px: 3,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2
              },
              transition: 'all 0.2s ease'
            }}
          >
            {focusSession.breakTime ? 'Resume' : 'Pause'}
          </Button>
          
          {focusSession.currentTask && (
            <>
              <Button
                variant="outlined"
                startIcon={<SkipIcon />}
                onClick={handleSkipTask}
                size="large"
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Skip Task
              </Button>
              
              <Button
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={handleCompleteTask}
                size="large"
                color="success"
                sx={{ 
                  borderRadius: 2,
                  px: 4,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  },
                  transition: 'all 0.2s ease',
                  fontWeight: 600
                }}
              >
                Complete Task
              </Button>
            </>
          )}
          
          <Button
            variant="outlined"
            startIcon={<NotesIcon />}
            onClick={() => setShowNotes(!showNotes)}
            size="large"
            sx={{ 
              borderRadius: 2,
              px: 3,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2
              },
              transition: 'all 0.2s ease'
            }}
          >
            Notes
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<StopIcon />}
            onClick={handleEndSession}
            size="large"
            disabled={isEndingSession}
            sx={{ 
              borderRadius: 2,
              px: 3,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
                bgcolor: 'error.main',
                color: 'white'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {isEndingSession ? 'Ending...' : 'End Session'}
          </Button>
        </Box>
        
        {/* Sound Controls */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 2
          }}
        >
          <IconButton
            onClick={() => setSoundPlaying(!soundPlaying)}
            size="small"
          >
            {soundPlaying ? <VolumeIcon /> : <VolumeOffIcon />}
          </IconButton>
          
          <Slider
            value={soundVolume}
            onChange={(e, value) => setSoundVolume(value)}
            size="small"
            sx={{ width: 80 }}
            min={0}
            max={100}
          />
        </Box>
        
        {/* Break Reminder */}
        <Slide direction="up" in={showBreakReminder}>
          <Alert
            severity="info"
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button color="inherit" size="small" onClick={() => handleTakeBreak('micro-break')}>
                  Micro (30s)
                </Button>
                <Button color="inherit" size="small" onClick={() => handleTakeBreak('short-break')}>
                  Short (5m)
                </Button>
                <Button color="inherit" size="small" onClick={() => handleTakeBreak('long-break')}>
                  Long (15m)
                </Button>
                <Button color="inherit" size="small" onClick={() => setShowBreakReminder(false)}>
                  Continue
                </Button>
              </Box>
            }
            sx={{
              position: 'fixed',
              bottom: 160,
              left: 20,
              right: 20,
              maxWidth: 800,
              mx: 'auto'
            }}
          >
            You've been focused for {focusPreferences.breakRatio * 60} minutes. Consider taking a short break!
          </Alert>
        </Slide>
      </Box>
    </>
  );
};

export default ActiveFocusSession;