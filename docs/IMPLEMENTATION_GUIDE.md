# TaskMaster AI - Implementation Guide

This guide provides step-by-step instructions for implementing and running the TaskMaster AI MVP.

## Project Structure

The project is divided into two main parts:

- **Backend**: Node.js server with Express, MongoDB integration, and API endpoints
- **Frontend**: React.js application with Material-UI components

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js (v16 or higher) and npm
- MongoDB (local installation or MongoDB Atlas account)
- Git (for version control)
- Google Cloud Platform account (for Gmail API)
- OpenAI API account and key

### Development Environment Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd TaskMaster
```

2. **Backend Setup**

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit the `.env` file with your configuration:
- MongoDB connection string
- JWT secrets
- Google OAuth credentials
- OpenAI API key

3. **Frontend Setup**

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file (if needed)
cp .env.example .env
```

## Running the Application

### Development Mode

1. **Start the Backend Server**

```bash
cd backend
npm run dev
```

This will start the backend server with nodemon for automatic reloading.

2. **Start the Frontend Development Server**

```bash
cd frontend
npm start
```

This will start the React development server, typically on port 3000.

## Implementation Checklist

Follow this checklist to implement the MVP features:

### Week 1: Setup & Foundation

- [x] Project setup and repository structure
- [ ] Create MongoDB database
- [ ] Set up Google Cloud Project and enable Gmail API
- [ ] Get OpenAI API key
- [ ] Implement authentication
- [ ] Connect to Gmail API

### Week 2: Core Functionality

- [ ] Implement task extraction from emails using OpenAI
- [ ] Create task management interface
- [ ] Design email display and interaction
- [ ] Setup task storage and retrieval system

### Week 3: Enhanced Features

- [ ] Implement follow-up detection
- [ ] Build dashboard with analytics
- [ ] Create settings management
- [ ] Set up email notification system

### Week 4: Refinement & Launch

- [ ] Test all features
- [ ] Fix bugs
- [ ] Optimize performance
- [ ] Prepare deployment
- [ ] Launch MVP

## Key Features Implementation

### 1. Email Task Extraction

The email task extraction uses the OpenAI API to analyze emails and identify actionable tasks. The key files involved are:

- `backend/controllers/emailController.js`: Handles email retrieval and analysis
- `backend/controllers/taskController.js`: Manages task creation from extracted content
- `frontend/src/pages/EmailsPage.js`: UI for displaying emails and extracted tasks

The extraction process works as follows:
1. Get email content from Gmail API
2. Send content to OpenAI API with prompt that asks for task identification
3. Parse response and convert to task format
4. Allow user to review and confirm extracted tasks
5. Save confirmed tasks to database

### 2. Follow-up Tracking

Follow-up tracking helps identify emails that need responses and when to send reminders. Key files:

- `backend/controllers/followupController.js`: Manages follow-up detection and reminders
- `backend/models/followupModel.js`: Data structure for follow-ups
- `frontend/src/pages/FollowUpsPage.js`: UI for managing follow-ups

Implementation steps:
1. Analyze incoming/outgoing emails to detect follow-up needs
2. Create follow-up entries with due dates
3. Provide interface for managing follow-ups
4. Send reminders when follow-ups are due

### 3. Task Management

The task management system provides a centralized view of all tasks with sorting, filtering, and prioritization:

- `backend/controllers/taskController.js`: Handles task CRUD operations
- `backend/models/taskModel.js`: Defines task data structure
- `frontend/src/pages/TasksPage.js`: UI for task management

Implementation steps:
1. Create task model with appropriate fields
2. Implement API endpoints for task operations
3. Build UI with filtering and sorting options
4. Add due date tracking and priority management

## Google API Integration

To integrate with Gmail API:

1. Create project in Google Cloud Console
2. Enable Gmail API
3. Set up OAuth consent screen
4. Create OAuth credentials (client ID and secret)
5. Implement OAuth flow in the backend:
   - Get authorization code from frontend
   - Exchange for tokens
   - Store tokens securely
   - Use tokens to access Gmail API

## OpenAI Integration

To integrate with OpenAI API:

1. Get API key from OpenAI
2. Configure the API key in the environment variables
3. Create appropriate prompts for:
   - Task extraction
   - Follow-up detection
   - Priority suggestions
4. Optimize token usage to control costs

## Database Schema

The main collections in MongoDB:

- `users`: User profiles and authentication
- `tasks`: Task data and metadata
- `emails`: Email metadata (not content)
- `followups`: Follow-up tracking
- `settings`: User preferences

## Deployment

For MVP deployment:

1. Backend:
   - Deploy to Render.com, Railway.app, or similar service
   - Set up environment variables
   - Connect to production MongoDB instance

2. Frontend:
   - Build production version: `npm run build`
   - Deploy to Vercel, Netlify, or similar service
   - Configure to use production backend API

## Monitoring and Maintenance

- Set up basic error tracking with console logs
- Monitor API usage (Google, OpenAI)
- Track user feedback for improvements
- Plan for post-MVP enhancements based on usage patterns

## Conclusion

This implementation guide provides a roadmap for building the TaskMaster AI MVP. By following the weekly plan and focusing on core features first, you can develop a functional product that delivers value to small business users while maintaining a reasonable development timeline.

Remember to test features thoroughly, especially the AI components, as they may require fine-tuning of prompts and response handling to achieve optimal results.
