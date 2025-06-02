// Fix for extractTasksFromEmail function in emailController.js
// This function should replace the existing extractTasksFromEmail function

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
    } else if (messageData.data.payload.body && messageData.data.payload.body.data) {
      // Single part message
      const bodyData = messageData.data.payload.body.data;
      messageBody = Buffer.from(bodyData, 'base64').toString('utf8');
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
        // *** THIS IS THE FIX: Actually save tasks to database ***
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
        console.log('Task extraction failed or no tasks found:', result.error);
        return res.status(500).json({ 
          message: 'Failed to extract tasks or no tasks found', 
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

module.exports = { extractTasksFromEmail };
