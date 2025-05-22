# Task Management Code Reference

This document provides key code snippets and references for the task management functionality implemented in TaskMaster.

## Frontend Components

### TaskForm Component

**File Path**: `/frontend/src/components/tasks/TaskForm.js`

Key features:
- Form for creating and editing tasks
- Field validation
- Label management

```javascript
// Form validation schema
const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  description: Yup.string(),
  priority: Yup.string().required('Priority is required'),
  status: Yup.string().required('Status is required'),
  category: Yup.string().required('Category is required'),
  dueDate: Yup.date().nullable()
});

// Form implementation with Formik
const formik = useFormik({
  initialValues: {
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
    category: task?.category || 'work',
    dueDate: task?.dueDate ? new Date(task.dueDate) : null,
    labels: task?.labels || []
  },
  validationSchema,
  onSubmit: (values) => {
    onSubmit(values);
  }
});

// Label management
const handleAddLabel = () => {
  setLabelError('');
  if (!newLabel) {
    return;
  }

  if (formik.values.labels.includes(newLabel)) {
    setLabelError('Label already exists');
    return;
  }

  formik.setFieldValue('labels', [...formik.values.labels, newLabel]);
  setNewLabel('');
};

const handleRemoveLabel = (labelToRemove) => {
  formik.setFieldValue(
    'labels', 
    formik.values.labels.filter(label => label !== labelToRemove)
  );
};
```

### TaskList Component

**File Path**: `/frontend/src/components/tasks/TaskList.js`

Key features:
- Display tasks with filtering
- Handle task actions
- Search and sort functionality

```javascript
// Task rendering
<Card 
  key={task._id} 
  sx={{ 
    borderLeft: 4, 
    borderColor: `${priorityColors[task.priority]}.main`,
    opacity: task.status === 'completed' || task.status === 'archived' ? 0.8 : 1
  }}
>
  <CardContent>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Box>
        <Typography variant="h6" component="div" sx={{ 
          textDecoration: task.status === 'completed' ? 'line-through' : 'none'
        }}>
          {task.title}
        </Typography>
        
        <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
          <Chip 
            label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} 
            color={priorityColors[task.priority]} 
            size="small" 
          />
          <Chip 
            label={task.category} 
            variant="outlined" 
            size="small" 
          />
          <Chip 
            label={task.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} 
            color={getStatusColor(task.status, task)} 
            size="small" 
          />
          {isOverdue(task) && (
            <Chip 
              label="Overdue" 
              color="error" 
              size="small" 
            />
          )}
        </Stack>
        
        {/* Task details rendering... */}
      </Box>
    </Box>
  </CardContent>
</Card>

// Filter application
const applyFilters = () => {
  if (onFilterChange) {
    onFilterChange({
      searchTerm,
      category: categoryFilter,
      priority: priorityFilter,
      status: statusFilter,
      sortBy
    });
  }
};

// Check if a task is overdue
const isOverdue = (task) => {
  if (!task.dueDate || task.status === 'completed' || task.status === 'archived') return false;
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  return dueDate < now;
};
```

### TasksPage Component

**File Path**: `/frontend/src/pages/TasksPage.js`

Key features:
- Main task management page
- Integration of all task components
- Task CRUD operations

```javascript
// Fetch tasks
const fetchTasks = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Prepare API filter params
    const apiFilters = {
      ...filters,
      search: filters.searchTerm
    };
    
    // Handle sort
    if (filters.sortBy) {
      const [field, direction] = filters.sortBy.split('_');
      apiFilters.sort = field;
      apiFilters.order = direction;
    }
    
    const response = await taskService.getTasks(apiFilters);
    setTasks(response.tasks);
    setTotalTasks(response.total);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    setError('Failed to load tasks. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Create or update task
const handleSubmitTask = async (taskData) => {
  try {
    setIsSubmitting(true);
    setSubmitError(null);
    
    let result;
    let message;
    
    if (currentTask) {
      // Update existing task
      result = await taskService.updateTask(currentTask._id, taskData);
      message = 'Task updated successfully';
      
      // Update task in state
      setTasks((prevTasks) => 
        prevTasks.map((task) => 
          task._id === currentTask._id ? result : task
        )
      );
    } else {
      // Create new task
      result = await taskService.createTask(taskData);
      message = 'Task created successfully';
      
      // Add new task to state
      setTasks((prevTasks) => [result, ...prevTasks]);
    }
    
    // Close modal and show success notification
    setTaskModalOpen(false);
    setNotification({
      open: true,
      message,
      severity: 'success'
    });
    
  } catch (err) {
    console.error('Error submitting task:', err);
    setSubmitError('Failed to save task. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

// Delete task
const handleDeleteTask = async () => {
  if (!taskToDelete) return;
  
  try {
    setIsDeleting(true);
    
    await taskService.deleteTask(taskToDelete._id);
    
    // Remove deleted task from state
    setTasks((prevTasks) => 
      prevTasks.filter((task) => task._id !== taskToDelete._id)
    );
    
    // Close dialog and show success notification
    setDeleteDialogOpen(false);
    setNotification({
      open: true,
      message: 'Task deleted successfully',
      severity: 'success'
    });
    
  } catch (err) {
    console.error('Error deleting task:', err);
    setNotification({
      open: true,
      message: 'Failed to delete task. Please try again.',
      severity: 'error'
    });
  } finally {
    setIsDeleting(false);
    setTaskToDelete(null);
  }
};
```

## Backend Code

### Task Model

**File Path**: `/backend/models/taskModel.js`

```javascript
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'archived'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: {
    type: Date
  },
  emailSource: {
    type: String  // Email ID if task was extracted from email
  },
  category: {
    type: String,
    default: 'uncategorized'
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  labels: [String],
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, dueDate: 1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
```

### Task Controller

**File Path**: `/backend/controllers/taskController.js`

Key methods:

1. **Get Tasks**:
```javascript
// @desc    Get all tasks for a user
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    // Parse query parameters
    const status = req.query.status || 'pending,in-progress';
    const statusArray = status.split(',');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build the query
    const query = {
      user: req.user._id,
      status: { $in: statusArray }
    };
    
    // Add priority filter if provided
    if (req.query.priority) {
      const priorityArray = req.query.priority.split(',');
      query.priority = { $in: priorityArray };
    }
    
    // Add category filter if provided
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Add due date filter if provided
    if (req.query.dueBefore) {
      query.dueDate = { ...query.dueDate, $lte: new Date(req.query.dueBefore) };
    }
    
    if (req.query.dueAfter) {
      query.dueDate = { ...query.dueDate, $gte: new Date(req.query.dueAfter) };
    }

    // Execute the query with pagination
    const tasks = await Task.find(query)
      .sort({ dueDate: 1, priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Task.countDocuments(query);
    
    res.json({
      tasks,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
```

2. **Create Task**:
```javascript
// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, category, labels } = req.body;

    const task = await Task.create({
      user: req.user._id,
      title,
      description,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      category: category || 'uncategorized',
      labels: labels || [],
      status: 'pending'
    });

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
```

3. **Update Task**:
```javascript
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

    // Update task fields if provided
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
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
```

### Task Routes

**File Path**: `/backend/routes/taskRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  extractTasksFromText,
  saveExtractedTasks,
  getTaskAnalytics
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.post('/extract', extractTasksFromText);
router.post('/save-extracted', saveExtractedTasks);
router.get('/analytics', getTaskAnalytics);

module.exports = router;
```

## Frontend Services

### Task API Service

**File Path**: `/frontend/src/services/taskService.js`

```javascript
import api from './api';

// Get all tasks with optional filtering
export const getTasks = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    if (filters.status && filters.status !== 'all') {
      queryParams.append('status', filters.status);
    }
    
    // More filter handling...
    
    const queryString = queryParams.toString();
    const url = queryString ? `/api/tasks?${queryString}` : '/api/tasks';
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

// Create new task
export const createTask = async (taskData) => {
  try {
    const response = await api.post('/api/tasks', taskData);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Update existing task
export const updateTask = async (taskId, taskData) => {
  try {
    const response = await api.put(`/api/tasks/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    throw error;
  }
};

// Delete task
export const deleteTask = async (taskId) => {
  try {
    const response = await api.delete(`/api/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error);
    throw error;
  }
};
```

## Testing Code

### Task Creation Test

```javascript
// Example test function for task creation
const testCreateTask = async () => {
  try {
    const newTask = {
      title: 'Test Task',
      description: 'This is a test task',
      priority: 'medium',
      status: 'pending',
      category: 'work',
      dueDate: new Date(Date.now() + 86400000), // Tomorrow
      labels: ['test', 'example']
    };
    
    const response = await taskService.createTask(newTask);
    console.log('Created task:', response);
    return response;
  } catch (error) {
    console.error('Task creation test failed:', error);
    throw error;
  }
};
```

### Task Filtering Test

```javascript
// Example test function for task filtering
const testTaskFiltering = async () => {
  try {
    // Test high priority tasks
    const highPriorityTasks = await taskService.getTasks({
      priority: 'high,urgent'
    });
    console.log('High priority tasks:', highPriorityTasks);
    
    // Test overdue tasks
    const overdueTasks = await taskService.getTasks({
      dueBefore: new Date().toISOString(),
      status: 'pending,in-progress'
    });
    console.log('Overdue tasks:', overdueTasks);
    
    // Test work category
    const workTasks = await taskService.getTasks({
      category: 'work'
    });
    console.log('Work tasks:', workTasks);
    
    return {
      highPriorityTasks,
      overdueTasks,
      workTasks
    };
  } catch (error) {
    console.error('Task filtering test failed:', error);
    throw error;
  }
};
```

## Frontend Configuration Constants

### Priority and Status Options

```javascript
// Task priority options
const priorityOptions = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'info' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'urgent', label: 'Urgent', color: 'error' }
];

// Task status options
const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
];

// Default categories
const categoryOptions = [
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'finance', label: 'Finance' },
  { value: 'health', label: 'Health' },
  { value: 'learning', label: 'Learning' },
  { value: 'other', label: 'Other' }
];

// Priority colors
const priorityColors = {
  'low': 'success',
  'medium': 'info',
  'high': 'warning',
  'urgent': 'error'
};

// Status colors
const statusColors = {
  'pending': 'default',
  'in-progress': 'primary',
  'completed': 'success',
  'archived': 'error'
};
```

### Sort Options

```javascript
// Sort options
const sortOptions = [
  { value: 'dueDate_asc', label: 'Due Date (Ascending)' },
  { value: 'dueDate_desc', label: 'Due Date (Descending)' },
  { value: 'priority_asc', label: 'Priority (Low to High)' },
  { value: 'priority_desc', label: 'Priority (High to Low)' },
  { value: 'createdAt_desc', label: 'Recently Created' },
  { value: 'createdAt_asc', label: 'Oldest Created' }
];
```

## Task Analytics

### Task Statistics Generation

```javascript
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
```

## TaskModal Component

**File Path**: `/frontend/src/components/tasks/TaskModal.js`

```javascript
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TaskForm from './TaskForm';

const TaskModal = ({ 
  open, 
  onClose, 
  task, 
  onSubmit, 
  isSubmitting, 
  error 
}) => {
  const handleSubmit = (taskData) => {
    onSubmit(taskData);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="task-dialog-title"
    >
      <DialogTitle id="task-dialog-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {task ? 'Edit Task' : 'Create New Task'}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <TaskForm
          task={task}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          error={error}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
```

## Utility Functions

### Date Formatting

```javascript
import { format } from 'date-fns';

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'No due date';
  const date = new Date(dateString);
  return format(date, 'PPp'); // Format as "Apr 29, 2022, 5:00 PM"
};

// Check if a task is overdue
const isOverdue = (task) => {
  if (!task.dueDate || task.status === 'completed' || task.status === 'archived') return false;
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  return dueDate < now;
};
```

### Task Status Updates

```javascript
// Handle task status change
const handleStatusChange = async (task, newStatus) => {
  try {
    setLoading(true);
    
    const updatedTask = await taskService.updateTaskStatus(task._id, newStatus);
    
    // Update task in state
    setTasks((prevTasks) => 
      prevTasks.map((t) => 
        t._id === task._id ? updatedTask : t
      )
    );
    
    setNotification({
      open: true,
      message: `Task marked as ${newStatus.replace('-', ' ')}`,
      severity: 'success'
    });
    
  } catch (err) {
    console.error('Error updating task status:', err);
    setNotification({
      open: true,
      message: 'Failed to update task status. Please try again.',
      severity: 'error'
    });
  } finally {
    setLoading(false);
  }
};
```

## Conclusion

This code reference provides the key components and implementations for the task management functionality in TaskMaster. It covers both frontend and backend code, focusing on the most important aspects for understanding and maintaining the system.

The task management system is built with modularity in mind, separating concerns between UI components, API services, and backend controllers. This design makes it maintainable and extensible for future enhancements.
