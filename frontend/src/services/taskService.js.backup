// Check authentication and API setup
import api from './api';

const taskService = {
  // Get all tasks with proper authentication
  getTasks: async (filters = {}) => {
    try {
      console.log('Getting tasks with filters:', filters);
      
      // Check if we have authentication token
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.token) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      // Ensure authorization header is set
      api.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
      
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all' && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = queryString ? `/api/tasks?${queryString}` : '/api/tasks';
      
      console.log('Making API request to:', url);
      console.log('With auth header:', api.defaults.headers.common['Authorization'] ? 'Present' : 'Missing');
      
      const response = await api.get(url);
      
      console.log('Tasks API response:', response.data);
      
      return {
        tasks: response.data.tasks || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        pages: response.data.pages || 1
      };
    } catch (error) {
      console.error('Tasks API error:', error);
      console.error('Error response:', error.response?.data);
      
      // Check for authentication errors
      if (error.response?.status === 401) {
        console.log('Authentication failed - redirecting to login');
        localStorage.removeItem('user');
        window.location.href = '/login?session=expired';
        return { tasks: [], total: 0 };
      }
      
      throw error;
    }
  },

  // Get single task
  getTaskById: async (taskId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.token) {
        throw new Error('No authentication token found');
      }
      
      api.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
      
      const response = await api.get(`/api/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Get task error:', error);
      throw error;
    }
  },

  // Create new task
  createTask: async (taskData) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.token) {
        throw new Error('No authentication token found');
      }
      
      api.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
      
      const response = await api.post('/api/tasks', taskData);
      return response.data;
    } catch (error) {
      console.error('Create task error:', error);
      throw error;
    }
  },

  // Update task
  updateTask: async (taskId, taskData) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.token) {
        throw new Error('No authentication token found');
      }
      
      api.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
      
      const response = await api.put(`/api/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      console.error('Update task error:', error);
      throw error;
    }
  },

  // Update task status
  updateTaskStatus: async (taskId, status) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.token) {
        throw new Error('No authentication token found');
      }
      
      api.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
      
      const response = await api.patch(`/api/tasks/${taskId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Update task status error:', error);
      throw error;
    }
  },

  // Delete task
  deleteTask: async (taskId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.token) {
        throw new Error('No authentication token found');
      }
      
      api.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
      
      const response = await api.delete(`/api/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Delete task error:', error);
      throw error;
    }
  }
};

export default taskService;
