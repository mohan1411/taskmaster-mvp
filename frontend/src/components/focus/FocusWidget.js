import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Divider,
  IconButton,
  Collapse,
  LinearProgress,
  Chip,
  Stack
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlayArrow as PlayIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocus } from '../../context/FocusContext';

const FocusWidget = () => {
  const navigate = useNavigate();
  const { currentSession, stats } = useFocus();
  const [expanded, setExpanded] = useState(true);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getSessionProgress = () => {
    if (!currentSession) return 0;
    const elapsed = Math.floor((Date.now() - new Date(currentSession.startTime).getTime()) / 1000);
    const duration = currentSession.duration * 60; // Convert minutes to seconds
    return Math.min((elapsed / duration) * 100, 100);
  };

  return (
    <Paper sx={{ height: '100%' }}>
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' }
        }}
        onClick={toggleExpanded}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PsychologyIcon color="secondary" sx={{ mr: 1, fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={500}>
            Focus Mode
          </Typography>
          {currentSession && (
            <Chip 
              label="Active" 
              size="small" 
              color="success"
              sx={{ ml: 1, height: 20 }}
            />
          )}
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      <Divider />
      
      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {currentSession ? (
            // Active session display
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Currently focusing on:
              </Typography>
              <Typography variant="body1" fontWeight={500} gutterBottom>
                {currentSession.taskTitle || 'General Focus'}
              </Typography>
              
              <Box sx={{ mt: 2, mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(getSessionProgress())}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={getSessionProgress()} 
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Box>
              
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => navigate('/focus')}
                  fullWidth
                >
                  View Session
                </Button>
              </Stack>
            </Box>
          ) : (
            // No active session
            <Box>
              <Stack spacing={2}>
                {stats?.todayMinutes > 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TimerIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Today's Focus Time
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="primary">
                      {formatTime(stats.todayMinutes * 60)}
                    </Typography>
                  </Box>
                )}
                
                <Typography variant="body2" color="text.secondary">
                  {stats?.todayMinutes > 0 
                    ? 'Ready for another focus session?'
                    : 'Start your first focus session today'
                  }
                </Typography>
                
                <Button 
                  variant="contained" 
                  color="secondary"
                  startIcon={<PlayIcon />}
                  onClick={() => navigate('/focus')}
                  fullWidth
                  size="small"
                >
                  Start Focus Session
                </Button>
              </Stack>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default FocusWidget;