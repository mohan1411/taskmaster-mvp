import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';
import { detectFlowState, FlowTracker } from '../utils/flowDetection';
import taskService from '../services/taskService';
import focusService from '../services/focusService';
import distractionService from '../services/distractionService';

const FocusContext = createContext();

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
};

// Energy levels throughout the day
const getTimeBasedEnergyLevel = () => {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour <= 10) return 0.9; // Morning peak
  if (hour >= 10 && hour <= 12) return 0.8; // Late morning
  if (hour >= 12 && hour <= 14) return 0.5; // Post-lunch dip
  if (hour >= 14 && hour <= 16) return 0.7; // Afternoon recovery
  if (hour >= 16 && hour <= 18) return 0.6; // Late afternoon
  return 0.4; // Evening/night
};

// Calculate cognitive load based on task complexity
const calculateCognitiveLoad = (tasks) => {
  const weights = {
    high: 3,
    medium: 2,
    low: 1
  };
  
  const totalLoad = tasks.reduce((sum, task) => {
    return sum + (weights[task.priority] || 2);
  }, 0);
  
  return Math.min(totalLoad / 10, 1); // Normalize to 0-1
};

export const FocusProvider = ({ children }) => {
  const { showSuccess, showError, showInfo } = useNotification();
  const { user } = useAuth();
  
  // Load session from localStorage if exists
  const loadSessionFromStorage = () => {
    try {
      const stored = localStorage.getItem('fizztask-active-focus-session');
      if (stored) {
        const session = JSON.parse(stored);
        // Check if session is still valid (not older than 24 hours)
        if (session.startTime && (Date.now() - session.startTime) < 24 * 60 * 60 * 1000) {
          console.log('Loading active session from storage:', session);
          return session;
        }
      }
    } catch (error) {
      console.error('Error loading session from storage:', error);
    }
    return {
      active: false,
      id: null,
      apiSessionId: null,
      startTime: null,
      duration: 0, // in minutes
      tasks: [],
      completed: [],
      currentTask: null,
      timeElapsed: 0,
      breakTime: false,
      flowState: false,
      flowStartTime: null,
      status: null
    };
  };

  // Core focus session state
  const [focusSession, setFocusSession] = useState(loadSessionFromStorage());
  
  // Load active session from API on mount
  useEffect(() => {
    const loadActiveSession = async () => {
      if (!user) return;
      
      try {
        const activeSession = await focusService.getActiveSession();
        if (activeSession && activeSession.session) {
          const apiSession = activeSession.session;
          const allTasks = apiSession.tasks.map(t => t.task);
          const completedTaskIds = apiSession.completedTasks || [];
          
          // Find tasks that haven't been completed yet
          const remainingTasks = allTasks.filter(task => !completedTaskIds.includes(task._id));
          const currentTask = remainingTasks[0] || null;
          
          const restoredSession = {
            active: true,
            id: apiSession._id,
            apiSessionId: apiSession._id,
            startTime: new Date(apiSession.startTime).getTime(),
            duration: apiSession.plannedDuration,
            tasks: remainingTasks.slice(1), // Exclude current task
            completed: completedTaskIds, // Store only IDs, not full objects
            currentTask: currentTask,
            timeElapsed: Math.floor((Date.now() - new Date(apiSession.startTime).getTime()) / 60000),
            breakTime: apiSession.status === 'paused',
            flowState: false,
            flowStartTime: null,
            status: apiSession.status
          };
          
          console.log('Restored active session from API:', restoredSession);
          setFocusSession(restoredSession);
          
          // Restore environment
          if (apiSession.environment) {
            await applyFocusEnvironment(apiSession.environment);
          }
        }
      } catch (error) {
        console.error('Error loading active session:', error);
      }
    };
    
    loadActiveSession();
  }, [user]);
  
  // User preferences and patterns
  const [focusPreferences, setFocusPreferences] = useState({
    defaultDuration: 90,
    breakRatio: 5, // 5 minutes break per 25 minutes work
    ambientSound: 'lofi',
    volume: 0.4,
    autoExtendFlow: true,
    blockLevel: 'balanced',
    enableFlowDetection: true
  });
  
  // Energy and performance tracking
  const [userMetrics, setUserMetrics] = useState({
    currentEnergyLevel: getTimeBasedEnergyLevel(),
    cognitiveLoad: 0,
    todaysFocusTime: 0,
    streak: 0,
    weeklyStats: {
      totalFocusTime: 0,
      sessionsCompleted: 0,
      averageFlowTime: 0,
      distractionsBlocked: 0
    }
  });
  
  // Real-time tracking
  const [realtimeData, setRealtimeData] = useState({
    keystrokePattern: [],
    taskSwitches: 0,
    lastActivity: Date.now(),
    focusDepth: 0,
    distractionsToday: 0,
    flowScore: 0
  });
  
  // Distraction management
  const [distractionState, setDistractionState] = useState({
    blockedSites: [],
    queuedNotifications: [],
    allowedApps: ['fizztask', 'notes', 'calculator'],
    emergencyOverride: false
  });
  
  // Timer refs for cleanup
  const sessionTimerRef = useRef(null);
  const flowDetectionRef = useRef(null);
  const energyTrackerRef = useRef(null);
  const flowTracker = useRef(new FlowTracker());
  
  // Load user preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('fizztask-focus-preferences');
    if (savedPreferences) {
      setFocusPreferences(prev => ({ ...prev, ...JSON.parse(savedPreferences) }));
    }
    
    const savedMetrics = localStorage.getItem('fizztask-focus-metrics');
    if (savedMetrics) {
      setUserMetrics(prev => ({ ...prev, ...JSON.parse(savedMetrics) }));
    }
  }, []);
  
  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('fizztask-focus-preferences', JSON.stringify(focusPreferences));
  }, [focusPreferences]);
  
  // Persist session to localStorage
  useEffect(() => {
    if (focusSession.active) {
      localStorage.setItem('fizztask-active-focus-session', JSON.stringify(focusSession));
    } else {
      localStorage.removeItem('fizztask-active-focus-session');
    }
  }, [focusSession]);
  
  // Save metrics periodically
  useEffect(() => {
    const saveMetrics = () => {
      localStorage.setItem('fizztask-focus-metrics', JSON.stringify(userMetrics));
    };
    
    const interval = setInterval(saveMetrics, 30000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [userMetrics]);
  
  // Energy level tracking
  useEffect(() => {
    const trackEnergy = () => {
      const timeBasedEnergy = getTimeBasedEnergyLevel();
      const cognitiveLoad = calculateCognitiveLoad(focusSession.tasks);
      
      setUserMetrics(prev => ({
        ...prev,
        currentEnergyLevel: Math.max(0.1, timeBasedEnergy - (cognitiveLoad * 0.3)),
        cognitiveLoad
      }));
    };
    
    energyTrackerRef.current = setInterval(trackEnergy, 60000); // Update every minute
    trackEnergy(); // Initial call
    
    return () => {
      if (energyTrackerRef.current) {
        clearInterval(energyTrackerRef.current);
      }
    };
  }, [focusSession.tasks]);
  
  // Session timer - update every second for smooth UI
  useEffect(() => {
    if (focusSession.active && !focusSession.breakTime) {
      const startTime = focusSession.startTime;
      
      const updateTimer = () => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const elapsedMinutes = elapsedSeconds / 60; // Keep as decimal for smooth progress
        setFocusSession(prev => ({
          ...prev,
          timeElapsed: elapsedMinutes
        }));
      };
      
      // Update immediately
      updateTimer();
      
      // Then update every second
      sessionTimerRef.current = setInterval(updateTimer, 1000);
      
      return () => {
        if (sessionTimerRef.current) {
          clearInterval(sessionTimerRef.current);
        }
      };
    }
  }, [focusSession.active, focusSession.breakTime, focusSession.startTime]);
  
  // Log focus events for analytics
  const logFocusEvent = useCallback((eventType, data) => {
    try {
      const event = {
        type: eventType,
        timestamp: Date.now(),
        userId: user?.id,
        sessionId: focusSession.id,
        ...data
      };
      
      // Store in localStorage for now (could send to analytics service)
      const events = JSON.parse(localStorage.getItem('fizztask-focus-events') || '[]');
      events.push(event);
      
      // Keep only last 1000 events
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }
      
      localStorage.setItem('fizztask-focus-events', JSON.stringify(events));
      
    } catch (error) {
      console.error('Error logging focus event:', error);
    }
  }, [user?.id, focusSession.id]);
  
  // Advanced flow state detection
  useEffect(() => {
    if (focusSession.active && focusPreferences.enableFlowDetection) {
      const detectFlow = () => {
        const { keystrokePattern, taskSwitches, lastActivity, distractionsToday } = realtimeData;
        
        // Prepare data for advanced flow detection
        const flowInputData = {
          keystrokePattern,
          taskSwitches,
          sessionDuration: focusSession.timeElapsed * 60, // Convert to seconds
          appUsage: [], // Would be populated by app tracking
          actualDuration: focusSession.timeElapsed * 60,
          perceivedDuration: null, // Could be gathered through periodic prompts
          taskDifficulty: 5, // Could be inferred from task metadata
          userSkillLevel: 5, // Could be learned from historical performance
          completionRate: focusSession.completed.length / Math.max(1, focusSession.tasks.length),
          activityData: {
            keystrokes: keystrokePattern.length,
            mouseClicks: 0, // Would track mouse activity
            scrollEvents: 0, // Would track scroll activity
            activeMinutes: Math.max(0, focusSession.timeElapsed - Math.floor((Date.now() - lastActivity) / 60000))
          },
          interruptions: distractionState.queuedNotifications.map(n => ({
            urgency: n.urgency || 'low',
            source: n.source === 'user' ? 'self' : 'external'
          })),
          completedTasks: focusSession.completed.length,
          totalTasks: focusSession.tasks.length
        };
        
        // Run advanced flow detection
        const flowResult = detectFlowState(flowInputData);
        
        setRealtimeData(prev => ({ 
          ...prev, 
          flowScore: flowResult.flowScore,
          flowRecommendations: flowResult.recommendations
        }));
        
        // Record flow state for tracking
        flowTracker.current.recordFlowState(flowResult);
        
        // Enter flow state if detected and not already in flow
        if (flowResult.isInFlow && !focusSession.flowState) {
          setFocusSession(prev => ({
            ...prev,
            flowState: true,
            flowStartTime: Date.now()
          }));
          
          showInfo('🌊 Flow state detected! You\'re in the zone.', {
            duration: 3000,
            position: 'bottom'
          });
          
          logFocusEvent('flow_state_entered', {
            flowScore: flowResult.flowScore,
            indicators: flowResult.indicators
          });
        }
        
        // Exit flow state if no longer detected
        if (!flowResult.isInFlow && focusSession.flowState) {
          const flowDuration = Math.round((Date.now() - focusSession.flowStartTime) / 60000);
          setFocusSession(prev => ({
            ...prev,
            flowState: false,
            flowStartTime: null
          }));
          
          if (flowDuration >= 5) {
            showSuccess(`✨ Great flow session! ${flowDuration} minutes of deep focus.`);
          }
          
          logFocusEvent('flow_state_exited', {
            flowDuration,
            finalFlowScore: flowResult.flowScore
          });
        }
        
        // Show recommendations for flow improvement
        if (flowResult.recommendations.length > 0 && Math.random() < 0.1) { // 10% chance to show
          const highPriorityRecs = flowResult.recommendations.filter(r => r.priority === 'high');
          if (highPriorityRecs.length > 0) {
            showInfo(highPriorityRecs[0].message, { duration: 5000 });
          }
        }
      };
      
      flowDetectionRef.current = setInterval(detectFlow, 30000); // Check every 30 seconds
      
      return () => {
        if (flowDetectionRef.current) {
          clearInterval(flowDetectionRef.current);
        }
      };
    }
  }, [focusSession.active, focusSession.flowState, focusSession.timeElapsed, focusSession.completed.length, focusSession.tasks.length, realtimeData, distractionState.queuedNotifications, focusPreferences.enableFlowDetection, showInfo, showSuccess, logFocusEvent]);
  
  // Start a focus session
  const startFocusSession = useCallback(async (config) => {
    try {
      const allTasks = config.tasks || [];
      const currentTask = allTasks[0] || null;
      const remainingTasks = allTasks.slice(1); // Remove the first task from the list
      
      // Prepare session data for API
      const sessionData = {
        plannedDuration: config.duration || focusPreferences.defaultDuration,
        duration: config.duration || focusPreferences.defaultDuration, // Support both naming
        sessionType: config.sessionType || 'work',
        tasks: allTasks, // Send full task objects - backend will extract IDs
        taskIds: allTasks.map(task => task._id || task.id), // Also send just IDs
        energyLevel: userMetrics.currentEnergyLevel * 10, // Convert 0-1 to 0-10 scale
        environment: config.environment || {
          soundType: focusPreferences.ambientSound,
          blockingLevel: focusPreferences.blockLevel
        },
        notes: config.notes || ''
      };
      
      console.log('Starting focus session with API:', sessionData);
      
      // Call API to start session
      const response = await focusService.startSession(sessionData);
      const apiSession = response.session;
      
      // Update local state with API response
      const newSession = {
        active: true,
        id: apiSession._id,
        apiSessionId: apiSession._id, // Store API session ID
        startTime: new Date(apiSession.startTime).getTime(),
        duration: apiSession.plannedDuration,
        tasks: remainingTasks, // Only include tasks that aren't current
        completed: [],
        currentTask: currentTask,
        timeElapsed: 0,
        breakTime: false,
        flowState: false,
        flowStartTime: null,
        status: apiSession.status
      };
      
      console.log('Focus session started:', newSession);
      setFocusSession(newSession);
      
      // Reset realtime tracking
      setRealtimeData(prev => ({
        ...prev,
        keystrokePattern: [],
        taskSwitches: 0,
        lastActivity: Date.now(),
        focusDepth: 0
      }));
      
      // Apply focus environment
      await applyFocusEnvironment(config.environment);
      
      // Start distraction blocking
      if (config.environment?.blockNotifications || config.environment?.pauseNotifications) {
        await distractionService.startBlocking({
          blockNotifications: true,
          blockSites: config.environment?.blockSites || false,
          emergencyContacts: config.environment?.emergencyContacts || [],
          customSites: config.environment?.customBlockedSites || []
        });
      }
      
      // Initialize flow tracking
      flowTracker.current.startSession(apiSession._id);
      
      showSuccess(`🎯 Focus session started! ${config.duration} minutes of focused work.`);
      
      // Log session start
      logFocusEvent('session_started', {
        sessionId: apiSession._id,
        duration: config.duration,
        taskCount: config.tasks?.length || 0,
        energyLevel: userMetrics.currentEnergyLevel
      });
      
      return apiSession._id;
    } catch (error) {
      console.error('Failed to start focus session:', error);
      showError('Failed to start focus session. Please try again.');
      throw error;
    }
  }, [focusPreferences, userMetrics.currentEnergyLevel, showSuccess, showError]);
  
  // End focus session
  const endFocusSession = useCallback(async (reason = 'completed', endData = {}) => {
    console.log('endFocusSession called:', {
      active: focusSession.active,
      apiSessionId: focusSession.apiSessionId,
      reason,
      endData
    });
    
    if (!focusSession.active || !focusSession.apiSessionId) {
      console.error('Cannot end session - session not active or missing apiSessionId');
      return;
    }
    
    // Define variables outside try block so they're accessible in catch
    let sessionDuration = 0;
    let flowDuration = 0;
    
    try {
      sessionDuration = focusSession.timeElapsed || 0;
      flowDuration = focusSession.flowState && focusSession.flowStartTime 
        ? Math.round((Date.now() - focusSession.flowStartTime) / 60000)
        : 0;
      
      console.log('Session end data:', {
        sessionDuration,
        flowDuration,
        focusSession,
        completedCount: focusSession.completed?.length || 0
      });
      
      // Ensure all completed tasks are marked as complete in the database
      if (focusSession.completed && focusSession.completed.length > 0) {
        console.log('Syncing completed tasks to database...');
        for (const taskId of focusSession.completed) {
          try {
            // Task IDs are already marked as completed when completeCurrentTask is called
            console.log('Task already marked as completed:', taskId);
          } catch (error) {
            console.error('Failed to sync task completion:', taskId, error);
          }
        }
      }
      
      // Prepare end session data for API
      const apiEndData = {
        actualDuration: Math.round(sessionDuration),
        energyLevel: {
          end: endData.energyLevelEnd || userMetrics.currentEnergyLevel * 10
        },
        completedTasks: focusSession.completed, // Already an array of IDs
        focusScore: Math.round((realtimeData.flowScore || 0) * 100),
        distractions: {
          blocked: distractionState.queuedNotifications.length,
          encountered: realtimeData.distractionsToday
        },
        flowMetrics: {
          totalFlowTime: flowDuration,
          flowEntries: flowTracker.current.currentSession?.flowEvents?.length || 0
        },
        notes: endData.notes || '',
        endReason: reason
      };
      
      console.log('Ending focus session with API:', apiEndData);
      
      // Call API to end session
      console.log('Calling focusService.endSession with:', {
        sessionId: focusSession.apiSessionId,
        data: apiEndData
      });
      try {
        await focusService.endSession(focusSession.apiSessionId, apiEndData);
      } catch (apiError) {
        console.error('API error ending session:', apiError);
        // If the session is already ended, that's okay - continue with cleanup
        if (apiError.response?.data?.message !== 'Session already ended') {
          throw apiError; // Re-throw if it's a different error
        }
      }
      
      // Update metrics
      setUserMetrics(prev => ({
        ...prev,
        todaysFocusTime: prev.todaysFocusTime + sessionDuration,
        weeklyStats: {
          ...prev.weeklyStats,
          totalFocusTime: prev.weeklyStats.totalFocusTime + sessionDuration,
          sessionsCompleted: prev.weeklyStats.sessionsCompleted + 1,
          averageFlowTime: flowDuration > 0 
            ? Math.round((prev.weeklyStats.averageFlowTime + flowDuration) / 2)
            : prev.weeklyStats.averageFlowTime,
          distractionsBlocked: prev.weeklyStats.distractionsBlocked + distractionState.queuedNotifications.length
        }
      }));
      
      // Log session completion
      logFocusEvent('session_ended', {
        sessionId: focusSession.apiSessionId,
        duration: sessionDuration,
        plannedDuration: focusSession.duration,
        tasksCompleted: focusSession.completed.length,
        flowDuration,
        reason,
        focusScore: realtimeData.flowScore
      });
      
      // End flow tracking
      flowTracker.current.endSession();
      
      // Clean up environment
      await restoreFocusEnvironment();
      
      // Stop distraction blocking
      const distractionResult = await distractionService.stopBlocking();
      
      // Update session data with distraction metrics
      if (distractionResult.queuedNotifications?.length > 0) {
        apiEndData.distractions.blocked = distractionResult.queuedNotifications.length;
      }
      
      // Clear localStorage session before resetting state
      localStorage.removeItem('fizztask-active-focus-session');
      
      // Reset session state
      setFocusSession({
        active: false,
        id: null,
        apiSessionId: null,
        startTime: null,
        duration: 0,
        tasks: [],
        completed: [],
        currentTask: null,
        timeElapsed: 0,
        breakTime: false,
        flowState: false,
        flowStartTime: null,
        status: null
      });
      
      // Show completion message
      if (reason === 'completed' || reason === 'all_tasks_completed') {
        showSuccess(`🎉 Focus session complete! ${Math.round(sessionDuration)} minutes of productive work.`);
      } else if (reason === 'user_ended') {
        showInfo(`⏹️ Focus session ended. You worked for ${Math.round(sessionDuration)} minutes.`);
      } else {
        showInfo(`⏸️ Focus session paused. You worked for ${Math.round(sessionDuration)} minutes.`);
      }
      
    } catch (error) {
      console.error('Focus session end error - Full details:', {
        error,
        message: error.message,
        stack: error.stack,
        focusSession,
        sessionDuration,
        flowDuration
      });
      showError('Error ending focus session.');
    }
  }, [focusSession, realtimeData.flowScore, realtimeData.distractionsToday, userMetrics.currentEnergyLevel, distractionState.queuedNotifications, showSuccess, showInfo, showError, logFocusEvent]);
  
  // Apply focus environment settings
  const applyFocusEnvironment = useCallback(async (environment = {}) => {
    try {
      // Enable Do Not Disturb
      if ('Notification' in window && environment.blockNotifications !== false) {
        // Request notification permission if not granted
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
        
        setDistractionState(prev => ({
          ...prev,
          queuedNotifications: [],
          blockingActive: true
        }));
      }
      
      // Apply ambient sound
      if (environment.ambientSound && environment.ambientSound !== 'none') {
        // This would integrate with an audio service
        console.log(`Playing ambient sound: ${environment.ambientSound}`);
      }
      
      // Apply visual theme
      if (environment.theme === 'focus_dark') {
        document.documentElement.setAttribute('data-focus-mode', 'true');
      }
      
      // Apply site blocking
      if (environment.blockSites) {
        // This is handled by distractionService
        console.log('Site blocking enabled');
      }
      
    } catch (error) {
      console.error('Error applying focus environment:', error);
    }
  }, []);
  
  // Restore normal environment
  const restoreFocusEnvironment = useCallback(async () => {
    try {
      // Remove focus mode styling
      document.documentElement.removeAttribute('data-focus-mode');
      
      // Stop ambient sounds
      console.log('Stopping ambient sounds');
      
    } catch (error) {
      console.error('Error restoring environment:', error);
    }
  }, []);
  
  // Track user activity for flow detection
  const trackActivity = useCallback((activityType, data = {}) => {
    setRealtimeData(prev => ({
      ...prev,
      lastActivity: Date.now(),
      keystrokePattern: activityType === 'keystroke' 
        ? [...prev.keystrokePattern.slice(-19), Date.now()]
        : prev.keystrokePattern,
      taskSwitches: activityType === 'task_switch' 
        ? prev.taskSwitches + 1
        : prev.taskSwitches
    }));
  }, []);
  
  // Handle distractions
  const handleDistraction = useCallback((distraction) => {
    if (!focusSession.active) return { action: 'allow' };
    
    const { source, urgency, sender } = distraction;
    
    // Log the distraction
    logFocusEvent('distraction_encountered', {
      source,
      urgency,
      blocked: urgency !== 'critical'
    });
    
    // Critical interruptions always get through
    if (urgency === 'critical') {
      return { action: 'allow', reason: 'critical' };
    }
    
    // During flow state, be more protective
    if (focusSession.flowState && urgency !== 'high') {
      setDistractionState(prev => ({
        ...prev,
        queuedNotifications: [...prev.queuedNotifications, distraction]
      }));
      
      setRealtimeData(prev => ({
        ...prev,
        distractionsToday: prev.distractionsToday + 1
      }));
      
      // Log to API if session is active
      if (focusSession.apiSessionId) {
        focusService.logDistraction(focusSession.apiSessionId, {
          type: source,
          severity: urgency,
          blocked: true,
          timestamp: Date.now()
        }).catch(console.error);
      }
      
      return { action: 'block', reason: 'flow_protection' };
    }
    
    // Apply blocking rules based on preferences
    const blockLevel = focusPreferences.blockLevel;
    if (blockLevel === 'strict' || (blockLevel === 'balanced' && urgency === 'low')) {
      setDistractionState(prev => ({
        ...prev,
        queuedNotifications: [...prev.queuedNotifications, distraction]
      }));
      
      return { action: 'block', reason: 'focus_protection' };
    }
    
    return { action: 'allow' };
  }, [focusSession.active, focusSession.flowState, focusSession.apiSessionId, focusPreferences.blockLevel, logFocusEvent]);
  
  // Pause focus session
  const pauseFocusSession = useCallback(async () => {
    if (!focusSession.active || !focusSession.apiSessionId || focusSession.breakTime) return;
    
    try {
      await focusService.pauseSession(focusSession.apiSessionId);
      
      setFocusSession(prev => ({
        ...prev,
        breakTime: true,
        status: 'paused'
      }));
      
      showInfo('Focus session paused');
      logFocusEvent('session_paused', { sessionId: focusSession.apiSessionId });
    } catch (error) {
      console.error('Error pausing session:', error);
      showError('Failed to pause session');
    }
  }, [focusSession.active, focusSession.apiSessionId, focusSession.breakTime, showInfo, showError, logFocusEvent]);
  
  // Resume focus session
  const resumeFocusSession = useCallback(async () => {
    if (!focusSession.active || !focusSession.apiSessionId || !focusSession.breakTime) return;
    
    try {
      await focusService.resumeSession(focusSession.apiSessionId);
      
      setFocusSession(prev => ({
        ...prev,
        breakTime: false,
        status: 'active'
      }));
      
      showSuccess('Focus session resumed');
      logFocusEvent('session_resumed', { sessionId: focusSession.apiSessionId });
    } catch (error) {
      console.error('Error resuming session:', error);
      showError('Failed to resume session');
    }
  }, [focusSession.active, focusSession.apiSessionId, focusSession.breakTime, showSuccess, showError, logFocusEvent]);
  
  // Complete current task
  const completeCurrentTask = useCallback(async () => {
    if (!focusSession.currentTask) return;
    
    const completedTask = focusSession.currentTask;
    const nextTask = focusSession.tasks[0] || null;
    const remainingTasks = focusSession.tasks.slice(1);
    
    // Update task status in the database
    try {
      const taskId = completedTask._id || completedTask.id;
      console.log('Updating task status for:', { taskId, title: completedTask.title, task: completedTask });
      await taskService.updateTaskStatus(taskId, 'completed');
      console.log('Task marked as completed in database:', completedTask.title);
    } catch (error) {
      console.error('Failed to update task status:', error);
      console.error('Task details:', completedTask);
      showError('Failed to update task status in database');
    }
    
    setFocusSession(prev => ({
      ...prev,
      completed: [...prev.completed, completedTask._id || completedTask.id],
      tasks: remainingTasks,
      currentTask: nextTask
    }));
    
    trackActivity('task_completion', { taskId: completedTask.id });
    logFocusEvent('task_completed', { taskId: completedTask.id, title: completedTask.title });
    
    showSuccess(`✅ Task completed: ${completedTask.title}`);
    
    // Check if this was the last task
    const totalCompleted = focusSession.completed.length + 1;
    const totalTasks = totalCompleted + focusSession.tasks.length;
    
    // Auto-end session if no more tasks
    if (!nextTask) {
      showInfo(`🎯 All ${totalCompleted} tasks completed! Great work!`);
      setTimeout(() => endFocusSession('all_tasks_completed'), 2000);
    } else {
      showInfo(`Next task: ${nextTask.title}`);
    }
  }, [focusSession.currentTask, focusSession.tasks, focusSession.completed.length, trackActivity, logFocusEvent, showSuccess, showInfo, showError, endFocusSession]);
  
  // Skip current task
  const skipCurrentTask = useCallback(() => {
    if (!focusSession.currentTask) return;
    
    const skippedTask = focusSession.currentTask;
    const nextTask = focusSession.tasks[0] || null;
    const remainingTasks = focusSession.tasks.slice(1);
    
    setFocusSession(prev => ({
      ...prev,
      tasks: remainingTasks,
      currentTask: nextTask
    }));
    
    trackActivity('task_skip', { taskId: skippedTask.id });
    logFocusEvent('task_skipped', { taskId: skippedTask.id, title: skippedTask.title });
    
    showInfo(`⏭️ Task skipped: ${skippedTask.title}`);
    
    if (!nextTask) {
      showInfo('No more tasks in queue. Add more tasks or end the session.');
    }
  }, [focusSession.currentTask, focusSession.tasks, trackActivity, logFocusEvent, showInfo]);
  
  // Utility function to calculate current energy
  const calculateCurrentEnergy = useCallback(() => {
    return userMetrics.currentEnergyLevel;
  }, [userMetrics.currentEnergyLevel]);
  
  const value = {
    // State
    focusSession,
    focusPreferences,
    userMetrics,
    realtimeData,
    distractionState,
    
    // Actions
    startFocusSession,
    endFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    completeCurrentTask,
    skipCurrentTask,
    trackActivity,
    handleDistraction,
    
    // Setters
    setFocusPreferences,
    
    // Utilities
    logFocusEvent,
    calculateCurrentEnergy
  };
  
  return (
    <FocusContext.Provider value={value}>
      {children}
    </FocusContext.Provider>
  );
};