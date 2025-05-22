const express = require('express');
const router = express.Router();
const {
  sendManualReminder,
  getReminderSettings,
  updateReminderSettings,
  triggerReminderProcessing,
  snoozeFollowUp
} = require('../controllers/reminderController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Get/update reminder settings for a follow-up
router.route('/followups/:followupId/reminders')
  .get(getReminderSettings)
  .put(updateReminderSettings);

// Manually send a reminder for a follow-up
router.post('/followups/:followupId/reminders/send', sendManualReminder);

// Snooze a follow-up
router.post('/followups/:followupId/snooze', snoozeFollowUp);

// Admin route to manually trigger reminder processing (for testing)
router.post('/process', admin, triggerReminderProcessing);

module.exports = router;