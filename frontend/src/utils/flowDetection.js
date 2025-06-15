/**
 * Advanced Flow State Detection Algorithm
 * 
 * This algorithm analyzes user behavior patterns to detect when they enter
 * and exit flow states, providing real-time feedback and optimization.
 */

// Flow state indicators and their weights
const FLOW_INDICATORS = {
  TYPING_CONSISTENCY: { weight: 0.25, threshold: 0.7 },
  TASK_FOCUS: { weight: 0.20, threshold: 0.8 },
  TIME_PERCEPTION: { weight: 0.15, threshold: 0.6 },
  CHALLENGE_SKILL_BALANCE: { weight: 0.15, threshold: 0.7 },
  ACTIVITY_INTENSITY: { weight: 0.10, threshold: 0.75 },
  INTERRUPTION_RESISTANCE: { weight: 0.10, threshold: 0.8 },
  PROGRESS_MOMENTUM: { weight: 0.05, threshold: 0.6 }
};

/**
 * Analyzes typing patterns to detect flow consistency
 */
export const analyzeTypingConsistency = (keystrokePattern) => {
  if (!keystrokePattern || keystrokePattern.length < 10) return 0;
  
  const intervals = [];
  for (let i = 1; i < keystrokePattern.length; i++) {
    intervals.push(keystrokePattern[i] - keystrokePattern[i - 1]);
  }
  
  // Calculate coefficient of variation (lower = more consistent)
  const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = standardDeviation / mean;
  
  // Convert to consistency score (0-1, higher = more consistent)
  const consistencyScore = Math.max(0, 1 - (coefficientOfVariation / 2));
  
  // Consider optimal typing rhythm (120-200ms between keystrokes)
  const optimalRhythm = intervals.filter(interval => interval >= 120 && interval <= 200).length / intervals.length;
  
  return (consistencyScore * 0.7) + (optimalRhythm * 0.3);
};

/**
 * Measures task focus through window switching and application usage
 */
export const analyzeTaskFocus = (taskSwitches, sessionDuration, appUsage) => {
  if (sessionDuration === 0) return 0;
  
  // Lower task switches indicate better focus
  const switchRate = taskSwitches / (sessionDuration / 60); // switches per minute
  const focusScore = Math.max(0, 1 - (switchRate / 3)); // Penalize more than 3 switches per minute
  
  // Analyze application usage patterns
  let appFocusScore = 1;
  if (appUsage && appUsage.length > 0) {
    const totalTime = appUsage.reduce((sum, app) => sum + app.duration, 0);
    const focusApps = appUsage.filter(app => 
      app.category === 'productivity' || app.category === 'development'
    );
    const focusTime = focusApps.reduce((sum, app) => sum + app.duration, 0);
    appFocusScore = totalTime > 0 ? focusTime / totalTime : 0;
  }
  
  return (focusScore * 0.6) + (appFocusScore * 0.4);
};

/**
 * Detects time perception distortion (feeling like time flies)
 */
export const analyzeTimePerception = (actualDuration, perceivedDuration) => {
  if (!perceivedDuration || actualDuration === 0) return 0;
  
  // In flow, people often underestimate time passage
  const timeDistortion = Math.abs(perceivedDuration - actualDuration) / actualDuration;
  
  // Optimal range: actual time feels 20-40% shorter
  if (perceivedDuration < actualDuration) {
    const underestimation = (actualDuration - perceivedDuration) / actualDuration;
    if (underestimation >= 0.2 && underestimation <= 0.4) {
      return 1; // Perfect flow indicator
    } else if (underestimation > 0.4) {
      return Math.max(0, 1 - ((underestimation - 0.4) * 2)); // Too much distortion
    } else {
      return underestimation / 0.2; // Building up to flow
    }
  }
  
  return Math.max(0, 1 - timeDistortion);
};

/**
 * Evaluates challenge-skill balance
 */
export const analyzeChallengeSkillBalance = (taskDifficulty, userSkillLevel, completionRate) => {
  // Optimal flow occurs when challenge slightly exceeds skill (1.1-1.3 ratio)
  const challengeSkillRatio = taskDifficulty / userSkillLevel;
  
  let balanceScore = 0;
  if (challengeSkillRatio >= 1.1 && challengeSkillRatio <= 1.3) {
    balanceScore = 1; // Perfect balance
  } else if (challengeSkillRatio >= 0.9 && challengeSkillRatio <= 1.5) {
    balanceScore = 0.7; // Good balance
  } else if (challengeSkillRatio >= 0.7 && challengeSkillRatio <= 1.7) {
    balanceScore = 0.4; // Okay balance
  } else {
    balanceScore = 0.1; // Poor balance
  }
  
  // Factor in completion rate
  const completionScore = Math.min(1, completionRate / 0.8); // Optimal around 80%
  
  return (balanceScore * 0.7) + (completionScore * 0.3);
};

/**
 * Measures activity intensity and engagement
 */
export const analyzeActivityIntensity = (activityData, sessionDuration) => {
  if (!activityData || sessionDuration === 0) return 0;
  
  const {
    keystrokes = 0,
    mouseClicks = 0,
    scrollEvents = 0,
    activeMinutes = 0
  } = activityData;
  
  // Calculate activity rates
  const minutesDuration = sessionDuration / 60;
  const keystrokesPerMinute = keystrokes / minutesDuration;
  const clicksPerMinute = mouseClicks / minutesDuration;
  const scrollsPerMinute = scrollEvents / minutesDuration;
  const activeRatio = activeMinutes / minutesDuration;
  
  // Optimal ranges for flow state
  const keystrokeScore = Math.min(1, keystrokesPerMinute / 60); // 60 KPM = 1.0
  const clickScore = Math.min(1, clicksPerMinute / 10); // 10 CPM = 1.0
  const scrollScore = Math.min(1, scrollsPerMinute / 5); // 5 SPM = 1.0
  const activeScore = Math.min(1, activeRatio); // 100% active = 1.0
  
  return (keystrokeScore * 0.4) + (clickScore * 0.2) + (scrollScore * 0.2) + (activeScore * 0.2);
};

/**
 * Measures resistance to interruptions
 */
export const analyzeInterruptionResistance = (interruptions, sessionDuration) => {
  if (sessionDuration === 0) return 1; // No session, perfect resistance
  
  const interruptionsPerHour = (interruptions.length / sessionDuration) * 3600;
  
  // Categories of interruptions
  const criticalInterruptions = interruptions.filter(i => i.urgency === 'critical').length;
  const selfInterruptions = interruptions.filter(i => i.source === 'self').length;
  const externalInterruptions = interruptions.filter(i => i.source === 'external').length;
  
  // Flow state should resist non-critical interruptions
  const resistanceScore = Math.max(0, 1 - (interruptionsPerHour / 10)); // Penalize >10 per hour
  const qualityScore = 1 - (selfInterruptions / Math.max(1, interruptions.length)); // Self-interruptions are worse
  
  return (resistanceScore * 0.7) + (qualityScore * 0.3);
};

/**
 * Evaluates progress momentum
 */
export const analyzeProgressMomentum = (completedTasks, totalTasks, timeElapsed) => {
  if (totalTasks === 0 || timeElapsed === 0) return 0;
  
  const completionRate = completedTasks / totalTasks;
  const progressRate = completedTasks / (timeElapsed / 3600); // tasks per hour
  
  // Optimal progress in flow: steady completion with acceleration
  const momentumScore = Math.min(1, progressRate / 2); // 2 tasks/hour = 1.0
  const completionScore = Math.min(1, completionRate / 0.8); // 80% completion = 1.0
  
  return (momentumScore * 0.6) + (completionScore * 0.4);
};

/**
 * Main flow detection algorithm
 */
export const detectFlowState = (userData) => {
  const {
    keystrokePattern = [],
    taskSwitches = 0,
    sessionDuration = 0,
    appUsage = [],
    actualDuration = 0,
    perceivedDuration = null,
    taskDifficulty = 5,
    userSkillLevel = 5,
    completionRate = 0,
    activityData = {},
    interruptions = [],
    completedTasks = 0,
    totalTasks = 1
  } = userData;
  
  // Calculate individual indicators
  const indicators = {
    typingConsistency: analyzeTypingConsistency(keystrokePattern),
    taskFocus: analyzeTaskFocus(taskSwitches, sessionDuration, appUsage),
    timePerception: analyzeTimePerception(actualDuration, perceivedDuration),
    challengeSkillBalance: analyzeChallengeSkillBalance(taskDifficulty, userSkillLevel, completionRate),
    activityIntensity: analyzeActivityIntensity(activityData, sessionDuration),
    interruptionResistance: analyzeInterruptionResistance(interruptions, sessionDuration),
    progressMomentum: analyzeProgressMomentum(completedTasks, totalTasks, sessionDuration)
  };
  
  // Calculate weighted flow score
  let flowScore = 0;
  let totalWeight = 0;
  
  Object.entries(FLOW_INDICATORS).forEach(([key, config]) => {
    const indicatorKey = key.toLowerCase().replace(/_/g, '');
    const indicatorValue = indicators[indicatorKey] || 0;
    
    // Only include indicators that meet minimum threshold
    if (indicatorValue >= config.threshold) {
      flowScore += indicatorValue * config.weight;
      totalWeight += config.weight;
    }
  });
  
  // Normalize score
  const normalizedScore = totalWeight > 0 ? flowScore / totalWeight : 0;
  
  // Flow state determination
  const isInFlow = normalizedScore >= 0.7 && totalWeight >= 0.5; // Need majority of indicators
  const flowIntensity = Math.min(1, normalizedScore);
  
  return {
    isInFlow,
    flowScore: normalizedScore,
    flowIntensity,
    indicators,
    confidence: totalWeight,
    recommendations: generateFlowRecommendations(indicators, normalizedScore)
  };
};

/**
 * Generates recommendations to improve or maintain flow
 */
export const generateFlowRecommendations = (indicators, flowScore) => {
  const recommendations = [];
  
  if (indicators.typingConsistency < 0.5) {
    recommendations.push({
      type: 'typing',
      message: 'Try to maintain a steady typing rhythm to improve focus',
      priority: 'medium'
    });
  }
  
  if (indicators.taskFocus < 0.6) {
    recommendations.push({
      type: 'focus',
      message: 'Minimize task switching and close unnecessary applications',
      priority: 'high'
    });
  }
  
  if (indicators.challengeSkillBalance < 0.5) {
    recommendations.push({
      type: 'difficulty',
      message: 'Consider adjusting task difficulty to better match your skill level',
      priority: 'medium'
    });
  }
  
  if (indicators.activityIntensity < 0.4) {
    recommendations.push({
      type: 'engagement',
      message: 'Increase engagement with the task - try active note-taking or coding',
      priority: 'medium'
    });
  }
  
  if (indicators.interruptionResistance < 0.7) {
    recommendations.push({
      type: 'distraction',
      message: 'Enable stricter distraction blocking to protect your focus',
      priority: 'high'
    });
  }
  
  if (flowScore >= 0.8) {
    recommendations.push({
      type: 'flow',
      message: 'Excellent flow state! Consider extending your session if possible',
      priority: 'positive'
    });
  }
  
  return recommendations;
};

/**
 * Tracks flow state over time for trend analysis
 */
export class FlowTracker {
  constructor() {
    this.sessions = [];
    this.currentSession = null;
  }
  
  startSession(sessionId) {
    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      flowEvents: [],
      maxFlowScore: 0,
      totalFlowTime: 0,
      flowStateCount: 0
    };
  }
  
  recordFlowState(flowData) {
    if (!this.currentSession) return;
    
    const event = {
      timestamp: Date.now(),
      ...flowData
    };
    
    this.currentSession.flowEvents.push(event);
    
    if (flowData.isInFlow) {
      this.currentSession.flowStateCount++;
      this.currentSession.totalFlowTime += 30; // Assuming 30-second intervals
    }
    
    if (flowData.flowScore > this.currentSession.maxFlowScore) {
      this.currentSession.maxFlowScore = flowData.flowScore;
    }
  }
  
  endSession() {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.sessions.push(this.currentSession);
      this.currentSession = null;
    }
  }
  
  getFlowInsights() {
    if (this.sessions.length === 0) return null;
    
    const recentSessions = this.sessions.slice(-10); // Last 10 sessions
    
    const avgFlowTime = recentSessions.reduce((sum, s) => sum + s.totalFlowTime, 0) / recentSessions.length;
    const avgMaxFlow = recentSessions.reduce((sum, s) => sum + s.maxFlowScore, 0) / recentSessions.length;
    const flowTrend = this.calculateFlowTrend(recentSessions);
    
    return {
      averageFlowTime: avgFlowTime,
      averageMaxFlowScore: avgMaxFlow,
      flowTrend,
      totalSessions: this.sessions.length,
      bestFlowSession: this.sessions.reduce((best, current) => 
        current.maxFlowScore > best.maxFlowScore ? current : best
      )
    };
  }
  
  calculateFlowTrend(sessions) {
    if (sessions.length < 2) return 'insufficient_data';
    
    const firstHalf = sessions.slice(0, Math.floor(sessions.length / 2));
    const secondHalf = sessions.slice(Math.floor(sessions.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, s) => sum + s.maxFlowScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.maxFlowScore, 0) / secondHalf.length;
    
    const improvement = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (improvement > 10) return 'improving';
    if (improvement < -10) return 'declining';
    return 'stable';
  }
}