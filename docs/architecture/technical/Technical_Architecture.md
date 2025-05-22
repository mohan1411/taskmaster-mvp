# TaskMaster AI MVP - Technical Architecture

## Architecture Overview

TaskMaster AI MVP will follow a modern web application architecture with separate frontend and backend components, using RESTful APIs for communication. This architecture balances development simplicity with scalability for future expansion.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│  Node.js API    │────▶│  MongoDB        │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
          │                      │                      
          │                      │                      
          ▼                      ▼                      
┌─────────────────┐     ┌─────────────────┐     
│                 │     │                 │     
│  Gmail API      │     │  OpenAI API     │     
│                 │     │                 │     
└─────────────────┘     └─────────────────┘     
```

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.js
│   │   └── AuthCallback.js
│   ├── dashboard/
│   │   ├── Dashboard.js
│   │   ├── TaskCard.js
│   │   ├── TaskList.js
│   │   └── TaskStats.js
│   ├── email/
│   │   ├── EmailList.js
│   │   ├── EmailDetail.js
│   │   └── TaskExtraction.js
│   ├── followups/
│   │   ├── FollowupList.js
│   │   └── FollowupDetail.js
│   ├── layout/
│   │   ├── Navbar.js
│   │   ├── Sidebar.js
│   │   └── Footer.js
│   └── shared/
│       ├── LoadingSpinner.js
│       ├── ErrorBoundary.js
│       └── ConfirmDialog.js
├── contexts/
│   ├── AuthContext.js
│   └── TaskContext.js
├── hooks/
│   ├── useApi.js
│   └── useLocalStorage.js
├── services/
│   ├── api.js
│   ├── taskService.js
│   └── emailService.js
├── utils/
│   ├── dateFormatter.js
│   └── taskPrioritizer.js
├── App.js
├── index.js
└── routes.js
```

### State Management

For the MVP, we'll use React Context API with hooks for state management:

- **AuthContext**: Manage user authentication state
- **TaskContext**: Manage tasks and related operations
- **EmailContext**: Manage email fetching and display

This approach allows us to avoid Redux overhead while maintaining clean state management.

### Data Flow

1. Components request data via custom hooks
2. Hooks call service functions
3. Services make API calls to the backend
4. Responses update the Context state
5. Components re-render with updated data

## Backend Architecture

### API Structure

```
server/
├── config/
│   ├── database.js
│   └── passport.js
├── controllers/
│   ├── authController.js
│   ├── emailController.js
│   ├── taskController.js
│   └── followupController.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── models/
│   ├── User.js
│   ├── Task.js
│   ├── Email.js
│   └── Followup.js
├── routes/
│   ├── auth.js
│   ├── emails.js
│   ├── tasks.js
│   └── followups.js
├── services/
│   ├── gmailService.js
│   └── openaiService.js
├── utils/
│   ├── apiResponse.js
│   └── taskExtractor.js
└── server.js
```

### API Endpoints

#### Authentication

- `POST /api/auth/google`: Initiate Google OAuth flow
- `GET /api/auth/google/callback`: Handle OAuth callback
- `GET /api/auth/me`: Get current user info
- `POST /api/auth/logout`: Logout user

#### Emails

- `GET /api/emails`: Get recent emails (paginated)
- `GET /api/emails/:id`: Get specific email details
- `POST /api/emails/extract-tasks`: Extract tasks from email

#### Tasks

- `GET /api/tasks`: Get all tasks (with filters)
- `POST /api/tasks`: Create a new task
- `GET /api/tasks/:id`: Get task details
- `PUT /api/tasks/:id`: Update task
- `DELETE /api/tasks/:id`: Delete task

#### Follow-ups

- `GET /api/followups`: Get all follow-ups
- `POST /api/followups`: Create a new follow-up
- `GET /api/followups/:id`: Get follow-up details
- `PUT /api/followups/:id`: Update follow-up
- `DELETE /api/followups/:id`: Delete follow-up

### Database Schema

#### User Schema

```javascript
{
  _id: ObjectId,
  email: String,
  name: String,
  picture: String,
  googleId: String,
  refreshToken: String,
  accessToken: String,
  tokenExpiry: Date,
  preferences: {
    workingHours: {
      start: String,
      end: String
    },
    timezone: String,
    notificationPreferences: Object
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Task Schema

```javascript
{
  _id: ObjectId,
  user: { type: ObjectId, ref: 'User' },
  title: String,
  description: String,
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
  priority: { type: String, enum: ['high', 'medium', 'low'] },
  dueDate: Date,
  category: String,
  tags: [String],
  source: {
    type: { type: String, enum: ['email', 'manual', 'imported'] },
    sourceId: String, // Email ID if from email
  },
  isFollowup: Boolean,
  followupId: { type: ObjectId, ref: 'Followup' },
  createdAt: Date,
  updatedAt: Date
}
```

#### Email Reference Schema

```javascript
{
  _id: ObjectId,
  user: { type: ObjectId, ref: 'User' },
  emailId: String, // Gmail ID
  threadId: String,
  sender: {
    email: String,
    name: String
  },
  recipients: [{
    email: String,
    name: String
  }],
  subject: String,
  snippet: String,
  receivedAt: Date,
  hasAttachments: Boolean,
  labels: [String],
  extractedTasks: [{ type: ObjectId, ref: 'Task' }],
  requiresFollowup: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Followup Schema

```javascript
{
  _id: ObjectId,
  user: { type: ObjectId, ref: 'User' },
  email: { type: ObjectId, ref: 'Email' },
  contact: {
    email: String,
    name: String
  },
  subject: String,
  description: String,
  status: { type: String, enum: ['pending', 'completed', 'cancelled'] },
  dueDate: Date,
  reminderDate: Date,
  completedAt: Date,
  task: { type: ObjectId, ref: 'Task' },
  createdAt: Date,
  updatedAt: Date
}
```

## Integration Architecture

### Gmail API Integration

TaskMaster MVP will use Gmail API to:
1. Authenticate user with Gmail
2. Fetch emails from user's inbox
3. Read email content for task extraction
4. Monitor for new emails

Implementation:
- Use Google OAuth 2.0 for authentication
- Store refresh tokens securely
- Implement webhook or polling for new emails
- Cache email metadata to reduce API calls

### OpenAI API Integration

For the AI task extraction features, we'll use:
1. GPT-4 model for high-accuracy task detection
2. System prompts optimized for task identification
3. Caching and batching to optimize costs

Implementation:
- Create specialized prompt templates for task extraction
- Implement retry logic for API failures
- Cache similar requests to reduce costs
- Batch processing for multiple emails

## Deployment Architecture

### Development Environment

- Local Node.js environment
- Local MongoDB instance
- ngrok for webhook testing
- Environment variables for configuration

### Production Environment

Frontend:
- Vercel or Netlify (static hosting)
- Production build with optimized assets
- CDN for asset delivery

Backend:
- Render.com or Railway.app (Node.js hosting)
- Production MongoDB Atlas cluster
- Environment variables for sensitive configuration
- Basic monitoring and logging

## Security Considerations

### Authentication & Authorization

- OAuth 2.0 for authentication (no passwords)
- JWT for API authorization
- Secure token storage and rotation
- Role-based access control for future team features

### Data Security

- HTTPS for all connections
- Environment variables for sensitive values
- No storage of plaintext credentials
- Minimal data collection
- Email content processed but not stored long-term

## Monitoring & Logging

For the MVP, we'll implement basic monitoring:

- Winston for structured logging
- Error tracking with Sentry (free tier)
- Basic performance metrics
- Alert on critical errors

## Future Architecture Considerations

While the MVP architecture is designed for solo development, it includes provisions for future expansion:

- Microservices split for scalability
- Redis for caching and performance
- Advanced analytics with dedicated services
- Mobile app integration
- Team collaboration features
- Additional integrations (Outlook, Slack, etc.)
