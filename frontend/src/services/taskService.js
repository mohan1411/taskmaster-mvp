import api from './api';

// Get all tasks with optional filtering
export const getTasks = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    console.log('TASK SERVICE: Filters received:', filters);
    
    // Add filters to query params
    if (filters.status) {
      queryParams.append('status', filters.status);
    }
    
    if (filters.priority && filters.priority !== 'all') {
      queryParams.append('priority', filters.priority);
    }
    
    if (filters.category && filters.category !== 'all') {
      queryParams.append('category', filters.category);
    }
    
    if (filters.dueBefore) {
      queryParams.append('dueBefore', filters.dueBefore);
    }
    
    if (filters.dueAfter) {
      queryParams.append('dueAfter', filters.dueAfter);
    }
    
    if (filters.search) {
      queryParams.append('search', filters.search);
    }
    
    if (filters.page) {
      queryParams.append('page', filters.page);
    }
    
    if (filters.limit) {
      queryParams.append('limit', filters.limit);
    }
    
    const queryString = queryParams.toString();
    const url = queryString ? `/api/tasks?${queryString}` : '/api/tasks';
    
    console.log('TASK SERVICE: Making request to:', url);
    
    const response = await api.get(url);
    console.log('TASK SERVICE: Response received:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

// Get task by ID
export const getTaskById = async (taskId) => {
  try {
    const response = await api.get(`/api/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching task ${taskId}:`, error);
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

// Update task status
export const updateTaskStatus = async (taskId, status) => {
  try {
    const response = await api.put(`/api/tasks/${taskId}`, { status });
    return response.data;
  } catch (error) {
    console.error(`Error updating task ${taskId} status:`, error);
    throw error;
  }
};

// Get task analytics
export const getTaskAnalytics = async () => {
  try {
    const response = await api.get('/api/tasks/analytics');
    return response.data;
  } catch (error) {
    console.error('Error fetching task analytics:', error);
    throw error;
  }
};

// Extract tasks from text
export const extractTasksFromText = async (text, emailId = null) => {
  try {
    const response = await api.post('/api/tasks/extract', { text, emailId });
    return response.data;
  } catch (error) {
    console.error('Error extracting tasks:', error);
    throw error;
  }
};

// Save extracted tasks
export const saveExtractedTasks = async (tasks, emailId = null) => {
  try {
    const response = await api.post('/api/tasks/save-extracted', { tasks, emailId });
    return response.data;
  } catch (error) {
    console.error('Error saving extracted tasks:', error);
    throw error;
  }
};

// Export task service functions
const taskService = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskAnalytics,
  extractTasksFromText,
  saveExtractedTasks
};

export default taskService;
