const { google } = require('googleapis');
const axios = require('axios');
const mongoose = require('mongoose');
const Email = require('../models/emailModel');
const User = require('../models/userModel');
const Settings = require('../models/settingsModel');
const Followup = require('../models/followupModel');
const config = require('../config/config');
const { extractTasksFromEmail: extractTasksHelper, extractTasksWithoutAI } = require('./emailTaskExtractor');
const { detectFollowUpNeeds } = require('./followupController');
const { followupExists, createFollowupIfNotExists } = require('../utils/followupUtils');
const { getOpenAI } = require('../utils/openaiHelper');

// Get the OpenAI instance if available
const openai = getOpenAI();
if (openai) {
  console.log('OpenAI initialized successfully for email controller');
} else {
  console.warn('OpenAI initialization failed or OpenAI API key not configured');
  console.warn('AI-based email features will be unavailable');
}

// Create OAuth2 client
const createOAuth2Client = (tokens) => {
  const oAuth2Client = new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    config.googleCallbackUrl
  );
  
  oAuth2Client.setCredentials(tokens);
  return oAuth2Client;
};

// @desc    Sync user emails from Gmail
// @route   POST /api/emails/sync
// @access  Private
const syncEmails = async (req, res) => {
  try {
    // Get user settings
    const settings = await Settings.findOne({ user: req.user._id });
    
    if (!settings || !settings.integrations.google.connected) {
      return res.status(400).json({ message: 'Google integration not connected' });
    }
    
    const tokenInfo = settings.integrations.google.tokenInfo;
    
    // Check if token is expired
    if (new Date() > new Date(tokenInfo.expiryDate)) {
      return res.status(401).json({ message: 'Google token expired, please reconnect' });
    }
    
    // Create OAuth2 client
    const oauth2Client = createOAuth2Client({
      access_token: tokenInfo.accessToken,
      refresh_token: tokenInfo.refreshToken,
    });
    
    // Create Gmail API client
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get emails to process
    const maxEmails = settings.emailSync.maxEmailsToProcess || 100;
    let query = '';
    
    // Add label filters if configured
    if (settings.emailSync.labels && settings.emailSync.labels.length > 0) {
      query += settings.emailSync.labels.map(label => `label:${label}`).join(' OR ');
    }
    
    // Add exclude labels if configured
    if (settings.emailSync.excludeLabels && settings.emailSync.excludeLabels.length > 0) {
      query += ' ' + settings.emailSync.excludeLabels.map(label => `-label:${label}`).join(' ');
    }
    
    // Get messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxEmails,
      q: query
    });
    
    const messageIds = response.data.messages || [];
    const syncedEmails = [];
    
    // Process each email
    for (const message of messageIds) {
      // Check if email already exists in our database
      const existingEmail = await Email.findOne({ 
        user: req.user._id,
        messageId: message.id
      });
      
      if (existingEmail) {
        continue; // Skip if already synced
      }
      
      // Get message details
      const messageData = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'metadata',
        metadataHeaders: [
          'From', 'To', 'Cc', 'Bcc', 'Subject', 'Date'
        ]
      });
      
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
      
      syncedEmails.push(newEmail);
      
      // Auto-detection temporarily disabled for MVP
      // Comment: Smart task and follow-up extraction code is kept in codebase but disabled for MVP
      console.log(`MVP Mode: Auto-detection skipped for email: ${newEmail.subject}`);
      
      // Only uncomment this section when re-enabling smart detection features
      /*
      // Only detect follow-ups if configured and OpenAI API is available
      if (settings.followUps && settings.followUps.autoDetect && config.openaiApiKey) {
        try {
          // Get email content for follow-up detection
          const fullMessageData = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });
          
          // Extract message body for AI processing
          let messageBody = '';
          if (fullMessageData.data.payload.parts) {
            fullMessageData.data.payload.parts.forEach(part => {
              if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
                const bodyData = part.body.data;
                if (bodyData) {
                  const decodedBody = Buffer.from(bodyData, 'base64').toString('utf8');
                  messageBody += decodedBody;
                }
              }
            });
          } else if (fullMessageData.data.payload.body && fullMessageData.data.payload.body.data) {
            const bodyData = fullMessageData.data.payload.body.data;
            messageBody = Buffer.from(bodyData, 'base64').toString('utf8');
          }
          
          // Strip HTML if present
          if (messageBody.includes('<html') || messageBody.includes('<body')) {
            messageBody = messageBody
              .replace(/<[^>]*>/g, ' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
          }
          
          const emailWithBody = {
            _id: newEmail._id,
            sender: newEmail.sender,
            subject: newEmail.subject,
            receivedAt: newEmail.receivedAt,
            threadId: newEmail.threadId,
            messageId: newEmail.messageId,
            body: messageBody
          };
          
          // Detect follow-up needs
          const followUpResult = await detectFollowUpNeeds(emailWithBody);
          
          if (followUpResult.success && followUpResult.followUpAnalysis.needsFollowUp) {
            // Update email with follow-up info
            newEmail.needsFollowUp = true;
            newEmail.followUpDueDate = new Date(followUpResult.followUpAnalysis.suggestedDate);
            await newEmail.save();
            
            // Check if follow-up already exists before creating
            const followupData = {
              user: req.user._id,
              emailId: newEmail.messageId,
              threadId: newEmail.threadId,
              subject: newEmail.subject,
              contactName: newEmail.sender.name,
              contactEmail: newEmail.sender.email,
              status: 'pending',
              priority: 'medium',
              dueDate: new Date(followUpResult.followUpAnalysis.suggestedDate),
              reason: followUpResult.followUpAnalysis.reason,
              notes: followUpResult.followUpAnalysis.reason,
              keyPoints: followUpResult.followUpAnalysis.keyPoints,
              aiGenerated: true
            };
            
            // Create follow-up only if it doesn't already exist
            await createFollowupIfNotExists(followupData);
            
            console.log(`Follow-up created for email: ${newEmail.subject}`);
          }
        } catch (followUpError) {
          console.error(`Error detecting follow-up for email ${newEmail._id}:`, followUpError);
          // Continue processing other emails even if one fails
        }
      }
      */
    }
    
    res.json({
      message: `Synced ${syncedEmails.length} new emails`,
      syncedEmails
    });
  } catch (error) {
    console.error('Email sync error:', error);
    res.status(500).json({ 
      message: 'Server error during email sync', 
      error: error.message 
    });
  }
};

// @desc    Get user emails
// @route   GET /api/emails
// @access  Private
const getEmails = async (req, res) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { user: req.user._id };
    
    // Filter by read status
    if (req.query.isRead !== undefined) {
      query.isRead = req.query.isRead === 'true';
    }
    
    // Filter by labels
    if (req.query.labels) {
      const labelArray = req.query.labels.split(',');
      query.labels = { $in: labelArray };
    }
    
    // Filter by date range
    if (req.query.from) {
      query.receivedAt = { ...query.receivedAt, $gte: new Date(req.query.from) };
    }
    
    if (req.query.to) {
      query.receivedAt = { ...query.receivedAt, $lte: new Date(req.query.to) };
    }
    
    // Filter by search term
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { subject: searchRegex },
        { snippet: searchRegex },
        { 'sender.email': searchRegex },
        { 'sender.name': searchRegex }
      ];
    }
    
    // Execute query
    const emails = await Email.find(query)
      .sort({ receivedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Email.countDocuments(query);
    
    res.json({
      emails,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get email by ID
// @route   GET /api/emails/:id
// @access  Private
const getEmailById = async (req, res) => {
  try {
    const email = await Email.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Check for valid OpenAI API key
    if (!config.openaiApiKey) {
      return res.status(500).json({ 
        message: 'OpenAI API key is not configured. Task extraction is unavailable.'
      });
    }

    // Get user settings
    const settings = await Settings.findOne({ user: req.user._id });
    
    if (!settings || !settings.integrations.google.connected) {
      return res.status(400).json({ message: 'Google integration not connected' });
    }
    
    const tokenInfo = settings.integrations.google.tokenInfo;
    
    // Create OAuth2 client
    const oauth2Client = createOAuth2Client({
      access_token: tokenInfo.accessToken,
      refresh_token: tokenInfo.refreshToken,
    });
    
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
    } else if (messageData.data.payload.body.data) {
      // Single part message
      const bodyData = messageData.data.payload.body.data;
      messageBody = Buffer.from(bodyData, 'base64').toString('utf8');
    }
    
    // Mark as read if not already
    if (!email.isRead) {
      email.isRead = true;
      await email.save();
    }
    
    res.json({
      ...email.toObject(),
      body: messageBody
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Updated integration for email controller
 * This shows how to integrate the fixed task extractor into your email controller
 */

// @desc    Extract tasks from email
// @route   POST /api/emails/:id/extract
// @access  Private
const extractTasksFromEmail = async (req, res) => {
  console.log('Starting task extraction process on backend for email ID:', req.params.id);
  
  try {
    // Find the email
    const email = await Email.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!email) {
      console.log('Email not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Email not found' });
    }
    
    console.log('Email found:', email._id, email.subject);
    
    // Check if tasks have already been extracted from this email
    if (email.taskExtracted) {
      console.log('Tasks have already been extracted from this email');
      
      // Get existing tasks for this email
      const Task = mongoose.model('Task');
      const existingTasks = await Task.find({ 
        user: req.user._id,
        emailSource: email.messageId
      });
      
      if (existingTasks.length > 0) {
        console.log(`Found ${existingTasks.length} existing tasks for this email`);
        return res.json({
          message: 'Tasks have already been extracted from this email',
          extractedTasks: existingTasks,
          emailId: email.messageId,
          alreadyExtracted: true
        });
      }
      
      // If no tasks found despite taskExtracted flag, continue with extraction
      console.log('No existing tasks found despite taskExtracted flag, proceeding with extraction');
    }
    
    // Check for valid OpenAI API key
    if (!config.openaiApiKey) {
      console.log('ERROR: OpenAI API key not configured');
      return res.status(500).json({ 
        message: 'OpenAI API key is not configured. Task extraction is unavailable.'
      });
    }
    
    // Extract message body
    let messageBody = '';
    
    // Fetch from Gmail API
    const settings = await Settings.findOne({ user: req.user._id });
    
    if (!settings || !settings.integrations.google.connected) {
      console.log('Gmail not connected');
      return res.status(400).json({ message: 'Email body not available. Gmail integration not connected.' });
    }
    
    const tokenInfo = settings.integrations.google.tokenInfo;
      
      // Create OAuth2 client
      const oauth2Client = createOAuth2Client({
        access_token: tokenInfo.accessToken,
        refresh_token: tokenInfo.refreshToken,
      });
      
      // Create Gmail API client
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      // Get full message content
      const messageData = await gmail.users.messages.get({
        userId: 'me',
        id: email.messageId,
        format: 'full'
      });
      
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
    }
    
    // Strip HTML if present
    if (messageBody.includes('<html') || messageBody.includes('<body')) {
      // Simple HTML to text conversion
      messageBody = messageBody
        .replace(/<[^>]*>/g, ' ') // Replace tags with spaces
        .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with spaces
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim();
    }
    
    // Create email object for extraction
    const emailForExtraction = {
      _id: email._id,
      sender: email.sender,
      subject: email.subject,
      receivedAt: email.receivedAt,
      body: messageBody,
      snippet: email.snippet
    };
    
    // Call your extraction function
    try {
      console.log('Calling task extraction function...');
      
      // Use the AI-powered extraction function
      const result = await extractTasksHelper(emailForExtraction);
      
      console.log('Extraction result from AI:', result);
      
      if (result.success && result.extractedTasks && result.extractedTasks.length > 0) {
        // *** FIX: Actually save tasks to database ***
        const Task = mongoose.model('Task');
        const savedTasks = [];
        
        for (const taskData of result.extractedTasks) {
          try {
            // Create task in database
            const newTask = await Task.create({
              title: taskData.title,
              description: taskData.description || `Task extracted from email: ${email.subject}`,
              user: req.user._id,
              status: 'pending',
              priority: taskData.priority || 'medium',
              category: taskData.category || 'Email',
              emailSource: email.messageId,
              emailId: email.messageId,
              dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            
            console.log('✅ Task saved to database:', newTask._id, newTask.title);
            savedTasks.push(newTask);
            
          } catch (taskCreateError) {
            console.error('❌ Error creating task in database:', taskCreateError);
            // Continue with other tasks even if one fails
          }
        }
        
        // Mark email as processed
        email.taskExtracted = true;
        await email.save();
        
        console.log(`✅ Successfully saved ${savedTasks.length} tasks to database`);
        
        // Return the saved tasks
        return res.json({
          message: `Successfully extracted and saved ${savedTasks.length} tasks`,
          extractedTasks: savedTasks,
          emailId: email.messageId,
          alreadyExtracted: false
        });
      } else {
        console.log('Task extraction failed:', result.error);
        return res.status(500).json({ 
          message: 'Failed to extract tasks', 
          error: result.error 
        });
      }
    } catch (extractionError) {
      console.error('Error in extraction function:', extractionError);
      return res.status(500).json({ 
        message: 'Error in task extraction function', 
        error: extractionError.message 
      });
    }
  } catch (error) {
    console.error('General server error:', error);
    res.status(500).json({ 
      message: 'Server error during task extraction', 
      error: error.message 
    });
  }
};

// @desc    Detect follow-up needs in email
// @route   POST /api/emails/:id/detect-followup
// @access  Private
const detectFollowUp = async (req, res) => {
  try {
    const email = await Email.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Check for valid OpenAI API key
    if (!config.openaiApiKey) {
      return res.status(500).json({ 
        message: 'OpenAI API key is not configured. Follow-up detection is unavailable.'
      });
    }
    
    // Check if OpenAI is available
    if (!openai) {
      return res.status(500).json({ 
        message: 'OpenAI is not available. AI-based follow-up detection is unavailable.'
      });
    }
    
    // Get user settings
    const settings = await Settings.findOne({ user: req.user._id });
    
    if (!settings || !settings.integrations.google.connected) {
      return res.status(400).json({ message: 'Google integration not connected' });
    }
    
    const tokenInfo = settings.integrations.google.tokenInfo;
    
    // Create OAuth2 client
    const oauth2Client = createOAuth2Client({
      access_token: tokenInfo.accessToken,
      refresh_token: tokenInfo.refreshToken,
    });
    
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
    } else if (messageData.data.payload.body.data) {
      // Single part message
      const bodyData = messageData.data.payload.body.data;
      messageBody = Buffer.from(bodyData, 'base64').toString('utf8');
    }
    
    // Strip HTML if present
    if (messageBody.includes('<html') || messageBody.includes('<body')) {
      messageBody = messageBody
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    // Context for OpenAI
    const emailContext = `
    From: ${email.sender.name} <${email.sender.email}>
    Subject: ${email.subject}
    Date: ${email.receivedAt}
    
    ${messageBody}
    `;
    
    // Call OpenAI API to analyze follow-up needs
    const prompt = `
    Analyze this email to determine if it requires a follow-up response. Check for:
    1. Explicit questions that need answers
    2. Requests for actions, information, or feedback
    3. Deadlines or timeframes mentioned for a response
    4. Implied expectations of a reply

    If a follow-up is needed, provide:
    1. A brief reason why follow-up is needed
    2. Suggested follow-up date (YYYY-MM-DD format)
    3. Key points to address in the follow-up

    Format the response as a valid JSON object:
    {
      "needsFollowUp": true/false,
      "reason": "Brief explanation of why follow-up is needed",
      "suggestedDate": "YYYY-MM-DD",
      "keyPoints": ["Point 1", "Point 2", ...]
    }

    IMPORTANT: Your response must be a valid JSON object. Do not include any text before or after the JSON object.
    If no follow-up is needed, still provide the full JSON object with needsFollowUp set to false.

    Email: """
    ${emailContext}
    """
    `;

    // Call OpenAI API to analyze follow-up needs using chat completions API
    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini-2024-07-18", // Using newer model
      messages: [
        { role: "system", content: "You are a helpful assistant that analyzes emails for follow-up needs." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.2,
    });

    let followUpAnalysis = {};
    try {
      // Parse the response
      const responseText = completion.data.choices[0].message.content.trim();
      console.log('OpenAI follow-up response:', responseText);
      
      // Check if response is valid JSON
      if (responseText.startsWith('{') && responseText.endsWith('}')) {
        followUpAnalysis = JSON.parse(responseText);
      } else {
        // Try to find JSON object in the text
        const jsonMatch = responseText.match(/\{[^\{\}]*"needsFollowUp"[^\{\}]*\}/s);
        if (jsonMatch) {
          followUpAnalysis = JSON.parse(jsonMatch[0]);
        } else {
          // Default fallback if parsing fails
          followUpAnalysis = {
            "needsFollowUp": false,
            "reason": "Could not determine follow-up needs automatically",
            "suggestedDate": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
            "keyPoints": ["Review email manually to determine if follow-up is needed"]
          };
        }
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return res.status(500).json({ 
        message: 'Failed to parse follow-up analysis', 
        error: parseError.message 
      });
    }
    
    // Update email with follow-up info if needed
    if (followUpAnalysis.needsFollowUp) {
      email.needsFollowUp = true;
      email.followUpDueDate = new Date(followUpAnalysis.suggestedDate);
      await email.save();
      
      // Check if follow-up already exists before creating
      const existingFollowup = await Followup.findOne({
        user: req.user._id,
        emailId: email.messageId
      });
      
      if (existingFollowup) {
        // Update the existing follow-up
        existingFollowup.dueDate = new Date(followUpAnalysis.suggestedDate);
        existingFollowup.reason = followUpAnalysis.reason;
        existingFollowup.notes = followUpAnalysis.keyPoints.join('\n');
        existingFollowup.keyPoints = followUpAnalysis.keyPoints;
        const followup = await existingFollowup.save();
        
        res.json({
          ...followUpAnalysis,
          followup,
          message: "Updated existing follow-up"
        });
      } else {
        // Create new follow-up
        const followupData = {
          user: req.user._id,
          emailId: email.messageId,
          threadId: email.threadId,
          subject: email.subject,
          contactName: email.sender.name,
          contactEmail: email.sender.email,
          status: 'pending',
          dueDate: new Date(followUpAnalysis.suggestedDate),
          notes: followUpAnalysis.keyPoints.join('\n'),
          reason: followUpAnalysis.reason,
          keyPoints: followUpAnalysis.keyPoints,
          aiGenerated: true
        };
        
        // Create follow-up
        const followup = await createFollowupIfNotExists(followupData);
        
        res.json({
          ...followUpAnalysis,
          followup
        });
      }
    } else {
      // Only update the email if there are no existing follow-ups
      const existingFollowup = await Followup.findOne({
        user: req.user._id,
        emailId: email.messageId
      });
      
      if (!existingFollowup) {
        email.needsFollowUp = false;
        await email.save();
      }
      
      res.json(followUpAnalysis);
    }
  } catch (error) {
    console.error('Follow-up detection error:', error);
    res.status(500).json({ 
      message: 'Server error during follow-up detection', 
      error: error.message 
    });
  }
};

// @desc    Get all email labels
// @route   GET /api/emails/labels
// @access  Private
const getEmailLabels = async (req, res) => {
  try {
    // Get user settings
    const settings = await Settings.findOne({ user: req.user._id });
    
    if (!settings || !settings.integrations.google.connected) {
      return res.status(400).json({ message: 'Google integration not connected' });
    }
    
    const tokenInfo = settings.integrations.google.tokenInfo;
    
    // Create OAuth2 client
    const oauth2Client = createOAuth2Client({
      access_token: tokenInfo.accessToken,
      refresh_token: tokenInfo.refreshToken,
    });
    
    // Create Gmail API client
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Get labels
    const response = await gmail.users.labels.list({
      userId: 'me'
    });
    
    const labels = response.data.labels || [];
    
    res.json(labels);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get email analytics
// @route   GET /api/emails/analytics
// @access  Private
const getEmailAnalytics = async (req, res) => {
  try {
    // Volume by day
    const volumeByDay = await Email.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$receivedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } },
      { $limit: 30 }
    ]);
    
    // Top senders
    const topSenders = await Email.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$sender.email',
          name: { $first: '$sender.name' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Unread count
    const unreadCount = await Email.countDocuments({
      user: req.user._id,
      isRead: false
    });
    
    // Follow-up count
    const followUpCount = await Email.countDocuments({
      user: req.user._id,
      needsFollowUp: true
    });
    
    // Task extraction stats
    const taskExtractionCount = await Email.countDocuments({
      user: req.user._id,
      taskExtracted: true
    });
    
    // Get stats by hour of day
    const emailsByHour = await Email.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: { $hour: '$receivedAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    res.json({
      volumeByDay,
      topSenders,
      unreadCount,
      followUpCount,
      taskExtractionCount,
      emailsByHour,
      totalEmails: await Email.countDocuments({ user: req.user._id })
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Connect to Gmail with OAuth code
// @route   POST /api/emails/connect-gmail
// @access  Private
const connectGmail = async (req, res) => {
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
      message: 'Gmail account connected successfully',
      success: true
    });
  } catch (error) {
    console.error('Gmail connection error:', error);
    res.status(500).json({ 
      message: 'Failed to connect Gmail account', 
      error: error.message 
    });
  }
};

// @desc    Check Gmail connection status
// @route   GET /api/emails/check-connection
// @access  Private
const checkGmailConnection = async (req, res) => {
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
        console.error('Error refreshing Gmail token:', refreshError);
        settings.integrations.google.connected = false;
        await settings.save();
        return res.json({ connected: false, reason: 'Failed to refresh token' });
      }
    }
    
    // Token is valid
    res.json({ connected: true });
  } catch (error) {
    console.error('Error checking Gmail connection:', error);
    res.status(500).json({ 
      message: 'Failed to check Gmail connection', 
      error: error.message 
    });
  }
};

// @desc    Get Gmail auth URL
// @route   GET /api/emails/auth-url
// @access  Private
const getGmailAuthUrl = async (req, res) => {
  try {
    console.log('=== Gmail Auth URL Generation ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Google Client ID:', config.googleClientId ? 'Set' : 'Missing');
    console.log('Google Client Secret:', config.googleClientSecret ? 'Set' : 'Missing');
    console.log('Google Callback URL from config:', config.googleCallbackUrl);
    
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
    
    console.log('Generated Auth URL:', authUrl);
    console.log('===================================');
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Gmail auth URL:', error);
    res.status(500).json({ 
      message: 'Failed to generate Gmail auth URL', 
      error: error.message 
    });
  }
};

// @desc    Disconnect Gmail
// @route   POST /api/emails/disconnect
// @access  Private
const disconnectGmail = async (req, res) => {
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
        console.error('Error revoking Gmail token:', revokeError);
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
      message: 'Gmail account disconnected successfully',
      success: true
    });
  } catch (error) {
    console.error('Gmail disconnection error:', error);
    res.status(500).json({ 
      message: 'Failed to disconnect Gmail account', 
      error: error.message 
    });
  }
};

module.exports = {
  syncEmails,
  getEmails,
  getEmailById,
  extractTasksFromEmail,
  detectFollowUp,
  getEmailLabels,
  getEmailAnalytics,
  connectGmail,
  checkGmailConnection,
  getGmailAuthUrl,
  disconnectGmail
};
