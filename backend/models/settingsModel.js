const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  emailSync: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['realtime', 'hourly', 'daily'],
      default: 'hourly'
    },
    labels: [String], // Gmail labels to sync
    excludeLabels: [String], // Gmail labels to exclude
    maxEmailsToProcess: {
      type: Number,
      default: 100
    }
  },
  notifications: {
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly'],
        default: 'daily'
      }
    },
    browser: {
      enabled: {
        type: Boolean,
        default: true
      }
    }
  },
  taskExtraction: {
    autoExtract: {
      type: Boolean,
      default: false
    },
    confirmBeforeSaving: {
      type: Boolean,
      default: true
    },
    excludeTerms: [String] // Terms to exclude from extraction
  },
  followUps: {
    defaultReminderDays: {
      type: Number,
      default: 3
    },
    autoDetect: {
      type: Boolean,
      default: true
    }
  },
  ui: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    defaultView: {
      type: String,
      enum: ['list', 'board', 'calendar'],
      default: 'list'
    }
  },
  integrations: {
    google: {
      connected: {
        type: Boolean,
        default: false
      },
      tokenInfo: {
        accessToken: String,
        refreshToken: String,
        expiryDate: Date
      }
    }
  }
}, {
  timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
