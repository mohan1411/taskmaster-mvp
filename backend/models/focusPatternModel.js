const mongoose = require('mongoose');

const focusPatternSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  energyProfile: {
    peakHours: [{
      startHour: Number, // 0-23
      endHour: Number,
      dayOfWeek: Number, // 0-6
      energyLevel: Number, // 1-10
      productivity: Number // 0-100
    }],
    lowEnergyPeriods: [{
      startHour: Number,
      endHour: Number,
      dayOfWeek: Number
    }]
  },
  optimalSessionLength: {
    deepWork: {
      type: Number,
      default: 90 // minutes
    },
    regular: {
      type: Number,
      default: 45
    },
    light: {
      type: Number,
      default: 25
    }
  },
  breakPreferences: {
    frequency: {
      type: Number,
      default: 25 // minutes between breaks
    },
    shortBreakDuration: {
      type: Number,
      default: 5 // minutes
    },
    longBreakDuration: {
      type: Number,
      default: 15
    },
    breakActivities: [String]
  },
  distractionTriggers: [{
    source: String, // 'email', 'slack', 'social_media', etc.
    timeOfDay: [Number], // hours when most vulnerable
    frequency: Number,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  }],
  environmentPreferences: {
    ambientSounds: [{
      type: String,
      preference: Number, // 1-10
      effectiveness: Number // 0-100
    }],
    lighting: {
      brightness: Number,
      colorTemperature: Number,
      autoAdjust: Boolean
    },
    notifications: {
      allowCritical: Boolean,
      batchTime: [Number], // hours for batch delivery
      silentHours: [{
        start: Number,
        end: Number
      }]
    }
  },
  taskPreferences: {
    morningTasks: [String], // task types preferred in morning
    afternoonTasks: [String],
    eveningTasks: [String],
    cognitiveLoadTolerance: {
      morning: Number, // 1-10
      afternoon: Number,
      evening: Number
    }
  },
  flowStateTriggers: [{
    condition: String,
    frequency: Number,
    reliability: Number // 0-100
  }],
  historicalPerformance: {
    bestDay: {
      dayOfWeek: Number,
      averageFocusScore: Number,
      averageSessionLength: Number
    },
    worstDay: {
      dayOfWeek: Number,
      averageFocusScore: Number,
      averageSessionLength: Number
    },
    monthlyTrend: {
      focusTime: Number, // percentage change
      focusScore: Number,
      flowStates: Number
    }
  },
  recommendations: [{
    type: String,
    message: String,
    priority: Number,
    createdAt: Date,
    accepted: Boolean,
    effectiveness: Number
  }],
  lastAnalyzed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to update energy profile based on session data
focusPatternSchema.methods.updateEnergyProfile = async function(sessionData) {
  const hour = new Date(sessionData.startTime).getHours();
  const dayOfWeek = new Date(sessionData.startTime).getDay();
  
  // Find or create energy profile entry
  let profile = this.energyProfile.peakHours.find(p => 
    p.startHour <= hour && p.endHour > hour && p.dayOfWeek === dayOfWeek
  );
  
  if (!profile) {
    profile = {
      startHour: hour,
      endHour: hour + 1,
      dayOfWeek: dayOfWeek,
      energyLevel: sessionData.energyLevel.start,
      productivity: sessionData.focusScore
    };
    this.energyProfile.peakHours.push(profile);
  } else {
    // Update with weighted average
    profile.energyLevel = (profile.energyLevel * 0.7 + sessionData.energyLevel.start * 0.3);
    profile.productivity = (profile.productivity * 0.7 + sessionData.focusScore * 0.3);
  }
  
  this.lastAnalyzed = new Date();
  return this.save();
};

// Method to get optimal time for a task
focusPatternSchema.methods.getOptimalTimeForTask = function(taskType, duration) {
  const now = new Date();
  const currentHour = now.getHours();
  const dayOfWeek = now.getDay();
  
  // Find peak hours for today
  const todayPeakHours = this.energyProfile.peakHours
    .filter(p => p.dayOfWeek === dayOfWeek && p.startHour >= currentHour)
    .sort((a, b) => b.productivity - a.productivity);
  
  if (todayPeakHours.length > 0) {
    return {
      suggestedTime: todayPeakHours[0].startHour,
      energyLevel: todayPeakHours[0].energyLevel,
      expectedProductivity: todayPeakHours[0].productivity
    };
  }
  
  // Default suggestion
  return {
    suggestedTime: currentHour + 1,
    energyLevel: 7,
    expectedProductivity: 75
  };
};

// Method to generate personalized recommendations
focusPatternSchema.methods.generateRecommendations = function() {
  const recommendations = [];
  
  // Check for consistent low-energy periods
  const lowEnergyCount = this.energyProfile.lowEnergyPeriods.length;
  if (lowEnergyCount > 3) {
    recommendations.push({
      type: 'schedule',
      message: `Schedule light tasks or breaks during your low-energy periods (${this.energyProfile.lowEnergyPeriods[0].startHour}:00-${this.energyProfile.lowEnergyPeriods[0].endHour}:00)`,
      priority: 8
    });
  }
  
  // Check for optimal session length
  if (this.optimalSessionLength.deepWork < 60) {
    recommendations.push({
      type: 'duration',
      message: 'Try gradually increasing your deep work sessions by 5-10 minutes',
      priority: 6
    });
  }
  
  // Check distraction patterns
  const highDistractions = this.distractionTriggers.filter(d => d.severity === 'high');
  if (highDistractions.length > 0) {
    recommendations.push({
      type: 'distraction',
      message: `Block ${highDistractions[0].source} during focus sessions - it's your biggest distraction`,
      priority: 9
    });
  }
  
  return recommendations;
};

// Static method to create default pattern for new user
focusPatternSchema.statics.createDefaultPattern = async function(userId) {
  return this.create({
    user: userId,
    energyProfile: {
      peakHours: [
        { startHour: 9, endHour: 11, dayOfWeek: 1, energyLevel: 8, productivity: 85 },
        { startHour: 9, endHour: 11, dayOfWeek: 2, energyLevel: 8, productivity: 85 },
        { startHour: 9, endHour: 11, dayOfWeek: 3, energyLevel: 8, productivity: 85 },
        { startHour: 9, endHour: 11, dayOfWeek: 4, energyLevel: 8, productivity: 85 },
        { startHour: 9, endHour: 11, dayOfWeek: 5, energyLevel: 8, productivity: 85 }
      ],
      lowEnergyPeriods: [
        { startHour: 13, endHour: 14, dayOfWeek: 1 },
        { startHour: 13, endHour: 14, dayOfWeek: 2 },
        { startHour: 13, endHour: 14, dayOfWeek: 3 },
        { startHour: 13, endHour: 14, dayOfWeek: 4 },
        { startHour: 13, endHour: 14, dayOfWeek: 5 }
      ]
    }
  });
};

const FocusPattern = mongoose.model('FocusPattern', focusPatternSchema);

module.exports = FocusPattern;