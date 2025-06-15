import api from './api';

export const focusService = {
  // Session management
  startSession: async (config) => {
    const response = await api.post('/focus/sessions/start', config);
    return response.data.session;
  },

  getActiveSession: async () => {
    const response = await api.get('/focus/sessions/active');
    return response.data.session;
  },

  updateSession: async (sessionId, updates) => {
    const response = await api.put(`/focus/sessions/${sessionId}`, updates);
    return response.data.session;
  },

  pauseSession: async (sessionId) => {
    const response = await api.post(`/focus/sessions/${sessionId}/pause`);
    return response.data.session;
  },

  resumeSession: async (sessionId) => {
    const response = await api.post(`/focus/sessions/${sessionId}/resume`);
    return response.data.session;
  },

  endSession: async (sessionId, data) => {
    const response = await api.post(`/focus/sessions/${sessionId}/end`, data);
    return response.data.session;
  },

  logDistraction: async (sessionId, distraction) => {
    const response = await api.post(`/focus/sessions/${sessionId}/distraction`, distraction);
    return response.data.distractions;
  },

  // Analytics and history
  getSessionHistory: async (params = {}) => {
    const response = await api.get('/focus/sessions/history', { params });
    return response.data;
  },

  getFocusStats: async (period = 'week') => {
    const response = await api.get('/focus/stats', { params: { period } });
    return response.data.stats;
  },

  getFocusPattern: async () => {
    const response = await api.get('/focus/pattern');
    return response.data;
  },

  updateFocusPreferences: async (preferences) => {
    const response = await api.put('/focus/preferences', preferences);
    return response.data;
  },

  getOptimalTimeForTask: async (taskType, duration) => {
    const response = await api.get('/focus/optimal-time', {
      params: { taskType, duration }
    });
    return response.data;
  }
};