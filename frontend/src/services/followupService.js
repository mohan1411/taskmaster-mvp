// services/followupService.js
import api from './api';

// Get all follow-ups with optional filtering
export const getFollowUps = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    if (filters.status) {
      queryParams.append('status', filters.status);
    }
    
    if (filters.priority) {
      queryParams.append('priority', filters.priority);
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
    const url = queryString ? `/api/followups?${queryString}` : '/api/followups';
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    throw error;
  }
};

// Get follow-up by ID
export const getFollowUpById = async (followupId) => {
  try {
    const response = await api.get(`/api/followups/${followupId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching follow-up ${followupId}:`, error);
    throw error;
  }
};

// Create a new follow-up
export const createFollowUp = async (followupData) => {
  try {
    const response = await api.post('/api/followups', followupData);
    return response.data;
  } catch (error) {
    console.error('Error creating follow-up:', error);
    throw error;
  }
};

// Update an existing follow-up
export const updateFollowUp = async (followupId, followupData) => {
  try {
    const response = await api.put(`/api/followups/${followupId}`, followupData);
    return response.data;
  } catch (error) {
    console.error(`Error updating follow-up ${followupId}:`, error);
    throw error;
  }
};

// Delete a follow-up
export const deleteFollowUp = async (followupId) => {
  try {
    const response = await api.delete(`/api/followups/${followupId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting follow-up ${followupId}:`, error);
    throw error;
  }
};

// Check for due follow-ups
export const checkDueFollowUps = async () => {
  try {
    const response = await api.get('/api/followups/check-due');
    return response.data;
  } catch (error) {
    console.error('Error checking due follow-ups:', error);
    throw error;
  }
};

// Get follow-up analytics
export const getFollowUpAnalytics = async () => {
  try {
    const response = await api.get('/api/followups/analytics');
    return response.data;
  } catch (error) {
    console.error('Error fetching follow-up analytics:', error);
    throw error;
  }
};

// Detect follow-up needs in an email
export const detectFollowUp = async (emailId) => {
  try {
    const response = await api.post(`/api/emails/${emailId}/detect-followup`);
    return response.data;
  } catch (error) {
    console.error(`Error detecting follow-up for email ${emailId}:`, error);
    throw error;
  }
};

// Snooze a follow-up
export const snoozeFollowUp = async (followupId, days = 1) => {
  try {
    const response = await api.post(`/api/reminders/followups/${followupId}/snooze`, { days });
    return response.data;
  } catch (error) {
    console.error(`Error snoozing follow-up ${followupId}:`, error);
    throw error;
  }
};

// Get reminder settings for a follow-up
export const getReminderSettings = async (followupId) => {
  try {
    const response = await api.get(`/api/reminders/followups/${followupId}/reminders`);
    return response.data;
  } catch (error) {
    console.error(`Error getting reminder settings for follow-up ${followupId}:`, error);
    throw error;
  }
};

// Update reminder settings for a follow-up
export const updateReminderSettings = async (followupId, reminderSettings) => {
  try {
    const response = await api.put(`/api/reminders/followups/${followupId}/reminders`, { reminderSettings });
    return response.data;
  } catch (error) {
    console.error(`Error updating reminder settings for follow-up ${followupId}:`, error);
    throw error;
  }
};

// Send a manual reminder for a follow-up
export const sendManualReminder = async (followupId, notificationType = 'in-app') => {
  try {
    const response = await api.post(`/api/reminders/followups/${followupId}/reminders/send`, { notificationType });
    return response.data;
  } catch (error) {
    console.error(`Error sending manual reminder for follow-up ${followupId}:`, error);
    throw error;
  }
};

// Export follow-up service functions
const followupService = {
  getFollowUps,
  getFollowUpById,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  checkDueFollowUps,
  getFollowUpAnalytics,
  detectFollowUp,
  snoozeFollowUp,
  getReminderSettings,
  updateReminderSettings,
  sendManualReminder
};

export default followupService;