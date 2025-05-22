/**
 * Fix for Duplicate Task Extraction
 * 
 * This modification prevents duplicate tasks from being created when
 * extracting tasks from the same email multiple times.
 * 
 * The fix involves:
 * 1. Adding a check to see if tasks have already been extracted from an email
 * 2. Updating the email record to track task extraction status
 * 3. Filtering out duplicate tasks before saving
 */

// emailController.js - Updated extractTasksFromEmail function
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
      snippet: email.snippet,
      messageId: email.messageId
    };
    
    // Call your extraction function
    try {
      console.log('Calling task extraction function...');
      
      // Use the AI-powered extraction function
      const result = await extractTasksHelper(emailForExtraction);
      
      console.log('Extraction result from AI:', result);
      
      if (result.success) {
        // Mark email as processed
        email.taskExtracted = true;
        await email.save();
        
        // Return the extracted tasks
        console.log('Sending successful response with tasks:', result.extractedTasks);
        return res.json({
          extractedTasks: result.extractedTasks,
          emailId: email.messageId
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

// taskController.js - Updated saveExtractedTasks function
const saveExtractedTasks = async (req, res) => {
  try {
    const { tasks, emailId } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ message: 'No tasks provided to save' });
    }

    // Check if this is a re-extraction (tasks already exist for this email)
    if (emailId) {
      const existingTasks = await Task.find({
        user: req.user._id,
        emailSource: emailId
      });
      
      if (existingTasks.length > 0) {
        console.log(`Found ${existingTasks.length} existing tasks for email ${emailId}`);
        
        // Check if tasks are being re-extracted and return existing tasks
        if (req.query.checkOnly === 'true') {
          return res.json({
            message: `${existingTasks.length} tasks already exist for this email`,
            tasks: existingTasks,
            alreadyExtracted: true
          });
        }
        
        // If explicit override is not requested, return existing tasks
        if (req.query.override !== 'true') {
          return res.json({
            message: `${existingTasks.length} tasks already exist for this email`,
            tasks: existingTasks,
            alreadyExtracted: true
          });
        }
        
        // If override requested, delete existing tasks
        console.log(`Deleting ${existingTasks.length} existing tasks for re-extraction`);
        await Task.deleteMany({
          user: req.user._id,
          emailSource: emailId
        });
      }
    }

    const savedTasks = [];

    // Save each approved task
    for (const taskData of tasks) {
      // Parse date string to Date object if present
      let dueDate = null;
      if (taskData.dueDate) {
        dueDate = new Date(taskData.dueDate);
      }

      const task = await Task.create({
        user: req.user._id,
        title: taskData.title,
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        dueDate: dueDate,
        category: taskData.category || 'uncategorized',
        status: 'pending',
        emailSource: emailId || null,
        aiGenerated: true
      });

      savedTasks.push(task);
    }

    // If tasks were extracted from an email, mark the email as processed
    if (emailId) {
      await Email.findOneAndUpdate(
        { messageId: emailId, user: req.user._id },
        { taskExtracted: true }
      );
    }

    res.status(201).json({
      message: `${savedTasks.length} tasks saved successfully`,
      tasks: savedTasks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
