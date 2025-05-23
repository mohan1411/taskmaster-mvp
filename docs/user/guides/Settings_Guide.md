# TaskMaster Settings Guide

## Quick Settings Reference

This guide provides detailed instructions for configuring TaskMaster's settings to optimize your experience.

---

## Table of Contents

1. [Notification Settings](#notification-settings)
2. [Task Extraction Settings](#task-extraction-settings)
3. [Follow-up Detection Settings](#follow-up-detection-settings)
4. [Performance Settings](#performance-settings)
5. [Privacy & Security Settings](#privacy--security-settings)
6. [Quick Setup Guide](#quick-setup-guide)

---

## Notification Settings

### Browser Notifications

**Purpose**: Receive real-time desktop notifications for tasks and follow-ups.

**Setup Steps**:
1. Navigate to Settings → Notifications
2. Look for "Browser Notification Permission Status"
3. Click "Enable" if permission is not granted
4. Allow notifications when your browser prompts
5. Toggle "Enable Browser Notifications" to ON
6. Test using the "Test" button

**Troubleshooting**:
- **Permission Denied**: Click the lock icon in your browser address bar → Change notifications to "Allow" → Refresh page
- **Not Working**: Check if your browser supports notifications, ensure TaskMaster has focus when testing

### Email Notifications

**Purpose**: Receive email summaries and reminders about your tasks and follow-ups.

**Configuration Options**:

**Enable/Disable**: Toggle email notifications on/off

**Frequency Settings**:
- **Immediate**: Real-time notifications for every event
- **Hourly Digest**: Summary email every hour with activity
- **Daily Digest**: One email per day with summary
- **Weekly Summary**: Weekly overview of tasks and follow-ups

**Notification Types** (can be enabled/disabled individually):
- **Task Reminders**: Notifications about upcoming task due dates
- **Follow-up Reminders**: Alerts about pending responses
- **Overdue Alerts**: Warnings about missed deadlines
- **Weekly Reports**: Comprehensive weekly activity summaries

**Best Practices**:
- Start with "Daily Digest" to avoid email overload
- Enable "Overdue Alerts" for critical deadline management
- Use "Immediate" only for high-priority notifications

### Notification Preferences

**Quiet Hours**:
- **Start Time**: When to stop sending notifications (e.g., 10:00 PM)
- **End Time**: When to resume notifications (e.g., 8:00 AM)
- **Purpose**: Maintain work-life balance and prevent after-hours interruptions

**Weekdays Only**:
- **Function**: Only send notifications Monday through Friday
- **Use Case**: Separate work and personal time

---

## Task Extraction Settings

### AI Engine Status

**What It Shows**:
- **Connected**: AI services are available and ready
- **Checking**: System is verifying AI availability
- **Unavailable**: AI services are currently offline

**If Unavailable**:
- Task extraction features will be disabled
- Manual task creation still works
- Check back later or contact support

### Auto-Extraction Configuration

**Auto-extract tasks from emails**:
- **Function**: Automatically detect action items in emails
- **Requirement**: AI engine must be connected
- **Recommendation**: Enable for productivity boost

**Review extracted tasks before saving**:
- **Function**: Show detected tasks for approval before adding to your list
- **When to Enable**: 
  - New users learning the system
  - High-stakes environments requiring accuracy
  - When fine-tuning extraction settings
- **When to Disable**: 
  - After you trust the extraction accuracy
  - For high-volume email processing

**Smart categorization**:
- **Function**: Automatically assigns categories to extracted tasks
- **Based on**: Email content, keywords, sender patterns
- **Benefit**: Reduces manual organization work

**Priority detection**:
- **Function**: Assigns priority levels based on urgency indicators
- **Looks for**: Words like "urgent," "ASAP," "deadline," sender importance
- **Benefit**: Helps focus on high-priority items first

### Extraction Sensitivity

**Controls**: How aggressively the AI detects tasks in emails.

**Sensitivity Levels**:

**Conservative (10-30%)**:
- Only extracts obvious, explicit tasks
- High precision, may miss subtle action items
- **Best for**: Users who prefer manual control
- **Example**: Only catches "Please complete the report by Friday"

**Balanced (40-60%)**:
- Extracts clear tasks and likely action items
- Good balance of precision and recall
- **Best for**: Most users
- **Example**: Catches both explicit tasks and implied actions

**Aggressive (70-90%)**:
- Extracts potential tasks and implied actions
- May create some false positives
- **Best for**: Users who prefer to review and filter
- **Example**: Might extract tasks from "It would be great if we could..."

**Recommendation**: Start with 50% (Balanced) and adjust based on results.

### Content Filtering

**Exclude Terms**:
- **Purpose**: Prevent processing of emails containing specific words
- **Format**: Comma-separated list
- **Examples**: 
  ```
  newsletter, unsubscribe, automated, noreply, marketing, 
  promotion, sale, offer, spam, advertisement
  ```
- **Use Cases**: Filter out newsletters, automated emails, marketing content

**Required Keywords**:
- **Purpose**: Only process emails containing at least one of these terms
- **Format**: Comma-separated list
- **Examples**: 
  ```
  action, task, todo, deadline, urgent, follow-up, 
  complete, deliver, prepare, schedule
  ```
- **Leave Empty**: To process all emails (default behavior)

---

## Follow-up Detection Settings

### Auto-Detection Configuration

**Auto-detect follow-up needs**:
- **Function**: Automatically identifies emails requiring responses
- **Analyzes**: Question patterns, request language, conversation context
- **Creates**: Follow-up entries with suggested due dates and priorities

**Default Reminder Days**:
- **Range**: 1-30 days
- **Default**: 3 days
- **Function**: How many days after the email date to set the follow-up reminder
- **Guidelines**:
  - 1-2 days: Urgent business communications
  - 3-5 days: Standard business responses
  - 7+ days: Non-urgent or complex responses

**Default Priority**:
- **Options**: Low, Medium, High, Urgent
- **Default**: Medium
- **Function**: Priority level assigned to auto-detected follow-ups
- **Can be adjusted**: Individual follow-ups can be changed after creation

### Smart Scheduling

**Function**: Automatically adjusts follow-up dates based on email content analysis.

**When Enabled, the system considers**:
- **Urgency indicators**: Words like "urgent," "ASAP," "soon"
- **Explicit deadlines**: "Please respond by Friday"
- **Sender importance**: VIP contacts get higher priority
- **Response history**: Your typical response time to similar emails

**Benefits**:
- More accurate due dates
- Automatic priority adjustment
- Reduced manual date setting

---

## Performance Settings

### Processing Configuration

**Batch Size**:
- **Range**: 1-50 emails
- **Default**: 10
- **Function**: Number of emails processed together
- **Trade-offs**:
  - **Larger batches (20-50)**: Faster overall processing, may feel less responsive
  - **Smaller batches (1-10)**: More responsive interface, slower overall processing
- **Recommendation**: Start with 10, increase if processing many emails

**Processing Delay**:
- **Range**: 0-30 seconds
- **Default**: 2 seconds
- **Function**: Pause between processing batches
- **Purpose**: Prevents API rate limiting and system overload
- **Guidelines**:
  - 0-1 seconds: Fast processing, risk of rate limits
  - 2-5 seconds: Balanced performance and safety
  - 5+ seconds: Conservative, slower but very safe

**Enable Result Caching**:
- **Function**: Store extraction results to avoid reprocessing the same emails
- **Benefits**: 
  - Significantly faster repeat processing
  - Reduced API usage
  - Better performance with large email volumes
- **Storage Impact**: Minimal
- **Recommendation**: Keep enabled unless storage is a concern

---

## Privacy & Security Settings

### Data Protection

**Anonymize Personal Data**:
- **Function**: Remove or mask personal information from extracted tasks
- **What gets anonymized**: Names, phone numbers, addresses, personal identifiers
- **When to enable**:
  - Shared business accounts
  - Compliance requirements
  - Enhanced privacy protection
- **Trade-off**: May reduce task context and clarity

**Enable Processing Logs**:
- **Function**: Keep detailed logs of extraction operations
- **Benefits**: 
  - Helps troubleshoot extraction issues
  - Provides processing insights
  - Useful for customer support
- **Privacy impact**: Logs may contain email metadata
- **Recommendation**: Enable only when experiencing issues or requested by support

### Security Information

**Data Handling Practices**:
- Original email content is processed securely and never permanently stored
- Only extracted task information is saved to your account
- All data transmission uses encryption (HTTPS/TLS)
- OAuth tokens are securely managed and can be revoked anytime

**What TaskMaster Stores**:
- Extracted task titles and descriptions
- Follow-up summaries and key points
- Due dates and priority levels
- Processing logs (if enabled)

**What TaskMaster Doesn't Store**:
- Complete email content
- Email headers (except sender for follow-ups)
- Email attachments
- Personal email conversations

---

## Quick Setup Guide

### For New Users

**Step 1: Enable Basic Notifications**
1. Go to Settings → Notifications
2. Enable browser notifications (click Enable → Allow in browser)
3. Set email notifications to "Daily Digest"
4. Configure quiet hours for your schedule

**Step 2: Configure Task Extraction**
1. Go to Settings → Task Extraction
2. Enable "Auto-extract tasks from emails"
3. Keep "Review extracted tasks before saving" ON initially
4. Set sensitivity to 50% (Balanced)
5. Add exclude terms: `newsletter, unsubscribe, automated, noreply`

**Step 3: Set Up Follow-up Detection**
1. Go to Settings → Follow-up Detection
2. Enable "Auto-detect follow-up needs"
3. Set default reminder days to 3
4. Set default priority to Medium
5. Enable "Smart scheduling"

**Step 4: Optimize Performance**
1. Go to Settings → Performance
2. Set batch size to 10
3. Set processing delay to 2 seconds
4. Keep result caching enabled

**Step 5: Configure Privacy**
1. Go to Settings → Privacy & Security
2. Enable "Anonymize personal data" if needed for compliance
3. Disable "Enable processing logs" unless troubleshooting

### For Power Users

**Advanced Configurations**:
- Increase batch size to 20-30 for faster processing
- Use required keywords to focus on specific email types
- Reduce processing delay to 1 second if not hitting rate limits
- Enable processing logs for debugging and optimization
- Use multiple notification channels with different timing
- Set up complex quiet hours for different days

### Optimization Tips

**Weekly Settings Review**:
1. Check extraction accuracy and adjust sensitivity
2. Review exclude terms and add new ones as needed
3. Monitor notification volume and adjust frequency
4. Assess follow-up detection accuracy

**Monthly Settings Audit**:
1. Review privacy settings and data handling preferences
2. Update notification preferences based on workflow changes
3. Optimize performance settings based on email volume
4. Clean up exclude terms and required keywords

---

## Troubleshooting Settings

### Common Issues

**Settings Not Saving**:
- Check internet connection
- Try refreshing the page
- Check for error messages
- Contact support if persistent

**AI Features Not Working**:
- Verify AI engine status shows "Connected"
- Check if you have available AI processing credits
- Try disabling and re-enabling the feature
- Restart the application

**Notifications Not Working**:
- Browser: Check permissions and test notification
- Email: Verify email address and check spam folder
- Verify notification types are enabled
- Check if quiet hours are active

**Performance Issues**:
- Reduce batch size to 5-10
- Increase processing delay to 3-5 seconds
- Check for browser performance issues
- Clear browser cache

---

**Need Help?**

If you need assistance with any settings:
1. Check this guide first
2. Try the suggested troubleshooting steps
3. Contact support with specific details about your issue
4. Include screenshots if helpful

**Settings Best Practice**: Start conservative, then optimize based on your experience and workflow needs.

---

**Last Updated**: May 2025
**Version**: 1.0
