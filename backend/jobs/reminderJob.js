// jobs/reminderJob.js
// Use try-catch to handle missing cron package
let cron;
try {
  cron = require('node-cron');
} catch (error) {
  console.warn('node-cron package not found. Reminder scheduling disabled.');
  // Create a placeholder for the cron object
  cron = {
    schedule: (cronExpression, callback) => {
      console.warn(`Would schedule job with expression '${cronExpression}', but node-cron is not installed.`);
      console.warn('Please install node-cron by running: npm install node-cron --save');
      return { stop: () => {} };
    }
  };
}

const { processReminders } = require('../controllers/reminderController');

/**
 * Schedule the reminder processing job
 * This runs every 15 minutes to check for follow-ups that need reminders
 */
const scheduleReminderJob = () => {
  // Schedule to run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('Running reminder processing job...');
    try {
      const result = await processReminders();
      console.log('Reminder job completed:', result);
    } catch (error) {
      console.error('Error running reminder job:', error);
    }
  });
  
  console.log('Reminder job scheduled');
};

module.exports = { scheduleReminderJob };