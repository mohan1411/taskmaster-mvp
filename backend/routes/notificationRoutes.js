const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Get notifications
router.get('/', getNotifications);

// Mark all notifications as read
router.put('/mark-all-read', markAllNotificationsRead);

// Mark a notification as read / delete a notification
router.route('/:id')
  .put(markNotificationRead)
  .delete(deleteNotification);

module.exports = router;