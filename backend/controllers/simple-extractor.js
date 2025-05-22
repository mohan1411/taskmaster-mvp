/**
 * Simple Task Extractor
 * 
 * This is a drop-in replacement for the extractTasksFromEmail function in the emailController.
 * It uses direct axios calls to the OpenAI API instead of the OpenAI library.
 */

const axios = require('axios');
const config = require('../config/config');

/**
 * Drop-in replacement for the extractTasksFromEmail function
 */
const extractTasksFromEmail = async (req, res) => {
  try {
    console.log('Simple extractor: Starting task extraction');
    
    // Find the email
    const Email = require('../models/emailModel');
    const Settings = require('../models/settingsModel');
    const { google } = require('googleapis');
    
    const email = await Email.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Log the email details
    console.log('Processing email:', {
      id: email._id,
      sender: email.sender,
      subject: email.subject
    });
    
    // Get user settings for Gmail
    const settings = await Settings.findOne({ user: req.user._id });
    
    if (!settings || !settings.integrations.google.connected) {
      return res.status(400).json({ message: 'Google integration not connected' });
    }
    
    const tokenInfo = settings.integrations.google.tokenInfo;
    
    // Create OAuth2 client for Gmail
    const oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.googleCallbackUrl
    );
    
    oauth2Client.setCredentials({
      access_token: tokenInfo.accessToken,
      refresh_token: tokenInfo.refreshToken,
    });
    
    // Create Gmail API client
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Get the email content
    console.log('Fetching email content from Gmail API');
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
    
    // If HTML, strip tags for task extraction
    if (messageBody.includes('<html') || messageBody.includes('<body')) {
      // Simple HTML to text conversion
      messageBody = messageBody
        .replace(/<[^>]*>/g, ' ') // Replace tags with spaces
        .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with spaces
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim();
    }
    
    console.log('Email body extracted, length:', messageBody.length);
    
    // Format email context for the prompt
    const emailContext = `
    From: ${email.sender.name} <${email.sender.email}>
    Subject: ${email.subject}
    Date: ${email.receivedAt}
    
    ${messageBody}
    `;
    
    // Check OpenAI API key
    const apiKey = config.openaiApiKey;
    console.log('OpenAI API key:', apiKey ? `${apiKey.substring(0, 5)}...` : 'Missing');
    
    if (!apiKey) {
      return res.status(500).json({ 
        message: 'OpenAI API key is not configured. Task extraction is unavailable.'
      });
    }
    
    // Create prompt for task extraction
    const prompt = `
    Extract actionable tasks from the following email. For each task, provide:
    1. Task title (clear and concise)
    2. Priority (high, medium, or low)
    3. Due date (if mentioned or can be inferred)
    4. Category (infer from context)

    Format the response as a valid JSON array with objects containing:
    [
      {
        "title": "Task title",
        "description": "Additional context if available",
        "priority": "high/medium/low",
        "dueDate": "YYYY-MM-DD" or null if not specified,
        "category": "inferred category"
      }
    ]

    IMPORTANT: Your response must be a valid JSON array. Do not include any text before or after the JSON array.
    If no tasks are found, return an empty array: []

    Email: """
    ${emailContext}
    """
    `;
    
    console.log('Making API request to OpenAI');
    
    let extractedTasks = [];
    
    try {
      // Make direct API call to OpenAI
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-3.5-turbo", // Using a standard model for compatibility
          messages: [
            { role: "system", content: "You are a helpful assistant that extracts actionable tasks from emails." },
            { role: "user", content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.2,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
      
      console.log('OpenAI API response received, status:', response.status);
      
      // Get the response text
      const responseText = response.data.choices[0].message.content.trim();
      console.log('Response text length:', responseText.length);
      console.log('Response preview:', responseText.substring(0, 100) + '...');
      
      // Try to parse the response
      try {
        if (responseText.startsWith('[') && responseText.endsWith(']')) {
          extractedTasks = JSON.parse(responseText);
          console.log('Successfully parsed JSON response');
        } else {
          // Try to find JSON in the response
          const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
          if (jsonMatch) {
            extractedTasks = JSON.parse(jsonMatch[0]);
            console.log('Successfully extracted and parsed JSON from response');
          } else {
            console.log('Could not find valid JSON array in response');
            extractedTasks = [
              {
                "title": "Review email content",
                "description": "The system couldn't automatically extract structured tasks from this email. Please review it manually.",
                "priority": "medium",
                "dueDate": null,
                "category": "Email Follow-up"
              }
            ];
          }
        }
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        console.log('Raw response:', responseText);
        
        // Provide a fallback task
        extractedTasks = [
          {
            "title": "Review email content",
            "description": "Failed to extract tasks automatically. Please review this email manually.",
            "priority": "medium",
            "dueDate": null,
            "category": "Manual Processing"
          }
        ];
      }
    } catch (apiError) {
      console.error('OpenAI API error:', apiError.message);
      
      if (apiError.response) {
        console.error('Status:', apiError.response.status);
        console.error('Data:', apiError.response.data);
      }
      
      return res.status(500).json({ 
        message: 'Error communicating with OpenAI API', 
        error: apiError.message,
        details: apiError.response ? apiError.response.data : null
      });
    }
    
    // Mark email as processed
    email.taskExtracted = true;
    await email.save();
    
    // Return the extracted tasks
    console.log(`Successfully extracted ${extractedTasks.length} tasks`);
    res.json({
      extractedTasks,
      emailId: email.messageId
    });
  } catch (error) {
    console.error('General error in task extraction:', error);
    res.status(500).json({ 
      message: 'Server error during task extraction', 
      error: error.message 
    });
  }
};

module.exports = { extractTasksFromEmail };
