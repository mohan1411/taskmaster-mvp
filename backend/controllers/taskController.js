const Task = require('../models/taskModel');
const mongoose = require('mongoose');
const config = require('../config/config');
const { getOpenAI } = require('../utils/openaiHelper');
const { sanitizeText, sanitizeObject, removeMongoOperators } = require('../utils/sanitizer');

// Get the OpenAI instance if available
const openai = getOpenAI();
if (openai) {
  console.log('OpenAI initialized successfully for task controller');
} else {
  console.warn('OpenAI initialization failed or OpenAI API key not configured');
  console.warn('AI-based features will be unavailable');
}

// @desc    Get all tasks for a user
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    console.log('GET TASKS: Query params:', req.query);
    
    // Parse query parameters
    const status = req.query.status || 'pending,in-progress';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build the query
    const query = {
      user: req.user._id
    };
    
    // Add status filter only if not 'all'
    if (status && status !== 'all') {
      const statusArray = status.split(',');
      query.status = { $in: statusArray };
    }
    
    // Add priority filter if provided
    if (req.query.priority && req.query.priority !== 'all') {
      const priorityArray = req.query.priority.split(',');
      query.priority = { $in: priorityArray };
    }
    
    // Add category filter if provided
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    // Add due date filter if provided
    if (req.query.dueBefore) {
      query.dueDate = { ...query.dueDate, $lte: new Date(req.query.dueBefore) };
    }
    
    if (req.query.dueAfter) {
      query.dueDate = { ...query.dueDate, $gte: new Date(req.query.dueAfter) };
    }

    // Add search filter if provided
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    console.log('GET TASKS: Final query:', JSON.stringify(query, null, 2));

    // Execute the query with pagination
    const tasks = await Task.find(query)
      .sort({ dueDate: 1, priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Task.countDocuments(query);
    
    console.log(`GET TASKS: Found ${tasks.length} tasks, total: ${total}`);
    
    res.json({
      tasks,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('GET TASKS: Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (task) {
      res.json(task);
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, category, labels } = req.body;

    // Sanitize input data
    const sanitizedData = {
      user: req.user._id,
      title: sanitizeText(title),
      description: description ? sanitizeText(description) : undefined,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      category: sanitizeText(category || 'uncategorized'),
      labels: labels ? labels.map(label => sanitizeText(label)) : [],
      status: 'pending'
    };

    const task = await Task.create(sanitizedData);

    if (task) {
      res.status(201).json(task);
    } else {
      res.status(400).json({ message: 'Invalid task data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, category, labels } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update task fields if provided (with sanitization)
    if (title) task.title = sanitizeText(title);
    if (description !== undefined) task.description = sanitizeText(description);
    if (status) {
      task.status = status;
      // If marking as completed, set completedAt date
      if (status === 'completed' && !task.completedAt) {
        task.completedAt = new Date();
      } else if (status !== 'completed') {
        task.completedAt = null;
      }
    }
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (category) task.category = category;
    if (labels) task.labels = labels;

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    console.log(`DELETE TASK: Request for task ${req.params.id} by user ${req.user._id}`);
    
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      console.log(`DELETE TASK: Task ${req.params.id} not found for user ${req.user._id}`);
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log(`DELETE TASK: Found task "${task.title}" - attempting deletion`);
    
    // Use deleteOne instead of deprecated remove() method
    await Task.deleteOne({ _id: req.params.id, user: req.user._id });
    
    console.log(`DELETE TASK: Successfully deleted task ${req.params.id}`);
    res.json({ message: 'Task removed', taskId: req.params.id });
  } catch (error) {
    console.error('DELETE TASK: Error deleting task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Extract tasks from text
// @route   POST /api/tasks/extract
// @access  Private
const extractTasksFromText = async (req, res) => {
  try {
    const { text, emailId } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Text is required for task extraction' });
    }

    // Check for valid OpenAI API key
    if (!config.openaiApiKey) {
      return res.status(500).json({ 
        message: 'OpenAI API key is not configured. Task extraction is unavailable.'
      });
    }
    
    // Check if OpenAI is available
    if (!openai) {
      return res.status(500).json({ 
        message: 'OpenAI is not available. AI-based task extraction is unavailable.'
      });
    }

    // Call OpenAI API to extract tasks
    const prompt = `
    Extract actionable tasks from the following text. For each task, provide:
    1. Task title (clear and concise)
    2. Priority (high, medium, or low)
    3. Due date (if mentioned or can be inferred)
    4. Category (infer from context)

    Format the response as a valid JSON array with objects containing:
    [
      {
        "title": "Task title",
        "description": "Additional context if available",
        "priority": "high/medium/low",
        "dueDate": "YYYY-MM-DD" or null if not specified,
        "category": "inferred category"
      }
    ]

    IMPORTANT: Your response must be a valid JSON array. Do not include any text before or after the JSON array.
    If no tasks are found, return an empty array: []

    Only extract actual tasks (things that need to be done). Don't create tasks from general statements or information.

    Text: """
    ${text}
    """
    `;

    // Call OpenAI API to extract tasks using chat completions API
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo", // Using newer model
      messages: [
        { role: "system", content: "You are a helpful assistant that extracts actionable tasks from text." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.2,
    });

    let extractedTasks = [];
    try {
      // Parse the response to get extracted tasks
      const responseText = completion.data.choices[0].message.content.trim();
      console.log('OpenAI response text:', responseText);
      
      // Make sure responseText starts with '[' and ends with ']' for JSON array
      if (responseText.startsWith('[') && responseText.endsWith(']')) {
        extractedTasks = JSON.parse(responseText);
      } else {
        // Try to find JSON array in the text
        const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          extractedTasks = JSON.parse(jsonMatch[0]);
        } else {
          // Create a simple task from the response if JSON parsing fails
          extractedTasks = [
            {
              "title": "Review text content",
              "description": "The system couldn't automatically extract structured tasks from this text. Please review it manually.",
              "priority": "medium",
              "dueDate": null,
              "category": "Manual Review"
            }
          ];
        }
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return res.status(500).json({ 
        message: 'Failed to parse extracted tasks', 
        error: parseError.message 
      });
    }

    // Return the extracted tasks without saving them yet
    res.json({
      extractedTasks,
      emailId: emailId || null
    });
  } catch (error) {
    console.error('Task extraction error:', error);
    res.status(500).json({ message: 'Server error during task extraction', error: error.message });
  }
};

// @desc    Save extracted tasks
// @route   POST /api/tasks/save-extracted
// @access  Private
const saveExtractedTasks = async (req, res) => {
  try {
    const { tasks, emailId } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ message: 'No tasks provided to save' });
    }

    // Check if this is a re-extraction (tasks already exist for this email)
    if (emailId) {
      const existingTasks = await Task.find({
        user: req.user._id,
        emailSource: emailId
      });
      
      if (existingTasks.length > 0) {
        console.log(`Found ${existingTasks.length} existing tasks for email ${emailId}`);
        
        // Return existing tasks without creating duplicates
        return res.json({
          message: `${existingTasks.length} tasks already exist for this email`,
          tasks: existingTasks,
          alreadyExtracted: true
        });
      }
    }

    const savedTasks = [];

    // Save each approved task
    for (const taskData of tasks) {
      // Parse date string to Date object if present
      let dueDate = null;
      if (taskData.dueDate) {
        dueDate = new Date(taskData.dueDate);
      }

      const task = await Task.create({
        user: req.user._id,
        title: taskData.title,
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        dueDate: dueDate,
        category: taskData.category || 'uncategorized',
        status: 'pending',
        emailSource: emailId || null,
        aiGenerated: true
      });

      savedTasks.push(task);
    }

    res.status(201).json({
      message: `${savedTasks.length} tasks saved successfully`,
      tasks: savedTasks
    });
    
    // If tasks were extracted from an email, mark the email as processed
    if (emailId) {
      const Email = mongoose.model('Email');
      await Email.findOneAndUpdate(
        { messageId: emailId, user: req.user._id },
        { taskExtracted: true }
      );
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get task analytics
// @route   GET /api/tasks/analytics
// @access  Private
const getTaskAnalytics = async (req, res) => {
  try {
    // Get counts by status
    const statusCounts = await Task.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get counts by priority
    const priorityCounts = await Task.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Get counts by category
    const categoryCounts = await Task.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Get completion trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const completionTrend = await Task.aggregate([
      { 
        $match: { 
          user: req.user._id,
          completedAt: { $gte: sevenDaysAgo }
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueTodayCount = await Task.countDocuments({
      user: req.user._id,
      dueDate: { $gte: today, $lt: tomorrow },
      status: { $ne: 'completed' }
    });

    // Overdue tasks
    const overdueCount = await Task.countDocuments({
      user: req.user._id,
      dueDate: { $lt: today },
      status: { $ne: 'completed' }
    });

    res.json({
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      priorityCounts: priorityCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      categoryCounts: categoryCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      completionTrend,
      dueTodayCount,
      overdueCount,
      totalTasks: await Task.countDocuments({ user: req.user._id })
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get task count for an email
// @route   GET /api/tasks/count
// @access  Private
const getTaskCountByEmail = async (req, res) => {
  try {
    const { emailSource } = req.query;
    
    if (!emailSource) {
      return res.status(400).json({ message: 'Email ID is required' });
    }
    
    // Count tasks that are linked to this email
    const count = await Task.countDocuments({
      user: req.user._id,
      emailSource: emailSource
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error getting task count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  extractTasksFromText,
  saveExtractedTasks,
  getTaskAnalytics,
  getTaskCountByEmail
};
