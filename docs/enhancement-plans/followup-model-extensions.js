// Database model extensions for Enhanced Follow-up System

const mongoose = require('mongoose');

// Existing schema structure (for reference)
const currentFollowupSchema = {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emailId: String,
  threadId: String,
  subject: String,
  contactName: String,
  contactEmail: String,
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'ignored'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String
  },
  reason: {
    type: String
  },
  keyPoints: [String],
  completionNotes: {
    type: String
  },
  relatedTasks: [String],
  aiGenerated: {
    type: Boolean,
    default: false
  }
};

// Schema extensions for enhanced follow-up system
const followupSchemaExtensions = {
  // Reminder system for notifications
  reminderSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    // Array of reminders with relative timing
    schedule: [{
      triggerTime: {
        value: {
          type: Number,
          required: true
        },
        unit: {
          type: String,
          enum: ['minutes', 'hours', 'days'],
          default: 'days'
        }
      },
      channels: [{
        type: String,
        enum: ['in-app', 'email', 'browser'],
        default: 'in-app'
      }],
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    }],
    lastReminderSent: Date
  },
  
  // Response tracking for analytics
  responseTracking: {
    responded: {
      type: Boolean,
      default: false
    },
    responseDetectedAt: Date,
    responseMessageId: String,
    responseMethod: {
      type: String,
      enum: ['email', 'manual', 'other'],
      default: 'email'
    },
    responseTime: {
      type: Number  // Time in milliseconds between creation and response
    },
    responseSummary: String  // AI-generated summary of the response
  },
  
  // Escalation system
  escalation: {
    isEscalated: {
      type: Boolean,
      default: false
    },
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    escalatedAt: Date,
    escalationReason: String,
    escalationLevel: {
      type: Number,
      default: 0
    },
    autoEscalate: {
      enabled: {
        type: Boolean,
        default: false
      },
      afterDays: {
        type: Number,
        default: 7
      }
    }
  },
  
  // Multi-stage workflow support
  workflow: {
    template: {
      type: String,
      default: 'standard'
    },
    currentStage: {
      type: String,
      default: 'initial'
    },
    stages: [{
      name: String,
      description: String,
      startedAt: Date,
      completedAt: Date,
      notes: String,
      actions: [{
        type: String,
        performed: Boolean,
        performedAt: Date
      }]
    }],
    isSequential: {
      type: Boolean,
      default: true
    }
  },
  
  // AI assistance data
  aiAssistance: {
    suggestedResponses: [{
      content: String,
      createdAt: Date,
      used: {
        type: Boolean,
        default: false
      }
    }],
    contextData: {
      previousInteractions: Number,
      relationshipDuration: Number,  // In days
      commonTopics: [String],
      responsePatterns: String
    },
    categoryTags: [String],
    sentimentAnalysis: {
      score: Number,  // -1 to 1 range
      analysis: String
    }
  },
  
  // Analytics and metrics
  metrics: {
    timeToComplete: Number,  // In milliseconds
    reminderCount: {
      type: Number,
      default: 0
    },
    reopenCount: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    },
    lastViewed: Date,
    importance: {
      type: Number,  // 0-100 score calculated from various factors
      default: 50
    }
  }
};

// Usage example for reference (not actual implementation code)
/*
const followupSchema = new mongoose.Schema({
  ...currentFollowupSchema,
  ...followupSchemaExtensions
}, {
  timestamps: true
});

const Followup = mongoose.model('Followup', followupSchema);
module.exports = Followup;
*/

module.exports = followupSchemaExtensions;
