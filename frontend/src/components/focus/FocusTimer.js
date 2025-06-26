import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  LinearProgress,
  Button,
  Chip,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  SkipNext,
  VolumeUp,
  VolumeOff,
  CheckCircle,
  RadioButtonUnchecked
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';

const FocusTimer = ({ session, onPause, onResume, onEnd, onTaskComplete, onDistraction }) => {
  const theme = useTheme();
  const intervalRef = useRef(null);
  
  const [timeLeft, setTimeLeft] = useState(session.plannedDuration * 60); // Convert to seconds
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [endNotes, setEndNotes] = useState('');
  const [energyLevelEnd, setEnergyLevelEnd] = useState(7);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Audio refs for notifications
  const tickSound = useRef(new Audio('/sounds/tick.mp3'));
  const breakSound = useRef(new Audio('/sounds/break.mp3'));
  const completeSound = useRef(new Audio('/sounds/complete.mp3'));

  useEffect(() => {
    if (!isPaused && session.status === 'active') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPaused, session.status]);

  // Play tick sound every minute
  useEffect(() => {
    if (soundEnabled && elapsedTime > 0 && elapsedTime % 60 === 0) {
      tickSound.current.volume = 0.2;
      tickSound.current.play().catch(e => console.log('Audio play failed:', e));
    }
  }, [elapsedTime, soundEnabled]);

  const handleTimerComplete = () => {
    if (soundEnabled) {
      completeSound.current.play().catch(e => console.log('Audio play failed:', e));
    }
    setShowEndDialog(true);
  };

  const handlePauseResume = async () => {
    if (isPaused) {
      await onResume();
      setIsPaused(false);
    } else {
      await onPause();
      setIsPaused(true);
    }
  };

  const handleTaskToggle = (taskId) => {
    setCompletedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      }
      return [...prev, taskId];
    });
    onTaskComplete(taskId);
  };

  const handleEndSession = async () => {
    await onEnd({
      energyLevelEnd,
      notes: endNotes,
      completedTasks
    });
    setShowEndDialog(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((session.plannedDuration * 60 - timeLeft) / (session.plannedDuration * 60)) * 100;

  return (
    <>
      <Card 
        sx={{ 
          maxWidth: 800, 
          mx: 'auto',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(145deg, #1e1e1e 0%, #2d2d2d 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
          boxShadow: theme.shadows[8]
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Timer Display */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h1" 
              sx={{ 
                fontSize: '6rem',
                fontWeight: 300,
                letterSpacing: '-0.02em',
                color: timeLeft < 300 ? theme.palette.error.main : theme.palette.text.primary
              }}
            >
              {formatTime(timeLeft)}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {isPaused ? 'Paused' : 'Focus Session Active'}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                mt: 2,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'rgba(0, 0, 0, 0.08)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                }
              }}
            />
          </Box>

          {/* Control Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
            <IconButton 
              size="large" 
              onClick={handlePauseResume}
              sx={{ 
                bgcolor: theme.palette.primary.main,
                color: 'white',
                '&:hover': { bgcolor: theme.palette.primary.dark }
              }}
            >
              {isPaused ? <PlayArrow /> : <Pause />}
            </IconButton>
            <IconButton 
              size="large" 
              onClick={() => setShowEndDialog(true)}
              sx={{ 
                bgcolor: theme.palette.error.main,
                color: 'white',
                '&:hover': { bgcolor: theme.palette.error.dark }
              }}
            >
              <Stop />
            </IconButton>
            <IconButton 
              size="large"
              onClick={() => setSoundEnabled(!soundEnabled)}
              sx={{ 
                bgcolor: theme.palette.grey[700],
                color: 'white',
                '&:hover': { bgcolor: theme.palette.grey[800] }
              }}
            >
              {soundEnabled ? <VolumeUp /> : <VolumeOff />}
            </IconButton>
          </Box>

          {/* Session Info */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Chip 
                label={`Session: ${session.sessionType}`} 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                label={`${session.tasks.length} Tasks`} 
                color="secondary" 
                variant="outlined" 
              />
              <Chip 
                label={`Energy: ${session.energyLevel.start}/10`} 
                variant="outlined" 
              />
            </Stack>
          </Box>

          {/* Task List */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Session Tasks
            </Typography>
            <Stack spacing={1}>
              {session.tasks.map((taskItem) => (
                <Box
                  key={taskItem.task._id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: completedTasks.includes(taskItem.task._id)
                      ? theme.palette.success.dark + '20'
                      : theme.palette.action.hover,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handleTaskToggle(taskItem.task._id)}
                >
                  <IconButton size="small" sx={{ mr: 1 }}>
                    {completedTasks.includes(taskItem.task._id) ? (
                      <CheckCircle color="success" />
                    ) : (
                      <RadioButtonUnchecked />
                    )}
                  </IconButton>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        textDecoration: completedTasks.includes(taskItem.task._id) 
                          ? 'line-through' 
                          : 'none'
                      }}
                    >
                      {taskItem.task.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Estimated: {taskItem.plannedDuration} min
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Quick Stats */}
          <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={2} justifyContent="space-around">
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{Math.floor(elapsedTime / 60)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Minutes Focused
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{completedTasks.length}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Tasks Completed
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{session.distractions?.blocked || 0}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Distractions Blocked
                </Typography>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* End Session Dialog */}
      <Dialog open={showEndDialog} onClose={() => setShowEndDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>End Focus Session</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box>
              <Typography variant="body2" gutterBottom>
                How's your energy level now?
              </Typography>
              <Rating
                value={energyLevelEnd}
                onChange={(e, value) => setEnergyLevelEnd(value)}
                max={10}
                size="large"
              />
            </Box>
            
            <Box>
              <Typography variant="body2" gutterBottom>
                Which tasks did you complete?
              </Typography>
              <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                {completedTasks.length} of {session.tasks.length} tasks marked as complete
              </Alert>
            </Box>

            <TextField
              label="Session Notes (Optional)"
              multiline
              rows={3}
              value={endNotes}
              onChange={(e) => setEndNotes(e.target.value)}
              fullWidth
              placeholder="How did the session go? Any distractions or insights?"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEndDialog(false)}>
            Continue Session
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleEndSession}
          >
            End Session
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FocusTimer;