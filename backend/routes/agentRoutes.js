const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { AgentOrchestrator } = require('../agents/productivityAgents');
const Task = require('../models/taskModel');
const Email = require('../models/emailModel');
const User = require('../models/userModel');
const FocusSession = require('../models/focusSessionModel');

// Initialize orchestrator
const orchestrator = new AgentOrchestrator();

/**
 * @swagger
 * components:
 *   schemas:
 *     DailyPlan:
 *       type: object
 *       properties:
 *         prioritizedTasks:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               taskId:
 *                 type: string
 *               title:
 *                 type: string
 *               priority:
 *                 type: integer
 *               reasoning:
 *                 type: string
 *               estimatedEnergy:
 *                 type: string
 *                 enum: [low, medium, high]
 *               bestTimeSlot:
 *                 type: string
 *                 enum: [morning, afternoon, evening]
 *         focusSession:
 *           type: object
 *           properties:
 *             recommendedDuration:
 *                 type: integer
 *             sessionType:
 *                 type: string
 *             tasks:
 *                 type: array
 *                 items:
 *                   type: string
 *             breakSuggestions:
 *                 type: array
 *                 items:
 *                   type: string
 *         newTasksFromEmail:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Task'
 *         coachingInsights:
 *           type: object
 * 
 * @swagger
 * tags:
 *   name: AI Agents
 *   description: AI-powered productivity agents
 */

// All routes are protected
router.use(protect);

/**
 * @swagger
 * /api/agents/daily-plan:
 *   post:
 *     summary: Generate AI-powered daily plan
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               includeEmails:
 *                 type: boolean
 *                 default: true
 *               energyLevel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               availableHours:
 *                 type: number
 *     responses:
 *       200:
 *         description: Daily plan generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DailyPlan'
 */
router.post('/daily-plan', async (req, res) => {
  try {
    const userId = req.user._id;
    const { includeEmails = true, energyLevel, availableHours } = req.body;

    // Fetch user's pending tasks
    const tasks = await Task.find({
      user: userId,
      status: { $in: ['todo', 'in-progress'] }
    }).sort('-priority dueDate');

    // Fetch recent emails if requested
    let emails = [];
    if (includeEmails) {
      emails = await Email.find({
        user: userId,
        taskExtracted: false
      }).sort('-receivedAt').limit(10);
    }

    // Get user stats and recent activity
    const user = await User.findById(userId);
    const recentSessions = await FocusSession.find({
      user: userId,
      status: 'completed'
    }).sort('-startTime').limit(5);

    const userContext = {
      energyLevel: energyLevel || user.currentEnergyLevel || 5,
      availableHours: availableHours || 8,
      preferences: user.preferences || {},
      stats: {
        totalTasks: user.tasksCreated || 0,
        completedTasks: user.tasksCompleted || 0,
        focusHours: user.totalFocusTime || 0,
        averageSessionLength: user.averageSessionLength || 25
      },
      recentActivity: recentSessions.map(s => ({
        date: s.startTime,
        duration: s.actualDuration,
        tasksCompleted: s.completedTasks?.length || 0
      }))
    };

    // Generate daily plan using agents
    const dailyPlan = await orchestrator.createDailyPlan(
      userId,
      tasks,
      emails,
      userContext
    );

    res.json(dailyPlan);
  } catch (error) {
    console.error('Daily plan generation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate daily plan',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/agents/prioritize-tasks:
 *   post:
 *     summary: Get AI task prioritization suggestions
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific task IDs to prioritize (optional)
 *     responses:
 *       200:
 *         description: Prioritization suggestions
 */
router.post('/prioritize-tasks', async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskIds } = req.body;

    let tasks;
    if (taskIds && taskIds.length > 0) {
      tasks = await Task.find({
        _id: { $in: taskIds },
        user: userId
      });
    } else {
      tasks = await Task.find({
        user: userId,
        status: { $in: ['todo', 'in-progress'] }
      });
    }

    const user = await User.findById(userId);
    const prioritization = await orchestrator.agents.prioritizer.prioritizeTasks(
      tasks,
      {
        energyLevel: user.currentEnergyLevel || 5,
        availableHours: 8,
        preferences: user.preferences || {}
      }
    );

    res.json(prioritization);
  } catch (error) {
    console.error('Task prioritization error:', error);
    res.status(500).json({ 
      message: 'Failed to prioritize tasks',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/agents/plan-focus-session:
 *   post:
 *     summary: Get AI-powered focus session recommendations
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               sessionType:
 *                 type: string
 *                 enum: [pomodoro, deep-work, custom]
 *     responses:
 *       200:
 *         description: Focus session plan
 */
router.post('/plan-focus-session', async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskIds, sessionType } = req.body;

    const tasks = await Task.find({
      _id: { $in: taskIds },
      user: userId
    });

    const user = await User.findById(userId);
    const recentSessions = await FocusSession.find({
      user: userId
    }).sort('-startTime').limit(5);

    const sessionPlan = await orchestrator.agents.focusPlanner.planSession(
      tasks.map(t => ({
        id: t._id,
        title: t.title,
        description: t.description,
        estimatedDuration: t.estimatedDuration,
        category: t.category
      })),
      {
        preferredType: sessionType,
        recentSessions: recentSessions.map(s => ({
          duration: s.plannedDuration,
          completed: s.status === 'completed'
        })),
        energyLevel: user.currentEnergyLevel || 5
      }
    );

    res.json(sessionPlan);
  } catch (error) {
    console.error('Focus session planning error:', error);
    res.status(500).json({ 
      message: 'Failed to plan focus session',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/agents/analyze-email:
 *   post:
 *     summary: Analyze email for tasks and insights
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailId
 *             properties:
 *               emailId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email analysis results
 */
router.post('/analyze-email', async (req, res) => {
  try {
    const { emailId } = req.body;
    const email = await Email.findOne({
      _id: emailId,
      user: req.user._id
    });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const analysis = await orchestrator.agents.emailAnalyzer.analyzeEmail(email);
    res.json(analysis);
  } catch (error) {
    console.error('Email analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to analyze email',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/agents/productivity-insights:
 *   get:
 *     summary: Get personalized productivity coaching insights
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Productivity insights and recommendations
 */
router.get('/productivity-insights', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    const recentTasks = await Task.find({
      user: userId,
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    const recentSessions = await FocusSession.find({
      user: userId,
      startTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const stats = {
      tasksCompleted: recentTasks.filter(t => t.status === 'completed').length,
      tasksCreated: recentTasks.length,
      focusHours: recentSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0) / 60,
      sessionsCompleted: recentSessions.filter(s => s.status === 'completed').length,
      averageSessionLength: recentSessions.length > 0 
        ? recentSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0) / recentSessions.length
        : 0
    };

    const recentActivity = recentSessions.map(s => ({
      date: s.startTime,
      duration: s.actualDuration || s.plannedDuration,
      completed: s.status === 'completed',
      tasksWorkedOn: s.tasks?.length || 0
    }));

    const insights = await orchestrator.agents.coach.provideCoaching(stats, recentActivity);
    res.json(insights);
  } catch (error) {
    console.error('Productivity insights error:', error);
    res.status(500).json({ 
      message: 'Failed to generate insights',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/agents/enhance-task:
 *   post:
 *     summary: Enhance task details using AI
 *     tags: [AI Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Enhanced task details
 */
router.post('/enhance-task', async (req, res) => {
  try {
    const userId = req.user._id;
    const basicTaskInfo = req.body;

    const user = await User.findById(userId);
    const recentTasks = await Task.find({
      user: userId
    }).sort('-createdAt').limit(10);

    const userContext = {
      patterns: {
        averageDuration: recentTasks.reduce((sum, t) => sum + (t.estimatedDuration || 0), 0) / recentTasks.length,
        commonCategories: [...new Set(recentTasks.map(t => t.category))],
        commonTags: [...new Set(recentTasks.flatMap(t => t.tags || []))]
      },
      workload: {
        pendingTasks: await Task.countDocuments({ user: userId, status: 'todo' }),
        thisWeekDue: await Task.countDocuments({
          user: userId,
          status: 'todo',
          dueDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
        })
      }
    };

    const enhancedTask = await orchestrator.enhanceTaskCreation(basicTaskInfo, userContext);
    res.json(enhancedTask);
  } catch (error) {
    console.error('Task enhancement error:', error);
    res.status(500).json({ 
      message: 'Failed to enhance task',
      error: error.message 
    });
  }
});

module.exports = router;