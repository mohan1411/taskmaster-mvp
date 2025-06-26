const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  plannedDuration: {
    type: Number, // minutes
    required: true
  },
  actualDuration: {
    type: Number // minutes
  },
  sessionType: {
    type: String,
    enum: ['deep_work', 'regular', 'light', 'creative'],
    default: 'regular'
  },
  tasks: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    plannedDuration: Number,
    actualDuration: Number,
    completed: {
      type: Boolean,
      default: false
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }],
  breaks: [{
    startTime: Date,
    endTime: Date,
    type: {
      type: String,
      enum: ['short', 'long', 'emergency']
    }
  }],
  focusScore: {
    type: Number,
    min: 0,
    max: 100
  },
  flowState: {
    achieved: {
      type: Boolean,
      default: false
    },
    duration: Number, // minutes in flow
    startTime: Date,
    endTime: Date
  },
  distractions: {
    blocked: {
      type: Number,
      default: 0
    },
    allowed: {
      type: Number,
      default: 0
    },
    encountered: {
      type: Number,
      default: 0
    },
    sources: [{
      type: String,
      timestamp: Date,
      action: {
        type: String,
        enum: ['blocked', 'allowed', 'deferred']
      }
    }]
  },
  environment: {
    ambientSound: String,
    volume: Number,
    theme: String,
    blockedApps: [String],
    blockedSites: [String]
  },
  energyLevel: {
    start: {
      type: Number,
      min: 1,
      max: 10
    },
    end: {
      type: Number,
      min: 1,
      max: 10
    }
  },
  notes: String,
  endReason: {
    type: String,
    enum: ['completed', 'user_ended', 'paused', 'all_tasks_completed', 'time_up'],
    default: 'completed'
  },
  completedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  flowMetrics: {
    totalFlowTime: Number,
    flowEntries: Number
  },
  metrics: {
    keystrokes: Number,
    mouseActivity: Number,
    taskSwitches: Number,
    idleTime: Number // seconds
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'abandoned'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
focusSessionSchema.index({ user: 1, startTime: -1 });
focusSessionSchema.index({ user: 1, status: 1 });
focusSessionSchema.index({ user: 1, 'flowState.achieved': 1 });

// Virtual for calculating session efficiency
focusSessionSchema.virtual('efficiency').get(function() {
  if (!this.actualDuration || !this.plannedDuration) return 0;
  return Math.round((this.actualDuration / this.plannedDuration) * 100);
});

// Method to calculate focus score
focusSessionSchema.methods.calculateFocusScore = function() {
  let score = 100;
  
  // Deduct points for distractions
  score -= this.distractions.allowed * 5;
  
  // Deduct points for task switches
  if (this.metrics.taskSwitches > 0) {
    score -= Math.min(this.metrics.taskSwitches * 2, 20);
  }
  
  // Deduct points for idle time
  if (this.actualDuration && this.metrics.idleTime) {
    const idlePercentage = (this.metrics.idleTime / 60) / this.actualDuration;
    score -= Math.min(idlePercentage * 50, 30);
  }
  
  // Bonus for flow state
  if (this.flowState.achieved) {
    score += 10;
  }
  
  // Bonus for completing planned duration
  if (this.efficiency >= 95) {
    score += 5;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

// Method to end session
focusSessionSchema.methods.endSession = async function() {
  this.endTime = new Date();
  this.actualDuration = Math.round((this.endTime - this.startTime) / 1000 / 60);
  this.status = 'completed';
  this.focusScore = this.calculateFocusScore();
  return this.save();
};

// Static method to get user's focus statistics
focusSessionSchema.statics.getUserStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const sessions = await this.find({
    user: userId,
    status: 'completed',
    startTime: { $gte: startDate }
  });
  
  const stats = {
    totalSessions: sessions.length,
    totalFocusTime: sessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0),
    averageSessionLength: 0,
    averageFocusScore: 0,
    flowSessions: sessions.filter(s => s.flowState.achieved).length,
    totalFlowTime: sessions.reduce((sum, s) => sum + (s.flowState.duration || 0), 0),
    distractionsBlocked: sessions.reduce((sum, s) => sum + s.distractions.blocked, 0),
    streak: 0 // Will be calculated separately
  };
  
  if (sessions.length > 0) {
    stats.averageSessionLength = Math.round(stats.totalFocusTime / sessions.length);
    stats.averageFocusScore = Math.round(
      sessions.reduce((sum, s) => sum + (s.focusScore || 0), 0) / sessions.length
    );
  }
  
  return stats;
};

const FocusSession = mongoose.model('FocusSession', focusSessionSchema);

module.exports = FocusSession;