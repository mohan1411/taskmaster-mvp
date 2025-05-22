import api from './api';
import browserNotifications from '../utils/browserNotifications';

// Get notifications with optional filtering
export const getNotifications = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    if (filters.read !== undefined) {
      queryParams.append('read', filters.read);
    }
    
    if (filters.type) {
      queryParams.append('type', filters.type);
    }
    
    if (filters.page) {
      queryParams.append('page', filters.page);
    }
    
    if (filters.limit) {
      queryParams.append('limit', filters.limit);
    }
    
    const queryString = queryParams.toString();
    const url = queryString ? `/api/notifications?${queryString}` : '/api/notifications';
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Mark a notification as read
export const markNotificationRead = async (notificationId) => {
  try {
    const response = await api.put(`/api/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async () => {
  try {
    const response = await api.put('/api/notifications/mark-all-read');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting notification ${notificationId}:`, error);
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
export const updateReminderSettings = async (followupId, settings) => {
  try {
    const response = await api.put(`/api/reminders/followups/${followupId}/reminders`, {
      reminderSettings: settings
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating reminder settings for follow-up ${followupId}:`, error);
    throw error;
  }
};

// Send a manual reminder for a follow-up
export const sendManualReminder = async (followupId, notificationType = 'in-app') => {
  try {
    const response = await api.post(`/api/reminders/followups/${followupId}/reminders/send`, {
      notificationType
    });
    return response.data;
  } catch (error) {
    console.error(`Error sending manual reminder for follow-up ${followupId}:`, error);
    throw error;
  }
};

// Check for browser notification permission
export const checkBrowserNotificationPermission = () => {
  return browserNotifications.getPermissionStatus();
};

// Request browser notification permission
export const requestBrowserNotificationPermission = async () => {
  return await browserNotifications.requestPermission();
};

// Show a browser notification
export const showBrowserNotification = (title, options = {}) => {
  return browserNotifications.showNotification(title, options);
};

// Show a follow-up reminder notification
export const showFollowUpReminder = (followup) => {
  return browserNotifications.showFollowUpReminder(followup);
};

const notificationService = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getReminderSettings,
  updateReminderSettings,
  sendManualReminder,
  checkBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  showBrowserNotification,
  showFollowUpReminder
};

export default notificationService;