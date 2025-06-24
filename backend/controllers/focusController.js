const FocusSession = require('../models/focusSessionModel');
const FocusPattern = require('../models/focusPatternModel');
const Task = require('../models/taskModel');
const User = require('../models/userModel');

// Start a new focus session
exports.startSession = async (req, res) => {
  console.log('Focus session start request received:', {
    body: req.body,
    user: req.user ? req.user._id : 'No user',
    headers: req.headers
  });
  
  try {
    const {
      plannedDuration,
      duration, // Support both naming conventions
      sessionType,
      taskIds,
      tasks, // Support tasks array with objects
      energyLevel,
      environment
    } = req.body;

    // Support both duration and plannedDuration
    const sessionDuration = plannedDuration || duration;
    
    // Extract task IDs from tasks array if provided
    let taskIdList = taskIds;
    if (!taskIdList && tasks && Array.isArray(tasks)) {
      taskIdList = tasks.map(task => task._id || task.id);
    }

    // Validate tasks belong to user
    if (taskIdList && taskIdList.length > 0) {
      const validTasks = await Task.find({
        _id: { $in: taskIdList },
        user: req.user._id
      });
      
      if (validTasks.length !== taskIdList.length) {
        return res.status(400).json({ message: 'Some tasks not found or unauthorized' });
      }
    }

    // Create new session
    const session = new FocusSession({
      user: req.user._id,
      startTime: new Date(),
      plannedDuration: sessionDuration,
      sessionType: sessionType || 'regular',
      tasks: taskIdList ? taskIdList.map(taskId => ({
        task: taskId,
        plannedDuration: Math.floor(sessionDuration / taskIdList.length),
        completed: false,
        progress: 0
      })) : [],
      energyLevel: {
        start: energyLevel || 7
      },
      environment: environment || {},
      status: 'active'
    });

    await session.save();
    await session.populate('tasks.task');

    // Update user's focus pattern
    const pattern = await FocusPattern.findOne({ user: req.user._id });
    if (!pattern) {
      await FocusPattern.createDefaultPattern(req.user._id);
    }

    res.status(201).json({
      message: 'Focus session started',
      session
    });
  } catch (error) {
    console.error('Error starting focus session:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Error starting focus session',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get active session
exports.getActiveSession = async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      user: req.user._id,
      status: 'active'
    }).populate('tasks.task');

    if (!session) {
      return res.status(404).json({ message: 'No active session found' });
    }

    res.json({ session });
  } catch (error) {
    console.error('Error fetching active session:', error);
    res.status(500).json({ message: 'Error fetching active session' });
  }
};

// Update session progress
exports.updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      taskProgress,
      metrics,
      notes,
      flowState
    } = req.body;

    const session = await FocusSession.findOne({
      _id: sessionId,
      user: req.user._id,
      status: 'active'
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Update task progress
    if (taskProgress) {
      taskProgress.forEach(update => {
        const taskEntry = session.tasks.find(
          t => t.task.toString() === update.taskId
        );
        if (taskEntry) {
          taskEntry.progress = update.progress;
          taskEntry.actualDuration = update.duration;
          taskEntry.completed = update.completed || false;
        }
      });
    }

    // Update metrics
    if (metrics) {
      session.metrics = { ...session.metrics, ...metrics };
    }

    // Update notes
    if (notes !== undefined) {
      session.notes = notes;
    }

    // Update flow state
    if (flowState) {
      session.flowState = { ...session.flowState, ...flowState };
    }

    await session.save();
    await session.populate('tasks.task');

    res.json({
      message: 'Session updated',
      session
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ message: 'Error updating session' });
  }
};

// Pause session
exports.pauseSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await FocusSession.findOne({
      _id: sessionId,
      user: req.user._id,
      status: 'active'
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.status = 'paused';
    session.breaks.push({
      startTime: new Date(),
      type: 'short'
    });

    await session.save();

    res.json({
      message: 'Session paused',
      session
    });
  } catch (error) {
    console.error('Error pausing session:', error);
    res.status(500).json({ message: 'Error pausing session' });
  }
};

// Resume session
exports.resumeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await FocusSession.findOne({
      _id: sessionId,
      user: req.user._id,
      status: 'paused'
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // End the current break
    const currentBreak = session.breaks[session.breaks.length - 1];
    if (currentBreak && !currentBreak.endTime) {
      currentBreak.endTime = new Date();
    }

    session.status = 'active';
    await session.save();

    res.json({
      message: 'Session resumed',
      session
    });
  } catch (error) {
    console.error('Error resuming session:', error);
    res.status(500).json({ message: 'Error resuming session' });
  }
};

// End session
exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { 
      actualDuration,
      energyLevel, 
      completedTasks,
      focusScore,
      distractions,
      flowMetrics,
      notes,
      endReason,
      abandoned 
    } = req.body;
    
    console.log('Ending session with data:', req.body);

    const session = await FocusSession.findOne({
      _id: sessionId,
      user: req.user._id,
      status: { $in: ['active', 'paused'] }
    });

    if (!session) {
      // Check if session exists but is already completed
      const existingSession = await FocusSession.findOne({
        _id: sessionId,
        user: req.user._id
      });
      
      if (existingSession && existingSession.status === 'completed') {
        console.log('Session already completed:', sessionId);
        return res.json({
          message: 'Session already ended',
          session: existingSession
        });
      }
      
      console.error('Session not found or unauthorized:', sessionId);
      return res.status(404).json({ message: 'Session not found' });
    }

    // Update session with provided data
    if (energyLevel) {
      if (typeof energyLevel === 'object' && energyLevel.end) {
        session.energyLevel.end = energyLevel.end;
      } else if (typeof energyLevel === 'number') {
        session.energyLevel.end = energyLevel;
      }
    }
    
    if (actualDuration) {
      session.actualDuration = actualDuration;
    }
    
    if (completedTasks && Array.isArray(completedTasks)) {
      session.completedTasks = completedTasks;
    }
    
    if (focusScore !== undefined) {
      session.focusScore = focusScore;
    }
    
    if (distractions) {
      session.distractions = distractions;
    }
    
    if (flowMetrics) {
      session.flowMetrics = flowMetrics;
    }
    
    if (notes) {
      session.notes = notes;
    }
    
    if (endReason) {
      session.endReason = endReason;
    }

    if (abandoned) {
      session.status = 'abandoned';
      session.endTime = new Date();
      if (!actualDuration) {
        session.actualDuration = Math.round((session.endTime - session.startTime) / 1000 / 60);
      }
    } else {
      // Set end time and status
      session.endTime = new Date();
      session.status = 'completed';
      
      // Use provided actualDuration or calculate it
      if (!actualDuration) {
        session.actualDuration = Math.round((session.endTime - session.startTime) / 1000 / 60);
      }
      
      // Calculate focus score if not provided
      if (focusScore === undefined || focusScore === null) {
        session.focusScore = session.calculateFocusScore();
      }
    }
    
    // Save the session with all updates
    await session.save();

    // Update focus pattern with session data
    const pattern = await FocusPattern.findOne({ user: req.user._id });
    if (pattern) {
      await pattern.updateEnergyProfile(session);
    }

    // Update task statuses if completed
    // Use completedTasks from request if available, otherwise check session.tasks
    let taskIdsToComplete = completedTasks || [];
    
    if (!completedTasks || completedTasks.length === 0) {
      taskIdsToComplete = session.tasks
        .filter(t => t.completed)
        .map(t => t.task);
    }
    
    if (taskIdsToComplete.length > 0) {
      await Task.updateMany(
        { _id: { $in: taskIdsToComplete } },
        { status: 'completed', completedAt: new Date() }
      );
    }

    await session.populate('tasks.task');

    res.json({
      message: 'Session ended',
      session
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ message: 'Error ending session' });
  }
};

// Get session history
exports.getSessionHistory = async (req, res) => {
  try {
    const { days = 30, page = 1, limit = 20 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const sessions = await FocusSession.find({
      user: req.user._id,
      startTime: { $gte: startDate },
      status: { $in: ['completed', 'abandoned'] }
    })
      .populate('tasks.task')
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await FocusSession.countDocuments({
      user: req.user._id,
      startTime: { $gte: startDate },
      status: { $in: ['completed', 'abandoned'] }
    });

    res.json({
      sessions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching session history:', error);
    res.status(500).json({ message: 'Error fetching session history' });
  }
};

// Get focus statistics
exports.getFocusStats = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    let days;
    
    switch (period) {
      case 'day':
        days = 1;
        break;
      case 'week':
        days = 7;
        break;
      case 'month':
        days = 30;
        break;
      case 'year':
        days = 365;
        break;
      default:
        days = 7;
    }

    const stats = await FocusSession.getUserStats(req.user._id, days);
    
    // Calculate streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let checkDate = new Date(today);
    
    while (true) {
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const sessionCount = await FocusSession.countDocuments({
        user: req.user._id,
        startTime: { $gte: dayStart, $lte: dayEnd },
        status: 'completed'
      });
      
      if (sessionCount > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    stats.streak = streak;

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching focus stats:', error);
    res.status(500).json({ message: 'Error fetching focus stats' });
  }
};

// Get focus pattern
exports.getFocusPattern = async (req, res) => {
  try {
    let pattern = await FocusPattern.findOne({ user: req.user._id });
    
    if (!pattern) {
      pattern = await FocusPattern.createDefaultPattern(req.user._id);
    }

    const recommendations = pattern.generateRecommendations();
    
    res.json({
      pattern,
      recommendations
    });
  } catch (error) {
    console.error('Error fetching focus pattern:', error);
    res.status(500).json({ message: 'Error fetching focus pattern' });
  }
};

// Update focus pattern preferences
exports.updateFocusPreferences = async (req, res) => {
  try {
    const updates = req.body;
    
    let pattern = await FocusPattern.findOne({ user: req.user._id });
    
    if (!pattern) {
      pattern = await FocusPattern.createDefaultPattern(req.user._id);
    }

    // Update allowed fields
    const allowedUpdates = [
      'optimalSessionLength',
      'breakPreferences',
      'environmentPreferences',
      'taskPreferences'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field]) {
        pattern[field] = { ...pattern[field], ...updates[field] };
      }
    });

    await pattern.save();

    res.json({
      message: 'Focus preferences updated',
      pattern
    });
  } catch (error) {
    console.error('Error updating focus preferences:', error);
    res.status(500).json({ message: 'Error updating focus preferences' });
  }
};

// Get optimal time for task
exports.getOptimalTimeForTask = async (req, res) => {
  try {
    const { taskType, duration } = req.query;
    
    const pattern = await FocusPattern.findOne({ user: req.user._id });
    
    if (!pattern) {
      return res.json({
        suggestedTime: new Date().getHours() + 1,
        energyLevel: 7,
        expectedProductivity: 75
      });
    }

    const optimal = pattern.getOptimalTimeForTask(taskType, parseInt(duration));
    
    res.json(optimal);
  } catch (error) {
    console.error('Error getting optimal time:', error);
    res.status(500).json({ message: 'Error getting optimal time' });
  }
};

// Log distraction
exports.logDistraction = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { source, action } = req.body;

    const session = await FocusSession.findOne({
      _id: sessionId,
      user: req.user._id,
      status: 'active'
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.distractions.sources.push({
      type: source,
      timestamp: new Date(),
      action
    });

    if (action === 'blocked') {
      session.distractions.blocked++;
    } else if (action === 'allowed') {
      session.distractions.allowed++;
    }

    await session.save();

    res.json({
      message: 'Distraction logged',
      distractions: session.distractions
    });
  } catch (error) {
    console.error('Error logging distraction:', error);
    res.status(500).json({ message: 'Error logging distraction' });
  }
};