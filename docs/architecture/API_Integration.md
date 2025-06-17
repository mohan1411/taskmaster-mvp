# TaskMaster AI MVP - API Integration Guide

This guide provides detailed instructions for integrating external APIs into the TaskMaster AI MVP, focusing on the Gmail API and OpenAI API integrations that are essential for the core functionality.

## Gmail API Integration

The Gmail API integration enables TaskMaster to access user emails for task extraction and follow-up detection.

### Setup and Authentication

#### 1. Create Gmail API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing project
3. Navigate to "APIs & Services" > "Library"
4. Search for "Gmail API" and enable it
5. Go to "APIs & Services" > "Credentials"
6. Create OAuth 2.0 Client ID
   - Set Application type to "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback` (development)
     - Your production callback URL (when deployed)
7. Download the credentials JSON file

#### 2. Configure OAuth 2.0 Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select user type (External for development)
3. Fill in required application information
4. Add scopes:
   - `.../auth/gmail.readonly` (minimum requirement)
   - `.../auth/gmail.send` (if sending emails)
   - `.../auth/gmail.labels` (for managing labels)
5. Add test users (for development and testing)

### Backend Implementation

#### 1. Install Required Packages

```bash
npm install googleapis passport passport-google-oauth20 jsonwebtoken
```

#### 2. Create OAuth Configuration

Create `server/config/passport.js`:

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.labels'
      ],
      accessType: 'offline',
      prompt: 'consent'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ googleId: profile.id });

        // If not, create new user
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            picture: profile.photos[0].value,
            accessToken,
            refreshToken,
            tokenExpiry: new Date(Date.now() + 3600 * 1000) // 1 hour from now
          });
        } else {
          // Update tokens
          user.accessToken = accessToken;
          
          // Only update refresh token if we received a new one
          if (refreshToken) {
            user.refreshToken = refreshToken;
          }
          
          user.tokenExpiry = new Date(Date.now() + 3600 * 1000);
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
```

#### 3. Create Gmail Service

Create `server/services/gmailService.js`:

```javascript
const { google } = require('googleapis');
const User = require('../models/User');

// Create a Gmail client
const createGmailClient = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if token is expired
    const isTokenExpired = new Date() > new Date(user.tokenExpiry);

    // If token is expired, refresh it
    if (isTokenExpired) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        '/api/auth/google/callback'
      );

      oauth2Client.setCredentials({
        refresh_token: user.refreshToken
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update user with new tokens
      user.accessToken = credentials.access_token;
      user.tokenExpiry = new Date(Date.now() + credentials.expires_in * 1000);
      await user.save();
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      '/api/auth/google/callback'
    );

    // Set credentials
    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken
    });

    // Create Gmail client
    const gmail = google.gmail({
      version: 'v1',
      auth: oauth2Client
    });

    return gmail;
  } catch (error) {
    console.error('Error creating Gmail client:', error);
    throw error;
  }
};

// Get list of recent emails
const getRecentEmails = async (userId, maxResults = 20) => {
  try {
    const gmail = await createGmailClient(userId);
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: 'is:inbox'
    });

    const messages = response.data.messages || [];
    
    // For each message ID, get the full message
    const emailPromises = messages.map(async (message) => {
      const emailData = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Subject', 'Date']
      });
      
      return formatEmailData(emailData.data);
    });

    return Promise.all(emailPromises);
  } catch (error) {
    console.error('Error fetching recent emails:', error);
    throw error;
  }
};

// Get specific email by ID
const getEmailById = async (userId, emailId) => {
  try {
    const gmail = await createGmailClient(userId);
    
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: emailId,
      format: 'full'
    });

    return formatEmailData(response.data, true);
  } catch (error) {
    console.error(`Error fetching email ${emailId}:`, error);
    throw error;
  }
};

// Helper to format email data
const formatEmailData = (message, includeBody = false) => {
  // Extract headers
  const headers = message.payload.headers;
  const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
  const from = headers.find(h => h.name === 'From')?.value || '';
  const to = headers.find(h => h.name === 'To')?.value || '';
  const date = headers.find(h => h.name === 'Date')?.value || '';

  // Parse sender information
  const senderMatch = from.match(/([^<]*)<([^>]*)>/) || [null, from, ''];
  const senderName = senderMatch[1]?.trim() || '';
  const senderEmail = senderMatch[2]?.trim() || from;

  // Create base email object
  const emailData = {
    id: message.id,
    threadId: message.threadId,
    sender: {
      name: senderName,
      email: senderEmail
    },
    subject,
    snippet: message.snippet,
    receivedAt: new Date(date),
    hasAttachments: message.payload.parts ? 
      message.payload.parts.some(part => part.filename && part.filename.length > 0) : 
      false,
    labels: message.labelIds || []
  };

  // Add body if requested
  if (includeBody) {
    emailData.body = extractEmailBody(message.payload);
  }

  return emailData;
};

// Helper to extract email body
const extractEmailBody = (payload) => {
  if (!payload) return '';

  // Check if this part has a body
  if (payload.body && payload.body.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf8');
  }

  // Check if this part has nested parts
  if (payload.parts && payload.parts.length) {
    // Look for text/plain or text/html parts
    const textPart = payload.parts.find(part => part.mimeType === 'text/plain');
    const htmlPart = payload.parts.find(part => part.mimeType === 'text/html');
    
    // Prefer text/plain for easier processing
    const selectedPart = textPart || htmlPart;
    
    if (selectedPart && selectedPart.body && selectedPart.body.data) {
      return Buffer.from(selectedPart.body.data, 'base64').toString('utf8');
    }
    
    // If no direct text parts, recursively check nested parts
    for (const part of payload.parts) {
      const nestedBody = extractEmailBody(part);
      if (nestedBody) return nestedBody;
    }
  }

  return '';
};

module.exports = {
  createGmailClient,
  getRecentEmails,
  getEmailById
};
```

#### 4. Create Auth Routes

Create `server/routes/auth.js`:

```javascript
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');

// Google OAuth login route
router.get('/google', passport.authenticate('google', {
  scope: [
    'profile', 
    'email',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.labels'
  ],
  accessType: 'offline',
  prompt: 'consent'
}));

// Google OAuth callback route
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    // Create JWT token
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
  }
);

// Get current user info
router.get('/me', 
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-accessToken -refreshToken');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Logout route
router.post('/logout', (req, res) => {
  req.logout();
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
```

#### 5. Create Email Routes

Create `server/routes/emails.js`:

```javascript
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getRecentEmails, getEmailById } = require('../services/gmailService');
const { extractTasksFromEmail } = require('../services/openaiService');

// Get recent emails
router.get('/', auth, async (req, res) => {
  try {
    const maxResults = req.query.max ? parseInt(req.query.max) : 20;
    const emails = await getRecentEmails(req.user.id, maxResults);
    res.json(emails);
  } catch (error) {
    console.error('Error in GET /emails:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific email by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const email = await getEmailById(req.user.id, req.params.id);
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    res.json(email);
  } catch (error) {
    console.error(`Error in GET /emails/${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Extract tasks from email
router.post('/:id/extract-tasks', auth, async (req, res) => {
  try {
    const email = await getEmailById(req.user.id, req.params.id);
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    const tasks = await extractTasksFromEmail(email);
    res.json(tasks);
  } catch (error) {
    console.error(`Error extracting tasks from email ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```

## OpenAI API Integration

The OpenAI API is used for extracting tasks from email content and detecting potential follow-ups.

### Setup and Configuration

#### 1. Create OpenAI API Key

1. Create an account at [OpenAI](https://platform.openai.com/)
2. Navigate to the API section
3. Generate an API key
4. Save your API key securely

#### 2. Install Required Packages

```bash
npm install openai
```

#### 3. Create OpenAI Service

Create `server/services/openaiService.js`:

```javascript
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Extract tasks from email
const extractTasksFromEmail = async (email) => {
  try {
    const prompt = createTaskExtractionPrompt(email);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a task extraction assistant that identifies actionable tasks, commitments, and follow-ups from emails. Extract specific, concrete tasks with any deadlines or important details. For each task, determine a priority level (high, medium, low) based on urgency, sender importance, and explicit deadlines. Format your response as a JSON array of task objects.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    // Parse the JSON response
    const result = JSON.parse(response.choices[0].message.content);
    
    // If no tasks were found, return empty array
    if (!result.tasks || result.tasks.length === 0) {
      return [];
    }
    
    // Process and return the extracted tasks
    return result.tasks.map(task => ({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      priority: task.priority || 'medium',
      isFollowup: task.isFollowup || false,
      source: {
        type: 'email',
        sourceId: email.id
      }
    }));
  } catch (error) {
    console.error('Error extracting tasks from email:', error);
    throw error;
  }
};

// Helper to create a prompt for task extraction
const createTaskExtractionPrompt = (email) => {
  return `
Extract actionable tasks, commitments, and required follow-ups from this email:

FROM: ${email.sender.name} <${email.sender.email}>
SUBJECT: ${email.subject}
DATE: ${email.receivedAt}

${email.body}

Identify specific tasks, especially those with deadlines or time constraints. For each task, determine a priority (high, medium, low) based on urgency, importance, and deadlines.

Return your response as a JSON object with this format:
{
  "tasks": [
    {
      "title": "Brief task description",
      "description": "Detailed task description with context",
      "dueDate": "YYYY-MM-DD" or null if no deadline,
      "priority": "high/medium/low",
      "isFollowup": true/false (is this a follow-up task)
    }
  ]
}

If no tasks are found, return an empty tasks array.
`;
};

// Analyze follow-up needs
const analyzeFollowupNeeds = async (email, previousEmails = []) => {
  try {
    const prompt = createFollowupAnalysisPrompt(email, previousEmails);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a follow-up analysis assistant that determines if an email thread requires a follow-up response. You identify unanswered questions, pending commitments, and expected responses. You also suggest optimal timing for follow-ups.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    // Parse the JSON response
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error analyzing follow-up needs:', error);
    throw error;
  }
};

// Helper to create a prompt for follow-up analysis
const createFollowupAnalysisPrompt = (email, previousEmails) => {
  let threadContext = '';
  
  // Add context from previous emails if available
  if (previousEmails && previousEmails.length > 0) {
    threadContext = `Previous emails in this thread:\n\n${
      previousEmails.map(prevEmail => 
        `FROM: ${prevEmail.sender.name}\nDATE: ${prevEmail.receivedAt}\n${prevEmail.body}\n\n`
      ).join('---\n\n')
    }`;
  }

  return `
Analyze this email to determine if it requires a follow-up response:

FROM: ${email.sender.name} <${email.sender.email}>
SUBJECT: ${email.subject}
DATE: ${email.receivedAt}

${email.body}

${threadContext}

Determine:
1. Does this email require a follow-up response from the recipient?
2. Are there unanswered questions or requests?
3. Are there commitments that need to be fulfilled?
4. What is the appropriate timing for a follow-up (in days)?

Return your analysis as a JSON object:
{
  "requiresFollowup": true/false,
  "followupReason": "Reason follow-up is needed",
  "unansweredQuestions": ["Question 1", "Question 2"],
  "pendingCommitments": ["Commitment 1", "Commitment 2"],
  "suggestedFollowupDate": "YYYY-MM-DD",
  "suggestedWaitDays": number of days to wait before following up
}

If no follow-up is needed, explain why in the followupReason field.
`;
};

module.exports = {
  extractTasksFromEmail,
  analyzeFollowupNeeds
};
```

## Integrating Both APIs in the Task Creation Flow

### Task Extraction Controller

Create `server/controllers/taskController.js`:

```javascript
const Task = require('../models/Task');
const Email = require('../models/Email');
const { getEmailById } = require('../services/gmailService');
const { extractTasksFromEmail } = require('../services/openaiService');

// Extract and create tasks from email
const extractTasksFromEmailById = async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user.id;

    // Get the email
    const emailData = await getEmailById(userId, emailId);
    
    if (!emailData) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Store email reference in database if not already stored
    let emailRecord = await Email.findOne({ emailId, user: userId });
    
    if (!emailRecord) {
      emailRecord = await Email.create({
        user: userId,
        emailId: emailData.id,
        threadId: emailData.threadId,
        sender: emailData.sender,
        subject: emailData.subject,
        snippet: emailData.snippet,
        receivedAt: emailData.receivedAt,
        labels: emailData.labels,
        hasAttachments: emailData.hasAttachments
      });
    }

    // Extract tasks using OpenAI
    const extractedTasks = await extractTasksFromEmail(emailData);
    
    // Create tasks in the database
    const tasksToCreate = extractedTasks.map(taskData => ({
      ...taskData,
      user: userId,
      status: 'pending',
      source: {
        type: 'email',
        sourceId: emailId
      }
    }));

    // If there are tasks to create
    if (tasksToCreate.length > 0) {
      const createdTasks = await Task.insertMany(tasksToCreate);
      
      // Update email record with created tasks
      emailRecord.extractedTasks = [
        ...emailRecord.extractedTasks || [], 
        ...createdTasks.map(task => task._id)
      ];
      await emailRecord.save();
      
      return res.status(201).json(createdTasks);
    }
    
    return res.status(200).json({ message: 'No tasks found in this email' });
  } catch (error) {
    console.error('Error extracting tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  extractTasksFromEmailById
};
```

### Task Routes

Create `server/routes/tasks.js`:

```javascript
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const { extractTasksFromEmailById } = require('../controllers/taskController');

// Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const filters = { user: req.user.id };
    
    // Apply query filters if provided
    if (req.query.status) filters.status = req.query.status;
    if (req.query.priority) filters.priority = req.query.priority;
    if (req.query.isFollowup) filters.isFollowup = req.query.isFollowup === 'true';
    
    const tasks = await Task.find(filters).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error(`Error fetching task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new task
router.post('/', auth, async (req, res) => {
  try {
    const newTask = new Task({
      ...req.body,
      user: req.user.id,
      status: req.body.status || 'pending'
    });
    
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error(`Error updating task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ 
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(`Error deleting task ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Extract tasks from email
router.post('/extract-from-email/:emailId', auth, extractTasksFromEmailById);

module.exports = router;
```

## Testing API Integrations

### Gmail API Testing

1. Create a test route for debugging OAuth:

```javascript
// Add to auth.js routes for testing
router.get('/test-gmail', auth, async (req, res) => {
  try {
    const emails = await getRecentEmails(req.user.id, 5);
    res.json(emails);
  } catch (error) {
    console.error('Gmail test error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

2. Test Gmail API connection:
   - Login through Google OAuth flow
   - Access the `/api/auth/test-gmail` endpoint
   - Verify you receive email data

### OpenAI API Testing

1. Create a test route for task extraction:

```javascript
// Add to tasks.js routes for testing
router.post('/test-extraction', auth, async (req, res) => {
  try {
    const { emailContent } = req.body;
    
    // Create mock email object
    const mockEmail = {
      id: 'test-email',
      sender: {
        name: 'Test Sender',
        email: 'test@example.com'
      },
      subject: 'Test Email',
      body: emailContent,
      receivedAt: new Date()
    };
    
    const tasks = await extractTasksFromEmail(mockEmail);
    res.json(tasks);
  } catch (error) {
    console.error('OpenAI test error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

2. Test OpenAI task extraction:
   - Send a POST request to `/api/tasks/test-extraction` with sample email content
   - Verify task extraction output

## Error Handling and Optimization

### Error Handling

1. Create specific error handlers for API-related issues:

```javascript
// Add to utils/apiErrors.js
class GmailApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'GmailApiError';
    this.statusCode = statusCode;
  }
}

class OpenAIApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'OpenAIApiError';
    this.statusCode = statusCode;
  }
}

module.exports = {
  GmailApiError,
  OpenAIApiError
};
```

2. Implement error middleware:

```javascript
// Add to middleware/errorHandler.js
const { GmailApiError, OpenAIApiError } = require('../utils/apiErrors');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Handle specific API errors
  if (err instanceof GmailApiError || err instanceof OpenAIApiError) {
    return res.status(err.statusCode).json({
      error: err.name,
      message: err.message
    });
  }
  
  // Handle other errors
  res.status(500).json({
    error: 'ServerError',
    message: 'An unexpected error occurred'
  });
};

module.exports = errorHandler;
```

### Optimization

1. Implement caching for Gmail API calls:

```javascript
// Add to services/gmailService.js
const cache = {};

const getCachedEmail = (userId, emailId) => {
  const cacheKey = `${userId}:${emailId}`;
  return cache[cacheKey];
};

const cacheEmail = (userId, emailId, emailData) => {
  const cacheKey = `${userId}:${emailId}`;
  cache[cacheKey] = emailData;
  
  // Set expiry (30 minutes)
  setTimeout(() => {
    delete cache[cacheKey];
  }, 30 * 60 * 1000);
  
  return emailData;
};
```

2. Optimize OpenAI API usage:

```javascript
// Add to services/openaiService.js
// Use a smaller model for development
const MODEL = process.env.NODE_ENV === 'production' ? 'gpt-4' : 'gpt-3.5-turbo';

// Batch task extraction for multiple emails
const batchExtractTasks = async (emails) => {
  // Implementation for batch processing
};
```

## Next Steps

After implementing these API integrations:

1. Complete the backend API with all necessary routes
2. Develop the React frontend to interact with these APIs
3. Implement real-time email monitoring with webhooks
4. Add user preferences for task extraction settings

For frontend implementation details, refer to the [Frontend Implementation Guide](./Frontend_Implementation.md).
