# TaskMaster User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core Features](#core-features)
3. [Settings & Configuration](#settings--configuration)
4. [Advanced Features](#advanced-features)
5. [Troubleshooting](#troubleshooting)
6. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### What is TaskMaster?

TaskMaster is an intelligent task and follow-up management system designed specifically for small businesses. It helps you extract actionable tasks from emails, manage follow-ups, and never miss important communications again.

### Key Concepts

- **Tasks**: Action items you need to complete (your TO-DO list)
- **Follow-ups**: Communications you need to respond to (your TO-REPLY list)
- **Smart Extraction**: AI-powered detection of tasks and follow-ups from emails
- **Reminders**: Automated notifications to keep you on track

### First Steps

1. **Set up your email integration** (Gmail OAuth)
2. **Configure your notification preferences**
3. **Customize task extraction settings**
4. **Start processing your first emails**

---

## Core Features

### Email Processing

TaskMaster connects to your Gmail account and processes emails to extract:
- Action items that become tasks
- Communications requiring responses that become follow-ups
- Important dates and deadlines
- Priority indicators

### Task Management

**Creating Tasks:**
- Manually create tasks from the dashboard
- Auto-extract from emails using AI
- Convert follow-ups to tasks when needed

**Task Features:**
- Priority levels (Low, Medium, High, Urgent)
- Due dates and reminders
- Categories and tags
- Progress tracking
- Notes and attachments

### Follow-up Management

**Creating Follow-ups:**
- Auto-detect from email processing
- Manual creation for important communications
- Link to original email threads

**Follow-up Features:**
- Response tracking
- Snooze functionality
- Priority-based reminders
- Contact management
- Key points tracking

---

## Settings & Configuration

### Accessing Settings

Navigate to **Settings** from the main menu to configure your TaskMaster experience.

### 1. Notification Settings

Configure how and when you receive notifications to stay on top of your tasks and follow-ups.

#### Browser Notifications

**Enable Browser Notifications:**
1. Go to Settings → Notifications
2. Click "Enable" for Browser Permission Status
3. Allow notifications when prompted by your browser
4. Toggle "Enable Browser Notifications" on

**Browser Notification Features:**
- Real-time desktop notifications
- Works even when TaskMaster isn't your active tab
- Test notifications to verify setup
- Permission status monitoring

**Troubleshooting Browser Notifications:**
- If blocked, click the lock icon in your browser address bar
- Change notification permissions to "Allow"
- Refresh the page and re-enable in settings

#### Email Notifications

**Configure Email Notifications:**
1. Enable/disable email notifications
2. Set frequency (Immediate, Hourly, Daily, Weekly)
3. Choose notification types:
   - Task Reminders
   - Follow-up Reminders
   - Overdue Alerts
   - Weekly Reports

**Email Frequency Options:**
- **Immediate**: Get notified as soon as something happens
- **Hourly Digest**: Receive a summary every hour
- **Daily Digest**: One summary email per day
- **Weekly Summary**: Weekly overview of activities

#### Notification Preferences

**Quiet Hours:**
- Set start and end times for quiet hours
- No notifications will be sent during this period
- Example: 10:00 PM to 8:00 AM

**Weekdays Only:**
- Enable to receive notifications only Monday-Friday
- Useful for maintaining work-life balance

### 2. Task Extraction Settings

Configure how TaskMaster intelligently processes your emails to extract tasks and follow-ups.

#### AI Engine Status

**Monitor AI Availability:**
- Check OpenAI integration status
- Verify AI services are connected and ready
- View connection health indicators

#### Auto-Extraction Settings

**Enable Auto-Extraction:**
- Toggle automatic task extraction from emails
- Requires AI engine to be connected
- Processes emails in real-time or batch mode

**Review Before Saving:**
- Show extracted tasks for approval before adding to your list
- Recommended for new users to verify accuracy
- Can be disabled once you trust the extraction quality

**Smart Features:**
- **Smart Categorization**: Automatically categorize tasks based on content
- **Priority Detection**: Set task priority based on urgency indicators
- **Sensitivity Control**: Adjust how aggressively the system extracts tasks

#### Extraction Sensitivity

Control how sensitive the AI is when detecting tasks:

- **Conservative (10-30%)**: Only extract obvious, explicit tasks
- **Balanced (40-60%)**: Extract clear tasks and likely action items
- **Aggressive (70-90%)**: Extract potential tasks and implied actions

**Recommended Setting**: Start with Balanced (50%) and adjust based on results.

#### Content Filtering

**Exclude Terms:**
Add comma-separated terms to exclude emails from processing:
```
newsletter, unsubscribe, automated, noreply, marketing
```

**Required Keywords:**
Only process emails containing these keywords (leave empty to process all):
```
action, task, todo, deadline, urgent, follow-up
```

### 3. Follow-up Detection Settings

Configure automatic detection and management of follow-up communications.

#### Auto-Detection

**Enable Follow-up Detection:**
- Automatically detect when emails require responses
- AI analyzes email content for response indicators
- Creates follow-up entries with suggested priorities

**Default Settings:**
- **Reminder Days**: How many days after email date to set reminder (default: 3)
- **Default Priority**: Priority level for auto-detected follow-ups
- **Smart Scheduling**: Adjust reminder dates based on content urgency

#### Smart Scheduling

When enabled, TaskMaster will:
- Analyze email urgency indicators
- Adjust follow-up dates accordingly
- Prioritize based on sender importance
- Consider your response history

### 4. Performance Settings

Optimize TaskMaster's processing speed and resource usage.

#### Processing Configuration

**Batch Size:**
- Number of emails to process at once (1-50)
- Larger batches = faster processing
- Smaller batches = more responsive interface
- Recommended: 10-20 emails per batch

**Processing Delay:**
- Seconds to wait between processing batches
- Prevents API rate limiting
- Recommended: 2-5 seconds for most accounts

**Result Caching:**
- Cache extraction results to avoid reprocessing
- Significantly improves performance
- Minimal storage impact

### 5. Privacy & Security Settings

Protect your data while using TaskMaster's AI features.

#### Data Protection

**Anonymize Personal Data:**
- Remove or mask personal information from extracted tasks
- Protects sensitive details in task descriptions
- Recommended for shared or business accounts

**Processing Logs:**
- Keep logs of extraction operations for debugging
- May impact privacy - disable if concerned
- Useful for troubleshooting extraction issues

#### Security Information

TaskMaster follows these security practices:
- Email content is processed securely and never permanently stored
- Only extracted task information is saved
- All data transmission is encrypted
- OAuth tokens are securely managed

---

## Advanced Features

### Smart Reminders

TaskMaster's reminder system adapts to your priorities:

**Priority-Based Timing:**
- Standard: Reminders at configured schedule
- High Priority: 50% earlier reminders
- Urgent: Twice as early reminders

**Multi-Channel Reminders:**
- In-app notifications
- Email reminders
- Browser notifications
- Choose different channels for different reminder times

### Batch Processing

Process multiple emails efficiently:

1. Select emails to process from your Gmail
2. TaskMaster extracts tasks and follow-ups in batches
3. Review and approve extracted items
4. Items are automatically added to your lists

### Integration Features

**Gmail Integration:**
- Secure OAuth connection
- Real-time email processing
- Thread linking for follow-ups
- Automatic email marking

**Calendar Integration** (Coming Soon):
- Sync due dates with calendar
- Meeting-based task creation
- Schedule follow-up calls

---

## Troubleshooting

### Common Issues

#### Email Integration Problems

**Issue**: Gmail connection fails
**Solution**: 
1. Check internet connection
2. Reauthorize Gmail access in Settings
3. Verify Google account permissions
4. Contact support if problem persists

#### Notification Issues

**Issue**: Not receiving browser notifications
**Solution**:
1. Check browser notification permissions
2. Verify settings are enabled in TaskMaster
3. Test notifications using the "Test" button
4. Try refreshing the page

**Issue**: Email notifications not arriving
**Solution**:
1. Check spam/junk folder
2. Verify email address in settings
3. Check notification frequency settings
4. Ensure email notifications are enabled

#### AI Extraction Problems

**Issue**: Tasks not being extracted accurately
**Solution**:
1. Check AI engine status
2. Adjust extraction sensitivity
3. Add exclude terms for unwanted extractions
4. Use required keywords to focus processing

### Performance Issues

**Issue**: Slow email processing
**Solution**:
1. Reduce batch size in performance settings
2. Increase processing delay
3. Enable result caching
4. Process smaller email sets

### Getting Help

If you continue experiencing issues:
1. Check the FAQ section
2. Review error messages carefully
3. Try the suggested troubleshooting steps
4. Contact support with specific error details

---

## Tips & Best Practices

### Getting the Most from TaskMaster

#### Email Processing Tips

1. **Start Small**: Process a few emails first to understand extraction behavior
2. **Review Results**: Use "Review before saving" initially to verify accuracy
3. **Tune Settings**: Adjust sensitivity based on your email types
4. **Use Filters**: Set up exclude terms for newsletters and automated emails

#### Task Management Best Practices

1. **Set Realistic Due Dates**: Give yourself adequate time for completion
2. **Use Priorities Wisely**: Reserve "Urgent" for truly time-sensitive items
3. **Add Context**: Include notes and relevant details in task descriptions
4. **Regular Reviews**: Check your task list daily and weekly

#### Follow-up Management Tips

1. **Respond Promptly**: Use reminders to maintain professional communication
2. **Track Key Points**: Note important details to include in responses
3. **Use Snooze Wisely**: Temporarily delay follow-ups when you need more information
4. **Priority by Relationship**: Higher priority for important clients/contacts

#### Notification Strategy

1. **Layer Your Reminders**: Use multiple notification channels for important items
2. **Respect Quiet Hours**: Configure to match your work schedule
3. **Adjust Frequency**: Find the right balance between staying informed and avoiding overload
4. **Test Regularly**: Ensure notifications are working as expected

### Workflow Optimization

#### Daily Routine

1. **Morning Review**: Check overnight notifications and today's priorities
2. **Email Processing**: Process new emails during dedicated time blocks
3. **Task Execution**: Work through tasks by priority
4. **End-of-Day**: Review completed items and plan for tomorrow

#### Weekly Routine

1. **Settings Review**: Adjust extraction settings based on the week's results
2. **Priority Assessment**: Review and adjust task/follow-up priorities
3. **Performance Check**: Monitor processing speed and accuracy
4. **Cleanup**: Archive completed items and update ongoing tasks

### Customization Tips

1. **Personalize Exclude Terms**: Add terms specific to your industry/role
2. **Tailor Sensitivity**: Adjust based on your email communication style
3. **Optimize Timing**: Set quiet hours and reminder schedules to match your routine
4. **Use Categories**: Organize tasks by project, client, or type

### Security Best Practices

1. **Regular Reviews**: Periodically review connected services and permissions
2. **Monitor Access**: Check for unusual activity in your email integration
3. **Update Settings**: Keep privacy settings aligned with your comfort level
4. **Data Awareness**: Understand what data is processed and stored

---

## Conclusion

TaskMaster is designed to grow with your needs. Start with basic email processing and task management, then gradually explore advanced features like smart reminders and follow-up detection. 

The key to success with TaskMaster is consistent use and gradual customization. Begin with the default settings, then adjust based on your experience and workflow requirements.

For additional help, refer to the specific feature guides or contact support.

---

**Last Updated**: May 2025
**Version**: 1.0

For the latest updates and additional resources, visit our documentation portal.
