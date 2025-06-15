import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocus } from '../context/FocusContext';
import ActiveFocusSession from '../components/focus/ActiveFocusSession';
import SessionCompletion from '../components/focus/SessionCompletion';
import DistractionShield from '../components/focus/DistractionShield';
import FocusModeLauncher from '../components/focus/FocusModeLauncherV2';
import { Box, Alert, Button, Typography, Container, Paper } from '@mui/material';
import { useTasks } from '../hooks/useTasks';
import '../styles/GlobalPages.css';

const FocusPage = () => {
  const navigate = useNavigate();
  const { focusSession, userMetrics } = useFocus();
  const { tasks } = useTasks();
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState(null);
  
  // Handle session completion
  const handleSessionEnd = (sessionData) => {
    setCompletedSessionData(sessionData);
    setSessionCompleted(true);
  };
  
  const handleStartNewSession = () => {
    setSessionCompleted(false);
    setCompletedSessionData(null);
    // Stay on focus page to start a new session
  };
  
  const handleViewAnalytics = () => {
    navigate('/focus/analytics');
  };
  
  const handleCloseFocus = () => {
    setSessionCompleted(false);
    setCompletedSessionData(null);
    navigate('/dashboard');
  };
  
  // Show session completion screen
  if (sessionCompleted && completedSessionData) {
    return (
      <SessionCompletion
        sessionData={completedSessionData}
        onStartNew={handleStartNewSession}
        onViewAnalytics={handleViewAnalytics}
        onClose={handleCloseFocus}
      />
    );
  }
  
  // Show active focus session in full screen
  if (focusSession && focusSession.active) {
    return (
      <>
        <ActiveFocusSession onEndSession={handleSessionEnd} />
        <DistractionShield compact />
      </>
    );
  }
  
  // Show focus launcher page with proper layout
  return (
    <div className="page-container">
      <div className="page-content">
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 500 }}>
            Focus Mode
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter deep work mode with intelligent task scheduling and distraction blocking
          </Typography>
        </Box>

        {/* Stats Summary */}
        {userMetrics && (
          <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Paper sx={{ p: 2, minWidth: 120 }}>
              <Typography variant="h4" color="primary">
                {Math.floor(userMetrics.todaysFocusTime / 60)}h
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Today
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, minWidth: 120 }}>
              <Typography variant="h4" color="success.main">
                {userMetrics.streak || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Day Streak
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, minWidth: 120 }}>
              <Typography variant="h4" color="warning.main">
                {userMetrics.weeklyStats?.sessionsCompleted || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sessions
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, minWidth: 120 }}>
              <Typography variant="h4" color="info.main">
                {Math.round(userMetrics.currentEnergyLevel * 100)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Energy Level
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Focus Mode Launcher */}
        <FocusModeLauncher tasks={tasks} />

        {/* No tasks warning */}
        {tasks.length === 0 && (
          <Alert severity="info" sx={{ mt: 3 }}>
            You don't have any tasks yet. 
            <Button 
              size="small" 
              onClick={() => navigate('/tasks')}
              sx={{ ml: 1 }}
            >
              Create Tasks
            </Button>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default FocusPage;