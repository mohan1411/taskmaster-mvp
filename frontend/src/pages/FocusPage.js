import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocus } from '../context/FocusContext';
import ActiveFocusSession from '../components/focus/ActiveFocusSession';
import SessionCompletion from '../components/focus/SessionCompletion';
import DistractionShield from '../components/focus/DistractionShield';
import FocusModeLauncher from '../components/focus/FocusModeLauncherV2';
import { Box, Alert, Button, Typography, Container, Paper, Grid, Card, CardContent } from '@mui/material';
import { useTasks } from '../hooks/useTasks';
import '../styles/GlobalPages.css';

const FocusPage = () => {
  const navigate = useNavigate();
  const { focusSession, userMetrics } = useFocus();
  const { tasks, loadTasks } = useTasks();
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState(null);
  
  // Handle session completion
  const handleSessionEnd = (sessionData) => {
    setCompletedSessionData(sessionData);
    setSessionCompleted(true);
  };
  
  const handleStartNewSession = async () => {
    // Refresh tasks to get updated status
    await loadTasks();
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
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Today
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {Math.floor(userMetrics.todaysFocusTime / 60)}h
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Day Streak
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {userMetrics.streak || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Sessions
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {userMetrics.weeklyStats?.sessionsCompleted || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Energy Level
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {Math.round(userMetrics.currentEnergyLevel * 100)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Focus Mode Launcher - Pass only incomplete tasks */}
        <FocusModeLauncher tasks={tasks.filter(task => task.status !== 'completed')} />

        {/* No tasks warning - Check for incomplete tasks */}
        {tasks.filter(task => task.status !== 'completed').length === 0 && (
          <Alert severity="info" sx={{ mt: 3 }}>
            {tasks.length === 0 
              ? "You don't have any tasks yet." 
              : "All tasks are completed! Great job!"} 
            <Button 
              size="small" 
              onClick={() => navigate('/tasks')}
              sx={{ ml: 1 }}
            >
              Create New Tasks
            </Button>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default FocusPage;