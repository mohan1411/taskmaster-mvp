/**
 * Enhanced Debug Version of Email Controller
 * This adds detailed logging to help diagnose Gmail sync issues
 */

const { google } = require('googleapis');
const axios = require('axios');
const Email = require('../models/emailModel');
const User = require('../models/userModel');
const Settings = require('../models/settingsModel');
const Followup = require('../models/followupModel');
const config = require('../config/config');
const fs = require('fs');
const path = require('path');
const { Configuration, OpenAIApi } = require('openai');
const { extractTasksFromEmail: extractTasksHelper, extractTasksWithoutAI } = require('./emailTaskExtractor');
const { detectFollowUpNeeds } = require('./followupController');

// Set up logging
const logPath = path.join(__dirname, 'gmail-sync-debug.log');
const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Log to console
  console.log(logMessage);
  
  // Log to file
  fs.appendFileSync(logPath, logMessage);
};

// Start with a header to separate log sessions
logToFile('========== GMAIL SYNC DEBUG SESSION START ==========');
logToFile(`Environment: ${config.env}, Port: ${config.port}`);
logToFile(`Google Client ID available: ${!!config.googleClientId}`);
logToFile(`Google Client Secret available: ${!!config.googleClientSecret}`);
logToFile(`Google Callback URL: ${config.googleCallbackUrl}`);

// Initialize OpenAI
openai = new OpenAIApi(new Configuration({
    apiKey: config.openaiApiKey,
  }));

// Create OAuth2 client
const createOAuth2Client = (tokens) => {
  logToFile('Creating OAuth2 client with tokens');
  logToFile(`Access token available: ${!!tokens.access_token}`);
  logToFile(`Refresh token available: ${!!tokens.refresh_token}`);
  
  const oAuth2Client = new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    config.googleCallbackUrl
  );
  
  oAuth2Client.setCredentials(tokens);
  return oAuth2Client;
};

// @desc    Sync user emails from Gmail with detailed logging
// @route   POST /api/emails/sync
// @access  Private
const syncEmails = async (req, res) => {
  logToFile('============ SYNC EMAILS STARTED ============');
  logToFile(`User ID: ${req.user._id}, Email: ${req.user.email}`);
  
  try {
    // Get user settings
    logToFile('Fetching user settings from database...');
    const settings = await Settings.findOne({ user: req.user._id });
    
    if (!settings) {
      logToFile('ERROR: No settings found for user');
      return res.status(400).json({ message: 'Settings not found for user' });
    }
    
    logToFile(`Settings found, Google connected: ${settings.integrations.google.connected}`);
    
    if (!settings.integrations.google.connected) {
      logToFile('ERROR: Google integration not connected');
      return res.status(400).json({ message: 'Google integration not connected' });
    }
    
    const tokenInfo = settings.integrations.google.tokenInfo;
    logToFile(`Token info retrieved: Access token exists: ${!!tokenInfo.accessToken}, Refresh token exists: ${!!tokenInfo.refreshToken}`);
    
    // Check if token exists
    if (!tokenInfo.accessToken) {
      logToFile('ERROR: No access token available');
      return res.status(401).json({ message: 'No access token available, please reconnect' });
    }
    
    // Check if token is expired
    const tokenExpiryDate = new Date(tokenInfo.expiryDate);
    const now = new Date();
    
    logToFile(`Token expiry check: Now = ${now.toISOString()}, Expiry = ${tokenExpiryDate.toISOString()}`);
    
    if (now > tokenExpiryDate) {
      logToFile('Token expired, attempting to refresh');
      
      // Attempt to refresh the token
      if (!tokenInfo.refreshToken) {
        logToFile('ERROR: Token expired and no refresh token available');
        return res.status(401).json({ message: 'Token expired and no refresh token available, please reconnect' });
      }
      
      try {
        // Set up OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
          config.googleClientId,
          config.googleClientSecret,
          config.googleCallbackUrl
        );
        
        // Set refresh token
        oauth2Client.setCredentials({
          refresh_token: tokenInfo.refreshToken
        });
        
        logToFile('Attempting to refresh token now...');
        
        // Refresh token
        const { credentials } = await oauth2Client.refreshAccessToken();
        logToFile('Token refreshed successfully');
        
        // Update settings with new token info
        settings.integrations.google.tokenInfo = {
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token || tokenInfo.refreshToken,
          expiryDate: new Date(credentials.expiry_date)
        };
        
        await settings.save();
        logToFile('Updated settings with new token info');
        
        // Continue with the refreshed token
        tokenInfo.accessToken = credentials.access_token;
        tokenInfo.expiryDate = new Date(credentials.expiry_date);
      } catch (refreshError) {
        logToFile(`ERROR refreshing token: ${refreshError.message}`);
        if (refreshError.response) {
          logToFile(`API error details: ${JSON.stringify(refreshError.response.data)}`);
        }
        return res.status(401).json({ 
          message: 'Failed to refresh token, please reconnect Gmail', 
          error: refreshError.message 
        });
      }
    }
    
    // Create OAuth2 client
    logToFile('Creating OAuth2 client');
    const oauth2Client = createOAuth2Client({
      access_token: tokenInfo.accessToken,
      refresh_token: tokenInfo.refreshToken,
    });
    
    // Create Gmail API client
    logToFile('Creating Gmail API client');
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get emails to process
    const maxEmails = settings.emailSync.maxEmailsToProcess || 100;
    let query = '';
    
    // Add label filters if configured
    if (settings.emailSync.labels && settings.emailSync.labels.length > 0) {
      query += settings.emailSync.labels.map(label => `label:${label}`).join(' OR ');
      logToFile(`Using label filter: ${query}`);
    }
    
    // Add exclude labels if configured
    if (settings.emailSync.excludeLabels && settings.emailSync.excludeLabels.length > 0) {
      query += ' ' + settings.emailSync.excludeLabels.map(label => `-label:${label}`).join(' ');
      logToFile(`Added exclude labels: ${query}`);
    }
    
    logToFile(`Requesting list of messages from Gmail API, max results: ${maxEmails}, query: "${query}"`);
    
    // Get messages
    try {
      logToFile('Making Gmail API call to users.messages.list...');
      
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: maxEmails,
        q: query
      });
      
      logToFile(`Gmail API response received: ${response.status} ${response.statusText}`);
      logToFile(`Messages found: ${response.data.messages ? response.data.messages.length : 0}`);
      
      const messageIds = response.data.messages || [];
      const syncedEmails = [];
      
      // Process each email
      for (const message of messageIds) {
        logToFile(`Processing message ID: ${message.id}`);
        
        // Check if email already exists in our database
        const existingEmail = await Email.findOne({ 
          user: req.user._id,
          messageId: message.id
        });
        
        if (existingEmail) {
          logToFile(`Message ${message.id} already exists in database, skipping`);
          continue; // Skip if already synced
        }
        
        // Get message details
        logToFile(`Fetching message details for ID: ${message.id}`);
        
        try {
          const messageData = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata',
            metadataHeaders: [
              'From', 'To', 'Cc', 'Bcc', 'Subject', 'Date'
            ]
          });
          
          logToFile(`Message details received: ${messageData.status} ${messageData.statusText}`);
          
          const headers = messageData.data.payload.headers;
          
          // Extract headers
          const getHeader = (name) => {
            const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
            return header ? header.value : '';
          };
          
          // Parse email address from string
          const parseEmailAddress = (str) => {
            const match = str.match(/<(.+?)>$/);
            return {
              name: str.replace(/<(.+?)>$/, '').trim(),
              email: match ? match[1] : str
            };
          };
          
          // Extract sender
          const fromHeader = getHeader('From');
          const sender = parseEmailAddress(fromHeader);
          
          // Extract recipients
          const parseRecipients = (header, type) => {
            if (!header) return [];
            
            return header.split(',').map(r => {
              const parsed = parseEmailAddress(r.trim());
              return {
                name: parsed.name,
                email: parsed.email,
                type
              };
            });
          };
          
          const toRecipients = parseRecipients(getHeader('To'), 'to');
          const ccRecipients = parseRecipients(getHeader('Cc'), 'cc');
          const bccRecipients = parseRecipients(getHeader('Bcc'), 'bcc');
          
          const recipients = [...toRecipients, ...ccRecipients, ...bccRecipients];
          
          logToFile(`Creating email record for message ID: ${message.id}`);
          
          // Create new email record
          const newEmail = await Email.create({
            user: req.user._id,
            messageId: message.id,
            threadId: messageData.data.threadId,
            sender,
            recipients,
            subject: getHeader('Subject'),
            snippet: messageData.data.snippet,
            hasAttachments: messageData.data.payload.parts ? 
              messageData.data.payload.parts.some(part => part.filename && part.filename.length > 0) : 
              false,
            labels: messageData.data.labelIds || [],
            receivedAt: new Date(getHeader('Date')),
            isRead: !messageData.data.labelIds.includes('UNREAD')
          });
          
          logToFile(`Email record created successfully: ${newEmail._id}`);
          syncedEmails.push(newEmail);
          
        } catch (messageError) {
          logToFile(`ERROR fetching message details for ID ${message.id}: ${messageError.message}`);
          // Continue with next message even if one fails
          continue;
        }
      }
      
      logToFile(`Sync completed successfully. Synced ${syncedEmails.length} new emails.`);
      
      res.json({
        message: `Synced ${syncedEmails.length} new emails`,
        syncedEmails
      });
      
    } catch (listError) {
      logToFile(`ERROR getting message list from Gmail API: ${listError.message}`);
      
      // Capture detailed error information
      if (listError.response) {
        logToFile(`API error status: ${listError.response.status}`);
        logToFile(`API error data: ${JSON.stringify(listError.response.data)}`);
      }
      
      res.status(500).json({ 
        message: 'Failed to sync emails from Gmail', 
        error: listError.message,
        details: listError.response ? listError.response.data : null
      });
    }
    
  } catch (error) {
    logToFile(`GENERAL ERROR during email sync: ${error.message}`);
    logToFile(error.stack);
    
    res.status(500).json({ 
      message: 'Server error during email sync', 
      error: error.message 
    });
  } finally {
    logToFile('============ SYNC EMAILS COMPLETED ============');
  }
};

// Export the enhanced version
module.exports = {
  syncEmails
};
