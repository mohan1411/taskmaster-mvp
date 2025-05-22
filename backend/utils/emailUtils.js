// utils/emailUtils.js
const { google } = require('googleapis');
const config = require('../config/config');
const Settings = require('../models/settingsModel');

/**
 * Create OAuth2 client for Gmail API
 * @param {Object} tokenInfo - Token information with accessToken and refreshToken
 * @returns {Object} - Configured OAuth2 client
 */
const createOAuth2Client = (tokenInfo) => {
  const oAuth2Client = new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    config.googleCallbackUrl
  );
  
  oAuth2Client.setCredentials({
    access_token: tokenInfo.accessToken,
    refresh_token: tokenInfo.refreshToken,
  });
  
  return oAuth2Client;
};

/**
 * Get full email content including body
 * @param {Object} email - Email object from database
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Object with success status and email with body
 */
const getEmailWithBody = async (email, userId) => {
  try {
    // Get user settings with Google OAuth tokens
    const settings = await Settings.findOne({ user: userId });
    
    if (!settings || !settings.integrations.google.connected) {
      return { 
        success: false, 
        error: 'Google integration not connected' 
      };
    }
    
    const tokenInfo = settings.integrations.google.tokenInfo;
    
    // Check if token is expired
    if (new Date() > new Date(tokenInfo.expiryDate)) {
      return { 
        success: false, 
        error: 'Google token expired, please reconnect' 
      };
    }
    
    // Create OAuth2 client
    const oauth2Client = createOAuth2Client(tokenInfo);
    
    // Create Gmail API client
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Get full message content
    const messageData = await gmail.users.messages.get({
      userId: 'me',
      id: email.messageId,
      format: 'full'
    });
    
    // Extract message body
    let messageBody = '';
    
    if (messageData.data.payload.parts) {
      // Multipart message
      messageData.data.payload.parts.forEach(part => {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          const bodyData = part.body.data;
          if (bodyData) {
            const decodedBody = Buffer.from(bodyData, 'base64').toString('utf8');
            messageBody += decodedBody;
          }
        }
      });
    } else if (messageData.data.payload.body && messageData.data.payload.body.data) {
      // Single part message
      const bodyData = messageData.data.payload.body.data;
      messageBody = Buffer.from(bodyData, 'base64').toString('utf8');
    }
    
    // Strip HTML if present for easier processing
    if (messageBody.includes('<html') || messageBody.includes('<body')) {
      // Simple HTML to text conversion
      messageBody = messageBody
        .replace(/<[^>]*>/g, ' ') // Replace tags with spaces
        .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with spaces
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim();
    }
    
    // Return email with body
    return { 
      success: true, 
      email: {
        ...email.toObject(),
        body: messageBody
      }
    };
  } catch (error) {
    console.error('Error getting email with body:', error);
    return { 
      success: false, 
      error: `Error retrieving email content: ${error.message}` 
    };
  }
};

module.exports = {
  createOAuth2Client,
  getEmailWithBody
};