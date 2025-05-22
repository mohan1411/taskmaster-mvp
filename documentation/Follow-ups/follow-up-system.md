# Follow-up System Documentation

## Overview

The Follow-up System in TaskMaster MVP is designed to help users track and manage emails that require responses or continued attention. It uses AI-powered detection to automatically identify emails needing follow-up and provides a comprehensive interface for managing these follow-ups.

## Table of Contents

1. [Architecture](#architecture)
2. [Automatic Follow-up Detection](#automatic-follow-up-detection)
3. [Manual Follow-up Creation](#manual-follow-up-creation)
4. [Follow-up Management](#follow-up-management)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Configuration Options](#configuration-options)
9. [AI Integration](#ai-integration)
10. [Best Practices](#best-practices)

## Architecture

The follow-up system consists of several key components:

```
Frontend (React)
    ├── FollowUpsPage Component
    ├── Follow-up Dialogs
    └── Analytics Dashboard
    
Backend (Node.js/Express)
    ├── Follow-up Controller
    ├── Follow-up Model
    ├── Email Controller (Detection)
    └── OpenAI Integration
    
Database (MongoDB)
    ├── Follow-ups Collection
    ├── Emails Collection
    └── Settings Collection
```

## Automatic Follow-up Detection

### How It Works

1. **During Email Sync**: When new emails are synced from Gmail, the system automatically analyzes each email
2. **AI Analysis**: OpenAI GPT-4 analyzes the email content to determine if it needs follow-up
3. **Automatic Creation**: If follow-up is needed, the system creates a follow-up entry automatically

### Detection Criteria

The AI looks for:
- Explicit questions requiring answers
- Requests for actions, information, or feedback
- Deadlines or timeframes mentioned
- Implied expectations of a reply
- Important relationships to maintain

### Example Detection Flow

```javascript
// During email sync (emailController.js)
if (settings.followUps && settings.followUps.autoDetect && config.openaiApiKey) {
  const followUpResult = await detectFollowUpNeeds(emailWithBody);
  
  if (followUpResult.success && followUpResult.followUpAnalysis.needsFollowUp) {
    // Create follow-up automatically
    await Followup.create({
      user: req.user._id,
      emailId: newEmail.messageId,
      subject: newEmail.subject,
      dueDate: new Date(followUpResult.followUpAnalysis.suggestedDate),
      keyPoints: followUpResult.followUpAnalysis.keyPoints,
      aiGenerated: true
    });
  }
}
```

## Manual Follow-up Creation

Users can manually create follow-ups through:

1. **Email Detail View**: Click "Create Follow-up" button
2. **Follow-ups Page**: Click "Create Follow-up" button
3. **Follow-up Dialog**: Fill in details and save

### Manual Creation Fields

- Subject (required)
- Contact Name
- Contact Email
- Priority (urgent, high, medium, low)
- Due Date
- Notes
- Key Points (list of items to address)
- Status (pending, in-progress, completed, ignored)

## Follow-up Management

### Status Workflow

```
Pending → In Progress → Completed
    └────────────────→ Ignored
```

### Available Actions

1. **Start**: Change status from pending to in-progress
2. **Complete**: Mark as completed with optional notes
3. **Ignore**: Mark as ignored if no longer relevant
4. **Edit**: Modify follow-up details
5. **Delete**: Remove follow-up permanently

### Analytics Dashboard

The system provides analytics including:
- Total follow-ups count
- Pending follow-ups
- Overdue follow-ups
- Due this week
- Completion rate
- Average completion time

## Database Schema

### Follow-up Model

```javascript
const followupSchema = new mongoose.Schema({
  user: { type: ObjectId, ref: 'User', required: true },
  emailId: String,           // Gmail message ID
  threadId: String,          // Gmail thread ID
  linkedEmail: ObjectId,     // Reference to Email model
  linkedTask: ObjectId,      // Reference to Task model
  subject: { type: String, required: true },
  contactName: String,
  contactEmail: String,
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'ignored'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low'],
    default: 'medium'
  },
  dueDate: Date,
  reason: String,            // Why follow-up is needed
  notes: String,             // User notes
  keyPoints: [String],       // Key points to address
  completionNotes: String,   // Notes when completed
  completedAt: Date,
  relatedTasks: [ObjectId],
  aiGenerated: Boolean       // True if AI created it
}, { timestamps: true });
```

## API Endpoints

### Follow-up Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/followups` | Get all follow-ups with filtering |
| GET | `/api/followups/:id` | Get specific follow-up |
| POST | `/api/followups` | Create new follow-up |
| PUT | `/api/followups/:id` | Update follow-up |
| DELETE | `/api/followups/:id` | Delete follow-up |
| GET | `/api/followups/check-due` | Check for due follow-ups |
| GET | `/api/followups/analytics` | Get follow-up analytics |

### Email Integration Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/emails/:id/detect-followup` | Detect follow-up needs for specific email |

## Frontend Components

### FollowUpsPage Component

Main page component that includes:
- Analytics cards
- Filter tabs (All Active, Pending, In Progress, Completed, Ignored)
- Advanced filters (priority, due date range)
- Follow-up list with actions
- Pagination

### Key UI Elements

```jsx
// Analytics Cards
<Grid container spacing={3}>
  <Grid item><Card>Total Follow-ups</Card></Grid>
  <Grid item><Card>Pending</Card></Grid>
  <Grid item><Card>Overdue</Card></Grid>
  <Grid item><Card>Due This Week</Card></Grid>
</Grid>

// Filter Tabs
<Tabs value={tabValue} onChange={handleTabChange}>
  <Tab label="All Active" />
  <Tab label="Pending" />
  <Tab label="In Progress" />
  <Tab label="Completed" />
  <Tab label="Ignored" />
</Tabs>

// Action Buttons
<Button onClick={() => handleStatusChange(id, 'in-progress')}>Start</Button>
<Button onClick={() => handleOpenCompletionDialog(id)}>Complete</Button>
<Button onClick={() => handleStatusChange(id, 'ignored')}>Ignore</Button>
```

## Configuration Options

### User Settings

```javascript
followUps: {
  defaultReminderDays: Number,  // Default: 3
  autoDetect: Boolean          // Default: true
}
```

### System Configuration

```javascript
// Environment variables
OPENAI_API_KEY=your_api_key  // Required for AI detection
```

## AI Integration

### OpenAI Prompt Structure

```javascript
const prompt = `
Analyze this email to determine if it requires a follow-up response. Check for:
1. Explicit questions that need answers
2. Requests for actions, information, or feedback
3. Deadlines or timeframes mentioned for a response
4. Implied expectations of a reply

Format the response as JSON:
{
  "needsFollowUp": true/false,
  "reason": "Brief explanation",
  "suggestedDate": "YYYY-MM-DD",
  "keyPoints": ["Point 1", "Point 2"]
}
`;
```

### AI Response Processing

The system parses AI responses and creates follow-ups with:
- Suggested due dates
- Key points to address
- Priority based on content analysis
- Reason for follow-up

## Best Practices

### For Users

1. **Review AI Suggestions**: Always review AI-generated follow-ups for accuracy
2. **Set Appropriate Due Dates**: Adjust suggested dates based on actual urgency
3. **Use Key Points**: Break down complex follow-ups into actionable points
4. **Regular Review**: Check follow-ups daily to stay on top of commitments
5. **Complete with Notes**: Add completion notes for future reference

### For Developers

1. **Error Handling**: Always handle API failures gracefully
2. **Data Validation**: Validate all user inputs before saving
3. **Performance**: Use pagination for large datasets
4. **Security**: Ensure user can only access their own follow-ups
5. **Testing**: Test both automatic and manual follow-up creation flows

## Error Handling

Common errors and solutions:

1. **OpenAI API Failures**
   ```javascript
   if (!config.openaiApiKey) {
     // Fallback to manual follow-up creation
     return { success: false, error: 'OpenAI API key not configured' };
   }
   ```

2. **Invalid Date Handling**
   ```javascript
   dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
   ```

3. **Missing Email Body**
   ```javascript
   if (!emailWithBody.success) {
     return res.status(500).json({ 
       message: 'Failed to retrieve email content'
     });
   }
   ```

## Future Enhancements

1. **Recurring Follow-ups**: Support for periodic follow-ups
2. **Smart Prioritization**: AI-based priority suggestions
3. **Email Templates**: Pre-defined response templates
4. **Calendar Integration**: Sync with Google Calendar
5. **Team Collaboration**: Assign follow-ups to team members
6. **Advanced Analytics**: Trend analysis and insights
7. **Mobile Notifications**: Push notifications for due follow-ups
8. **Bulk Actions**: Process multiple follow-ups at once

## Troubleshooting

### Common Issues

1. **Follow-ups Not Auto-Creating**
   - Check if OpenAI API key is configured
   - Verify `autoDetect` is enabled in settings
   - Ensure email sync is working properly

2. **UI Not Loading**
   - Check for JavaScript errors in console
   - Verify API endpoints are accessible
   - Clear browser cache

3. **Analytics Not Updating**
   - Refresh the page
   - Check API response for errors
   - Verify MongoDB aggregation queries

## Related Documentation

- [Email System Documentation](./email-system.md)
- [Task Extraction Documentation](./task-extraction-system.md)
- [API Reference](./api-reference.md)
- [Database Schema](./database-schema.md)
