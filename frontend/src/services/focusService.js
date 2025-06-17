import api from './api';

const focusService = {
  // Start a new focus session
  startSession: async (sessionData) => {
    try {
      const response = await api.post('/api/focus/sessions/start', sessionData);
      return response.data;
    } catch (error) {
      console.error('Error starting focus session:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      throw error;
    }
  },

  // Get current active session
  getActiveSession: async () => {
    try {
      const response = await api.get('/api/focus/sessions/active');
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
      const response = await api.put(`/api/focus/sessions/${sessionId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  },

  // Pause session
  pauseSession: async (sessionId) => {
    try {
      const response = await api.post(`/api/focus/sessions/${sessionId}/pause`);
      return response.data;
    } catch (error) {
      console.error('Error pausing session:', error);
      throw error;
    }
  },

  // Resume session
  resumeSession: async (sessionId) => {
    try {
      const response = await api.post(`/api/focus/sessions/${sessionId}/resume`);
      return response.data;
    } catch (error) {
      console.error('Error resuming session:', error);
      throw error;
    }
  },

  // End session
  endSession: async (sessionId, endData) => {
    try {
      console.log('focusService.endSession called with:', {
        sessionId,
        endData,
        url: `/api/focus/sessions/${sessionId}/end`
      });
      const response = await api.post(`/api/focus/sessions/${sessionId}/end`, endData);
      console.log('focusService.endSession response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error ending session in focusService:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Log distraction
  logDistraction: async (sessionId, distraction) => {
    try {
      const response = await api.post(`/api/focus/sessions/${sessionId}/distraction`, distraction);
      return response.data;
    } catch (error) {
      console.error('Error logging distraction:', error);
      throw error;
    }
  },

  // Get session history
  getSessionHistory: async (params = {}) => {
    try {
      const response = await api.get('/api/focus/sessions/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching session history:', error);
      throw error;
    }
  },

  // Get focus statistics
  getFocusStats: async (days = 30) => {
    try {
      const response = await api.get('/api/focus/stats', { params: { days } });
      return response.data;
    } catch (error) {
      console.error('Error fetching focus stats:', error);
      throw error;
    }
  },

  // Get focus pattern
  getFocusPattern: async () => {
    try {
      const response = await api.get('/api/focus/pattern');
      return response.data;
    } catch (error) {
      console.error('Error fetching focus pattern:', error);
      throw error;
    }
  },

  // Update focus preferences
  updateFocusPreferences: async (preferences) => {
    try {
      const response = await api.put('/api/focus/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  },

  // Get optimal time for task
  getOptimalTimeForTask: async (taskId) => {
    try {
      const response = await api.get('/api/focus/optimal-time', { params: { taskId } });
      return response.data;
    } catch (error) {
      console.error('Error getting optimal time:', error);
      throw error;
    }
  }
};

export default focusService;