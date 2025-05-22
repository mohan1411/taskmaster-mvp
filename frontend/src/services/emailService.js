import api from './api';

// Initiate Gmail API connection
export const connectGmail = async (authCode) => {
  try {
    const response = await api.post('/api/emails/connect-gmail', { code: authCode });
    return response.data;
  } catch (error) {
    console.error('Error connecting Gmail:', error);
    throw error;
  }
};

// Check Gmail connection status
export const checkGmailConnection = async () => {
  try {
    const response = await api.get('/api/emails/check-connection');
    return response.data;
  } catch (error) {
    console.error('Error checking Gmail connection:', error);
    throw error;
  }
};

// Get Gmail authentication URL
export const getGmailAuthUrl = async () => {
  try {
    const response = await api.get('/api/emails/auth-url');
    return response.data;
  } catch (error) {
    console.error('Error getting Gmail auth URL:', error);
    throw error;
  }
};

// Disconnect Gmail
export const disconnectGmail = async () => {
  try {
    const response = await api.post('/api/emails/disconnect');
    return response.data;
  } catch (error) {
    console.error('Error disconnecting Gmail:', error);
    throw error;
  }
};

// Sync emails from Gmail
export const syncEmails = async () => {
  try {
    const response = await api.post('/api/emails/sync');
    return response.data;
  } catch (error) {
    console.error('Error syncing emails:', error);
    throw error;
  }
};

// Get emails with filtering options
export const getEmails = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    if (filters.isRead !== undefined) {
      queryParams.append('isRead', filters.isRead);
    }
    
    if (filters.labels && filters.labels.length > 0) {
      queryParams.append('labels', filters.labels.join(','));
    }
    
    if (filters.from) {
      queryParams.append('from', filters.from);
    }
    
    if (filters.to) {
      queryParams.append('to', filters.to);
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
    const url = queryString ? `/api/emails?${queryString}` : '/api/emails';
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
};

// Get email by ID
export const getEmailById = async (emailId) => {
  try {
    const response = await api.get(`/api/emails/${emailId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching email ${emailId}:`, error);
    throw error;
  }
};

// Extract tasks from email
export const extractTasksFromEmail = async (emailId) => {
  try {
    const response = await api.post(`/api/emails/${emailId}/extract`);
    return response.data;
  } catch (error) {
    console.error(`Error extracting tasks from email ${emailId}:`, error);
    throw error;
  }
};

// Detect follow-up needs in email
export const detectFollowUp = async (emailId) => {
  try {
    const response = await api.post(`/api/emails/${emailId}/detect-followup`);
    return response.data;
  } catch (error) {
    console.error(`Error detecting follow-up for email ${emailId}:`, error);
    throw error;
  }
};

// Get email labels
export const getEmailLabels = async () => {
  try {
    const response = await api.get('/api/emails/labels');
    return response.data;
  } catch (error) {
    console.error('Error fetching email labels:', error);
    throw error;
  }
};

// Get email analytics
export const getEmailAnalytics = async () => {
  try {
    const response = await api.get('/api/emails/analytics');
    return response.data;
  } catch (error) {
    console.error('Error fetching email analytics:', error);
    throw error;
  }
};

// Export email service functions
const emailService = {
  connectGmail,
  checkGmailConnection,
  getGmailAuthUrl,
  disconnectGmail,
  syncEmails,
  getEmails,
  getEmailById,
  extractTasksFromEmail,
  detectFollowUp,
  getEmailLabels,
  getEmailAnalytics
};

export default emailService;
