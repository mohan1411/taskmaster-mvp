import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Block,
  Close,
  Timer,
  ArrowBack
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useFocus } from '../../context/FocusContext';

const SiteBlockerOverlay = ({ site, onClose, onOverride }) => {
  const theme = useTheme();
  const { focusSession } = useFocus();
  const [showOverride, setShowOverride] = useState(false);
  const [overrideCountdown, setOverrideCountdown] = useState(5);
  
  // Show override button after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOverride(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Countdown for override button
  useEffect(() => {
    if (!showOverride && overrideCountdown > 0) {
      const timer = setTimeout(() => {
        setOverrideCountdown(overrideCountdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [showOverride, overrideCountdown]);
  
  const handleGoBack = () => {
    window.history.back();
    onClose();
  };
  
  const handleOverride = () => {
    onOverride(site);
    onClose();
  };
  
  const timeRemaining = focusSession.duration - focusSession.timeElapsed;
  
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)'
      }}
    >
      <Paper
        sx={{
          maxWidth: 600,
          width: '90%',
          p: 4,
          textAlign: 'center',
          position: 'relative',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, #1e1e1e 0%, #2d2d2d 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)'
        }}
      >
        <IconButton
          sx={{ position: 'absolute', top: 8, right: 8 }}
          onClick={onClose}
        >
          <Close />
        </IconButton>
        
        <Box sx={{ mb: 3 }}>
          <Block sx={{ fontSize: 64, color: theme.palette.error.main, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Site Blocked
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {site}
          </Typography>
        </Box>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            You're in Focus Mode with <strong>{Math.round(timeRemaining)} minutes</strong> remaining.
            This site has been blocked to help you stay productive.
          </Typography>
        </Alert>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            Stay focused on your current task:
          </Typography>
          {focusSession.currentTask && (
            <Typography variant="h6" color="primary">
              {focusSession.currentTask.title}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
            color="primary"
          >
            Go Back to Work
          </Button>
        </Box>
        
        {!showOverride && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Need to access this site? Wait {overrideCountdown} seconds...
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(5 - overrideCountdown) * 20} 
              sx={{ mt: 1 }}
            />
          </Box>
        )}
        
        {showOverride && (
          <Box sx={{ mt: 3 }}>
            <Button
              size="small"
              color="error"
              onClick={handleOverride}
            >
              Override block (affects focus score)
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default SiteBlockerOverlay;