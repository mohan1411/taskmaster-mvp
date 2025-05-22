# Smart Follow-up Reminders Testing Guide

This guide will help developers test the Smart Follow-up Reminders feature to ensure it's working correctly.

## Prerequisites
1. Make sure you've run `install-reminder-dependencies.bat` to install all required dependencies
2. Configure the `.env` file with necessary email settings (see Setup Guide)

## Testing the Backend Components

### 1. Test Reminder Processing
Run the standalone test script:
```bash
node backend/test-reminders.js
```

Expected output:
- Connection to MongoDB successful
- "Processing follow-up reminders..." message
- Information about processed follow-ups
- No errors

### 2. Test Manual Reminder API Endpoint
Using Postman or a similar tool:
- POST to `/api/reminders/followups/:followupId/reminders/send`
- Include a notification type in the body: `{ "notificationType": "in-app" }`
- Verify you get a success response

### 3. Test Snooze API Endpoint
Using Postman or a similar tool:
- POST to `/api/reminders/followups/:followupId/snooze`
- Include days in the body: `{ "days": 2 }`
- Verify you get a success response and the follow-up is updated

## Testing the Frontend Components

### 1. Test Reminder Settings UI
- Navigate to a follow-up detail
- Scroll down to the Reminder Settings section
- Click Configure
- Verify you can:
  - Enable/disable reminders
  - Add/remove reminder times
  - Select notification channels
  - Toggle priority-based timing
- Save settings and verify they are displayed correctly

### 2. Test Manual Reminder Button
- Open a follow-up
- Click the "Send Reminder" button
- Select a notification type
- Click "Send Reminder"
- Verify you get a success message

### 3. Test Snooze Functionality
- From the follow-ups list, find the snooze button
- Click and enter a number of days
- Verify the follow-up due date is updated

### 4. Test Browser Notifications
- Grant browser notification permissions if prompted
- Send a manual reminder with "Browser" type
- Verify you receive a browser notification
- Click the notification and verify it navigates to the follow-up

## Testing Multi-channel Notifications

### 1. Email Notifications
- Configure email settings in `.env`
- Send a manual reminder with "Email" type
- Check your inbox for the reminder email
- Verify the email contains all necessary details

### 2. In-app Notifications
- Send a manual reminder with "In-app" type
- Check the notification center
- Verify the notification appears with correct details

### 3. Browser Notifications
- Send a manual reminder with "Browser" type
- Verify the desktop notification appears
- Test clicking the notification navigates to the follow-up

## Testing Priority-based Timing

This requires manual inspection of the reminder processing logic:

1. Create follow-ups with different priorities
2. Configure reminder settings with priority-based timing enabled
3. Use the test script to process reminders
4. Check the logs to verify that high and urgent priority follow-ups have adjusted timing

## Troubleshooting Common Issues

### Missing Dependencies
- Run `npm list node-cron` in the backend directory to verify it's installed
- Run `npm list @mui/x-date-pickers` in the frontend directory to verify it's installed

### Email Configuration
- Double-check the email settings in `.env`
- Verify the transporter is created correctly in reminderController.js

### Browser Notification Permissions
- Check browser settings to ensure notifications are allowed
- Use browser developer tools to debug notification issues

### Date Formatting
- Ensure date-fns is properly imported and used
- Check for any date parsing or formatting errors in the console
