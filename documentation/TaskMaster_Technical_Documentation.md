# TaskMaster AI - Technical Documentation

## Overview

TaskMaster is an AI-powered task management system designed specifically for small businesses. It integrates with Gmail to automatically extract tasks from emails, enabling users to efficiently manage their workload without manually creating tasks from email communications.

## Architecture

The application follows a client-server architecture:

- **Frontend**: React.js with Material-UI components
- **Backend**: Node.js with Express framework
- **Database**: MongoDB
- **AI Integration**: OpenAI API for task extraction
- **Email Integration**: Gmail API

## Key Components

### 1. Email Integration

The application connects to Gmail API using OAuth 2.0 for secure access to a user's email account. Key features include:

- Secure authentication via Google OAuth
- Email synchronization with pagination
- Full email content retrieval
- Metadata extraction (sender, recipients, subject, etc.)

### 2. AI-Powered Task Extraction

The core feature is the AI-powered task extraction from emails, which:

- Analyzes email content using OpenAI's GPT models
- Identifies actionable items within email texts
- Extracts key task information: title, description, priority, due dates, and categories
- Formats extracted information into structured task objects

### 3. Task Management

Once tasks are extracted, they can be:

- Viewed in a centralized dashboard
- Organized by priority, due date, and category
- Updated with progress information
- Marked as complete
- Filtered and sorted based on various criteria

## Implementation Details

### Email Task Extraction Process

The task extraction follows these steps:

1. **Email Fetching**: Retrieve email content from Gmail API
2. **Content Preprocessing**: Clean and format email content for analysis
3. **AI Analysis**: Send formatted content to OpenAI API with a specialized prompt
4. **Response Parsing**: Parse the JSON response and extract task information
5. **Data Validation**: Validate and normalize task data
6. **Task Creation**: Create task objects and save them to the database

### AI Prompt Engineering

The system uses carefully crafted prompts to guide the AI in extracting relevant task information:

```
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
```

## API Endpoints

### Email Endpoints

- `GET /api/emails` - Get user emails with pagination and filtering
- `POST /api/emails/sync` - Sync emails from Gmail
- `GET /api/emails/:id` - Get a specific email with full content
- `POST /api/emails/:id/extract` - Extract tasks from an email
- `POST /api/emails/:id/detect-followup` - Detect follow-up needs

### Task Endpoints

- `GET /api/tasks` - Get all tasks with filtering options
- `POST /api/tasks` - Create a new task manually
- `GET /api/tasks/:id` - Get a specific task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `POST /api/tasks/save-extracted` - Save tasks extracted from emails

## Error Handling

The application implements comprehensive error handling:

1. **API Error Handling**: Proper status codes and error messages for all API endpoints
2. **AI Integration Errors**: Fallback mechanisms for AI extraction failures
3. **Email Integration Errors**: Token refresh and reconnection logic
4. **Task Validation Errors**: Data validation to ensure task integrity

## Security Considerations

Security measures implemented in the application:

1. **Authentication**: JWT-based authentication for API access
2. **OAuth Integration**: Secure token management for Gmail API
3. **Data Isolation**: User-specific data access control
4. **API Key Management**: Secure handling of OpenAI API keys

## Performance Optimizations

To ensure good performance:

1. **Pagination**: Email and task lists are paginated
2. **Caching**: Email content caching for repeated access
3. **Asynchronous Processing**: Non-blocking task extraction
4. **Selective Syncing**: Configurable email sync limits

## Future Enhancements

Potential future enhancements include:

1. **Advanced Task Classification**: Machine learning for improved categorization
2. **Multi-platform Integration**: Additional email provider support
3. **Smart Scheduling**: AI-assisted due date assignment
4. **Task Prioritization**: Intelligent priority assignment based on context
5. **Team Collaboration**: Multi-user support with task assignment

## Troubleshooting Guide

Common issues and solutions:

### Email Integration Issues

- **OAuth Errors**: Check token validity and refresh token
- **Sync Failures**: Verify API quotas and connection status
- **Content Retrieval**: Check message ID validity and access permissions

### Task Extraction Issues

- **AI Response Errors**: Validate OpenAI API key and model availability
- **Parsing Failures**: Check response format and implement fallback mechanisms
- **Empty Results**: Verify email content and improve prompt engineering

## Development Environment Setup

Instructions for setting up the development environment:

1. Clone the repository
2. Install Node.js and MongoDB
3. Set up environment variables:
   - MongoDB connection string
   - JWT secret
   - OpenAI API key
   - Google OAuth credentials
4. Install dependencies
5. Start the development servers

## Conclusion

TaskMaster AI demonstrates the practical application of artificial intelligence in business productivity tools. By automating the extraction of tasks from emails, it significantly reduces the manual effort required to manage and track action items from communications.

---

*Last Updated: May 2, 2025*