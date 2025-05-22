# Smart Follow-up Reminders Setup Guide

This guide explains how to set up and configure the Smart Follow-up Reminders feature in the TaskMaster application.

## Prerequisites

Ensure you have the following dependencies installed:

### Backend Dependencies
```
npm install node-cron nodemailer --save
```

### Frontend Dependencies
```
npm install date-fns @mui/x-date-pickers @emotion/react @emotion/styled --save
```

## Configuration

### 1. Email Configuration

Add the following environment variables to your `.env` file:

```
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=TaskMaster <your-email@gmail.com>
APP_URL=http://localhost:3000
```

**Important Notes for Gmail:**
- You need to use an "App Password" if you have 2FA enabled
- To generate an App Password:
  1. Go to your Google Account settings
  2. Navigate to Security
  3. Under "Signing in to Google", select "App passwords"
  4. Generate a new app password for "Mail" and "Other (Custom name)"

### 2. Browser Notifications

For browser notifications to work:
- The application must be served over HTTPS in production
- Users need to grant notification permissions
- The application URL must be added to the browser's allowed notification origins

## Verification Steps

1. **Verify Reminder Job**
   ```
   # Start the backend server
   cd backend
   npm start
   ```
   
   Check the console logs for: "Reminder job scheduled"

2. **Test Email Notifications**
   - Create a follow-up with reminder settings
   - Use the "Send Reminder" button and select "Email"
   - Check that you receive the email properly formatted

3. **Test Browser Notifications**
   - Grant browser notification permissions
   - Use the "Send Reminder" button and select "Browser"
   - Verify that you receive a desktop notification

## Troubleshooting

### Reminder Job Not Running
- Check that node-cron is installed
- Verify that the reminderJob is being scheduled in server.js
- Check server logs for any errors in the reminder processing

### Email Notifications Not Sending
- Verify SMTP settings in your .env file
- Ensure you're using the correct email/password
- Check if your email provider requires special app passwords
- Look for SMTP errors in the server logs

### Browser Notifications Not Working
- Ensure notifications are allowed in browser settings
- Check that the application is running on HTTPS (or localhost)
- Verify the browser console for any permission errors

## Additional Configuration

### Reminder Timing
You can customize default reminder times by modifying:
- The FollowUpReminderSettings component for the UI options
- The reminderController.js for the backend timing logic

### Email Templates
You can customize the email template by editing the htmlMessage in the sendEmailNotification function in reminderController.js.

## Scheduling
The reminder job runs every 15 minutes by default. To change this frequency, modify the cron schedule in jobs/reminderJob.js:

```javascript
// Schedule to run every 30 minutes instead of 15
cron.schedule('*/30 * * * *', async () => {
  // ...
});
```

## Testing Reminder Processing
You can manually trigger reminder processing using:
```
POST /api/reminders/process
```
Note: This endpoint requires admin privileges.
