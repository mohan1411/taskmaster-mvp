const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  threadId: {
    type: String,
    required: true
  },
  sender: {
    name: String,
    email: String
  },
  recipients: [{
    name: String,
    email: String,
    type: {
      type: String,
      enum: ['to', 'cc', 'bcc']
    }
  }],
  subject: {
    type: String,
    trim: true
  },
  snippet: {
    type: String
  },
  hasAttachments: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    mimeType: String,
    size: Number,
    attachmentId: String
  }],
  labels: [String],
  receivedAt: {
    type: Date
  },
  isRead: {
    type: Boolean,
    default: false
  },
  taskExtracted: {
    type: Boolean,
    default: false
  },
  needsFollowUp: {
    type: Boolean,
    default: false
  },
  followUpDueDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for faster querying
emailSchema.index({ user: 1, receivedAt: -1 });
emailSchema.index({ user: 1, threadId: 1 });

const Email = mongoose.model('Email', emailSchema);

module.exports = Email;
