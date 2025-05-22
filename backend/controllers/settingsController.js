const Settings = require('../models/settingsModel');
const { google } = require('googleapis');
const config = require('../config/config');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getUserSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ user: req.user._id });
    
    // If settings don't exist, create default settings
    if (!settings) {
      settings = await Settings.create({
        user: req.user._id
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
const updateUserSettings = async (req, res) => {
  try {
    const {
      emailSync,
      notifications,
      taskExtraction,
      followUps,
      ui
    } = req.body;
    
    let settings = await Settings.findOne({ user: req.user._id });
    
    // If settings don't exist, create them
    if (!settings) {
      settings = new Settings({
        user: req.user._id
      });
    }
    
    // Update settings if provided
    if (emailSync) {
      if (emailSync.enabled !== undefined) settings.emailSync.enabled = emailSync.enabled;
      if (emailSync.frequency) settings.emailSync.frequency = emailSync.frequency;
      if (emailSync.labels) settings.emailSync.labels = emailSync.labels;
      if (emailSync.excludeLabels) settings.emailSync.excludeLabels = emailSync.excludeLabels;
      if (emailSync.maxEmailsToProcess) settings.emailSync.maxEmailsToProcess = emailSync.maxEmailsToProcess;
    }
    
    if (notifications) {
      if (notifications.email) {
        if (notifications.email.enabled !== undefined) settings.notifications.email.enabled = notifications.email.enabled;
        if (notifications.email.frequency) settings.notifications.email.frequency = notifications.email.frequency;
      }
      
      if (notifications.browser) {
        if (notifications.browser.enabled !== undefined) settings.notifications.browser.enabled = notifications.browser.enabled;
      }
    }
    
    if (taskExtraction) {
      if (taskExtraction.autoExtract !== undefined) settings.taskExtraction.autoExtract = taskExtraction.autoExtract;
      if (taskExtraction.confirmBeforeSaving !== undefined) settings.taskExtraction.confirmBeforeSaving = taskExtraction.confirmBeforeSaving;
      if (taskExtraction.excludeTerms) settings.taskExtraction.excludeTerms = taskExtraction.excludeTerms;
    }
    
    if (followUps) {
      if (followUps.defaultReminderDays) settings.followUps.defaultReminderDays = followUps.defaultReminderDays;
      if (followUps.autoDetect !== undefined) settings.followUps.autoDetect = followUps.autoDetect;
    }
    
    if (ui) {
      if (ui.theme) settings.ui.theme = ui.theme;
      if (ui.defaultView) settings.ui.defaultView = ui.defaultView;
    }
    
    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Connect Google account
// @route   POST /api/settings/connect-google
// @access  Private
const connectGoogleAccount = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }
    
    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.googleCallbackUrl
    );
    
    // Exchange auth code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Find user settings
    let settings = await Settings.findOne({ user: req.user._id });
    
    // If settings don't exist, create them
    if (!settings) {
      settings = new Settings({
        user: req.user._id
      });
    }
    
    // Update settings with token info
    settings.integrations.google.connected = true;
    settings.integrations.google.tokenInfo = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: new Date(tokens.expiry_date)
    };
    
    const updatedSettings = await settings.save();
    
    res.json({
      message: 'Google account connected successfully',
      connected: true
    });
  } catch (error) {
    console.error('Google connection error:', error);
    res.status(500).json({ 
      message: 'Failed to connect Google account', 
      error: error.message 
    });
  }
};

// @desc    Disconnect Google account
// @route   POST /api/settings/disconnect-google
// @access  Private
const disconnectGoogleAccount = async (req, res) => {
  try {
    // Find user settings
    const settings = await Settings.findOne({ user: req.user._id });
    
    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }
    
    // If Google is connected, revoke the token
    if (settings.integrations.google.connected && settings.integrations.google.tokenInfo.accessToken) {
      try {
        // Set up OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
          config.googleClientId,
          config.googleClientSecret,
          config.googleCallbackUrl
        );
        
        // Revoke token
        await oauth2Client.revokeToken(settings.integrations.google.tokenInfo.accessToken);
      } catch (revokeError) {
        console.error('Error revoking Google token:', revokeError);
        // Continue anyway, we're still going to disconnect locally
      }
    }
    
    // Update settings
    settings.integrations.google.connected = false;
    settings.integrations.google.tokenInfo = {
      accessToken: null,
      refreshToken: null,
      expiryDate: null
    };
    
    await settings.save();
    
    res.json({
      message: 'Google account disconnected successfully',
      connected: false
    });
  } catch (error) {
    console.error('Google disconnection error:', error);
    res.status(500).json({ 
      message: 'Failed to disconnect Google account', 
      error: error.message 
    });
  }
};

// @desc    Get Google auth URL
// @route   GET /api/settings/google-auth-url
// @access  Private
const getGoogleAuthUrl = async (req, res) => {
  try {
    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.googleCallbackUrl
    );
    
    // Generate auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.labels',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      prompt: 'consent'  // Force consent screen to ensure we get a refresh token
    });
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({ 
      message: 'Failed to generate Google auth URL', 
      error: error.message 
    });
  }
};

// @desc    Check Google connection status
// @route   GET /api/settings/check-google-connection
// @access  Private
const checkGoogleConnection = async (req, res) => {
  try {
    // Find user settings
    const settings = await Settings.findOne({ user: req.user._id });
    
    if (!settings) {
      return res.json({ connected: false });
    }
    
    // Check if Google is connected
    if (!settings.integrations.google.connected || !settings.integrations.google.tokenInfo.accessToken) {
      return res.json({ connected: false });
    }
    
    // Check if token is expired
    const tokenExpiryDate = new Date(settings.integrations.google.tokenInfo.expiryDate);
    const now = new Date();
    
    if (now > tokenExpiryDate) {
      // Token is expired, try to refresh it
      if (!settings.integrations.google.tokenInfo.refreshToken) {
        // No refresh token, need to reconnect
        settings.integrations.google.connected = false;
        await settings.save();
        return res.json({ connected: false, reason: 'Token expired, no refresh token available' });
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
          refresh_token: settings.integrations.google.tokenInfo.refreshToken
        });
        
        // Refresh token
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        // Update settings with new token info
        settings.integrations.google.tokenInfo = {
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token || settings.integrations.google.tokenInfo.refreshToken,
          expiryDate: new Date(credentials.expiry_date)
        };
        
        await settings.save();
        
        return res.json({ connected: true, refreshed: true });
      } catch (refreshError) {
        console.error('Error refreshing Google token:', refreshError);
        settings.integrations.google.connected = false;
        await settings.save();
        return res.json({ connected: false, reason: 'Failed to refresh token' });
      }
    }
    
    // Token is valid
    res.json({ connected: true });
  } catch (error) {
    console.error('Error checking Google connection:', error);
    res.status(500).json({ 
      message: 'Failed to check Google connection', 
      error: error.message 
    });
  }
};

module.exports = {
  getUserSettings,
  updateUserSettings,
  connectGoogleAccount,
  disconnectGoogleAccount,
  getGoogleAuthUrl,
  checkGoogleConnection
};
