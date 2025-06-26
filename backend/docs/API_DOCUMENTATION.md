# FizzTask API Documentation

## Overview
FizzTask provides a comprehensive REST API for managing tasks, focus sessions, emails, and productivity analytics. This documentation covers all available endpoints and their usage.

## API Documentation Access
The interactive API documentation is available at: `http://localhost:5000/api-docs`

When the backend server is running, you can access the Swagger UI interface to:
- View all available endpoints
- Test API calls directly from the browser
- See request/response schemas
- Download OpenAPI specification

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Base URL
- Development: `http://localhost:5000`
- Production: `https://api.fizztask.com`

## Main API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile (Protected)
- `PUT /api/auth/profile` - Update user profile (Protected)
- `POST /api/auth/logout` - Logout user (Protected)

### Tasks (`/api/tasks`)
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/complete` - Mark task as complete
- `POST /api/tasks/bulk` - Create multiple tasks
- `POST /api/tasks/reorder` - Reorder tasks

### Focus Sessions (`/api/focus`)
- `POST /api/focus/sessions/start` - Start focus session
- `PUT /api/focus/sessions/:id/end` - End focus session
- `GET /api/focus/sessions` - Get all sessions
- `GET /api/focus/sessions/:id` - Get session by ID
- `GET /api/focus/analytics` - Get focus analytics
- `GET /api/focus/recommendations` - Get AI recommendations

### Emails (`/api/emails`)
- `GET /api/emails` - Get all emails
- `GET /api/emails/:id` - Get email by ID
- `POST /api/emails/:id/extract` - Extract tasks from email
- `POST /api/emails/:id/detect-followup` - Detect follow-up needs
- `POST /api/emails/sync` - Sync emails from Gmail
- `GET /api/emails/labels` - Get email labels

### Settings (`/api/settings`)
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings
- `PUT /api/settings/preferences` - Update preferences
- `PUT /api/settings/focus` - Update focus settings
- `PUT /api/settings/notifications` - Update notification settings

### Follow-ups (`/api/followups`)
- `GET /api/followups` - Get all follow-ups
- `POST /api/followups` - Create follow-up
- `PUT /api/followups/:id` - Update follow-up
- `DELETE /api/followups/:id` - Delete follow-up

### Notifications (`/api/notifications`)
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

## Response Format
All API responses follow a consistent format:

### Success Response
```json
{
  "data": {
    // Response data
  },
  "message": "Success message"
}
```

### Error Response
```json
{
  "message": "Error description",
  "errors": [
    // Validation errors if applicable
  ]
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting
API endpoints are rate limited to prevent abuse:
- Authentication endpoints: 5 requests per 15 minutes
- General API: 100 requests per 15 minutes
- File uploads: 10 requests per hour

## Testing
Use the Swagger UI at `/api-docs` to test endpoints directly in your browser. You can:
1. Click "Authorize" and enter your JWT token
2. Select an endpoint to test
3. Fill in required parameters
4. Click "Execute" to make the request
5. View the response

## Additional Documentation
- Task extraction uses OpenAI GPT-3.5 for intelligent parsing
- Focus sessions include AI-powered recommendations
- Email integration supports Gmail API
- Real-time notifications via WebSocket (coming soon)