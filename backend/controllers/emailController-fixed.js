const { extractTasksFromEmail: originalFunction } = require('./emailController');

// Here's how to modify the emailController.js file:
// 1. Add the helper import at the top:
//    const { extractTasksFromEmail: extractTasksHelper } = require('./emailTaskExtractor');

// 2. Replace the extractTasksFromEmail function with this implementation:

// @desc    Extract tasks from email
// @route   POST /api/emails/:id/extract
// @access  Private
const extractTasksFromEmail = async (req, res) => {
  try {
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

    // Prepare email object for the helper function
    const emailForExtraction = {
      _id: email._id,
      sender: email.sender,
      subject: email.subject,
      receivedAt: email.receivedAt,
      body: messageBody
    };

    // Use our robust helper to extract tasks
    const result = await extractTasksHelper(emailForExtraction);
    
    if (!result.success) {
      return res.status(500).json({ 
        message: 'Failed to extract tasks', 
        error: result.error 
      });
    }
    
    // Mark email as processed for task extraction
    email.taskExtracted = true;
    await email.save();
    
    // Return the extracted tasks
    res.json({
      extractedTasks: result.extractedTasks,
      emailId: email.messageId
    });
  } catch (error) {
    console.error('Task extraction error:', error);
    res.status(500).json({ 
      message: 'Server error during task extraction', 
      error: error.message 
    });
  }
};
