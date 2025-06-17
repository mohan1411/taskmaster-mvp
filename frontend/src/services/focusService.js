import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Configure axios defaults
const api = axios.create({
  baseURL: `${API_URL}/api/focus`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const focusService = {
  // Start a new focus session
  startSession: async (sessionData) => {
    try {
      const response = await api.post('/sessions/start', sessionData);
      return response.data;
    } catch (error) {
      console.error('Error starting focus session:', error);
      throw error;
    }
  },

  // Get current active session
  getActiveSession: async () => {
    try {
      const response = await api.get('/sessions/active');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No active session
      }
      throw error;
    }
  },

  // Update session (pause/resume/task updates)
  updateSession: async (sessionId, updateData) => {
    try {
      const response = await api.put(`/sessions/${sessionId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  },

  // Pause session
  pauseSession: async (sessionId) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/pause`);
      return response.data;
    } catch (error) {
      console.error('Error pausing session:', error);
      throw error;
    }
  },

  // Resume session
  resumeSession: async (sessionId) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/resume`);
      return response.data;
    } catch (error) {
      console.error('Error resuming session:', error);
      throw error;
    }
  },

  // End session
  endSession: async (sessionId, endData) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/end`, endData);
      return response.data;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  },

  // Log distraction
  logDistraction: async (sessionId, distraction) => {
    try {
      const response = await api.post(`/sessions/${sessionId}/distraction`, distraction);
      return response.data;
    } catch (error) {
      console.error('Error logging distraction:', error);
      throw error;
    }
  },

  // Get session history
  getSessionHistory: async (params = {}) => {
    try {
      const response = await api.get('/sessions/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching session history:', error);
      throw error;
    }
  },

  // Get focus statistics
  getFocusStats: async (days = 30) => {
    try {
      const response = await api.get('/stats', { params: { days } });
      return response.data;
    } catch (error) {
      console.error('Error fetching focus stats:', error);
      throw error;
    }
  },

  // Get focus pattern
  getFocusPattern: async () => {
    try {
      const response = await api.get('/pattern');
      return response.data;
    } catch (error) {
      console.error('Error fetching focus pattern:', error);
      throw error;
    }
  },

  // Update focus preferences
  updateFocusPreferences: async (preferences) => {
    try {
      const response = await api.put('/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  },

  // Get optimal time for task
  getOptimalTimeForTask: async (taskId) => {
    try {
      const response = await api.get('/optimal-time', { params: { taskId } });
      return response.data;
    } catch (error) {
      console.error('Error getting optimal time:', error);
      throw error;
    }
  }
};

export default focusService;