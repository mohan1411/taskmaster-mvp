const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['in-app', 'email', 'browser'],
    default: 'in-app'
  },
  read: {
    type: Boolean,
    default: false
  },
  referenceType: {
    type: String,
    enum: ['followup', 'task', 'email', 'system'],
    default: 'system'
  },
  referenceId: {
    type: String
  },
  dismissedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create an index on user and read status for efficient querying
notificationSchema.index({ user: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;