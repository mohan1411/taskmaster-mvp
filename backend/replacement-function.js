/**
 * COPY AND PASTE THIS CODE INTO YOUR emailController.js FILE
 * 
 * Replace the existing extractTasksFromEmail function with this implementation.
 * 
 * First, add this import at the top of the file (if not already present):
 * const axios = require('axios');
 */

// @desc    Extract tasks from email
// @route   POST /api/emails/:id/extract
// @access  Private
const extractTasksFromEmail = async (req, res) => {
  try {
    console.log('Starting task extraction for email ID:', req.params.id);
    
    const email = await Email.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
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
    
    // If HTML, strip tags for task extraction
    if (messageBody.includes('<html') || messageBody.includes('<body')) {
      // Simple HTML to text conversion
      messageBody = messageBody
        .replace(/<[^>]*>/g, ' ') // Replace tags with spaces
        .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with spaces
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim();
    }
    
    // Context for OpenAI
    const emailContext = `
    From: ${email.sender.name} <${email.sender.email}>
    Subject: ${email.subject}
    Date: ${email.receivedAt}
    
    ${messageBody}
    `;
    
    // Verify API key
    if (!config.openaiApiKey) {
      console.error('OpenAI API key is missing');
      return res.status(500).json({ 
        message: 'OpenAI API key is not configured. Task extraction is unavailable.'
      });
    }
    
    // Log key info (for debugging)
    console.log('Using OpenAI API key:', config.openaiApiKey.substring(0, 5) + '...');
    
    // Create prompt for extraction
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
    
    console.log('Making direct API call to OpenAI...');
    
    try {
      // Make direct API call with axios
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-4o-mini",  // Using gpt-4o-mini model
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
            'Authorization': `Bearer ${config.openaiApiKey}`
          }
        }
      );
      
      console.log('OpenAI API response received');
      
      // Extract the content from the response
      const responseText = response.data.choices[0].message.content.trim();
      
      // For debugging
      console.log('Response text sample:', responseText.substring(0, 100) + '...');
      
      // Parse the response as JSON
      let extractedTasks = [];
      
      // Try to parse the response in different ways
      if (responseText.startsWith('[') && responseText.endsWith(']')) {
        // Direct JSON parsing
        extractedTasks = JSON.parse(responseText);
        console.log('Successfully parsed response as JSON');
      } else {
        // Try to find JSON array in the text
        const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          extractedTasks = JSON.parse(jsonMatch[0]);
          console.log('Successfully extracted JSON from response text');
        } else {
          // Create a fallback task
          console.log('Could not find valid JSON in response - using fallback task');
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
      
      // Mark email as processed
      email.taskExtracted = true;
      await email.save();
      
      // Send successful response
      console.log(`Successfully extracted ${extractedTasks.length} tasks`);
      return res.json({
        extractedTasks,
        emailId: email.messageId
      });
      
    } catch (apiError) {
      console.error('OpenAI API error:', apiError.message);
      
      if (apiError.response) {
        console.error('Status:', apiError.response.status);
        console.error('Data:', JSON.stringify(apiError.response.data));
      }
      
      // Return a fallback task instead of an error
      const fallbackTasks = [
        {
          "title": "Review email manually",
          "description": "Task extraction failed - please review this email manually to identify any tasks.",
          "priority": "high",
          "dueDate": null,
          "category": "Technical Issue"
        }
      ];
      
      // Mark email as processed despite the error
      email.taskExtracted = true;
      await email.save();
      
      // Return the fallback task
      return res.json({
        extractedTasks: fallbackTasks,
        emailId: email.messageId,
        fallback: true
      });
    }
  } catch (error) {
    console.error('Task extraction error:', error);
    res.status(500).json({ 
      message: 'Server error during task extraction', 
      error: error.message 
    });
  }
};
