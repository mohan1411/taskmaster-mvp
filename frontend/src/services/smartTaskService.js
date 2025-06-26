// Smart task selection service for intelligent focus session planning
import { differenceInHours, parseISO, startOfDay, isAfter, isBefore } from 'date-fns';

class SmartTaskService {
  constructor() {
    this.weights = {
      priority: 0.3,
      deadline: 0.25,
      complexity: 0.2,
      energy: 0.15,
      context: 0.1
    };
  }

  /**
   * Get smart task recommendations for a focus session
   * @param {Object} params - Selection parameters
   * @param {Array} params.tasks - Available tasks
   * @param {number} params.sessionDuration - Planned session duration in minutes
   * @param {number} params.energyLevel - Current energy level (0-10)
   * @param {string} params.sessionType - Type of session (deep_work, regular, light, creative)
   * @param {Array} params.recentSessions - Recent focus sessions for context
   * @param {Object} params.preferences - User preferences
   * @returns {Array} Sorted and scored task recommendations
   */
  getSmartTaskRecommendations(params) {
    const {
      tasks = [],
      sessionDuration = 60,
      energyLevel = 7,
      sessionType = 'regular',
      recentSessions = [],
      preferences = {}
    } = params;

    // Filter out completed tasks and those that don't fit
    const eligibleTasks = tasks.filter(task => 
      task.status !== 'completed' && 
      task.status !== 'archived' &&
      (!task.estimatedDuration || task.estimatedDuration <= sessionDuration + 30) // Allow some overflow
    );

    // Score each task
    const scoredTasks = eligibleTasks.map(task => {
      const scores = {
        priority: this.calculatePriorityScore(task),
        deadline: this.calculateDeadlineScore(task),
        complexity: this.calculateComplexityScore(task, energyLevel, sessionType),
        energy: this.calculateEnergyMatchScore(task, energyLevel, sessionType),
        context: this.calculateContextScore(task, recentSessions)
      };

      const totalScore = Object.entries(scores).reduce((sum, [key, score]) => 
        sum + (score * this.weights[key]), 0
      );

      return {
        task,
        scores,
        totalScore,
        reasoning: this.generateReasoning(task, scores)
      };
    });

    // Sort by total score
    scoredTasks.sort((a, b) => b.totalScore - a.totalScore);

    // Group tasks that fit well together
    const sessionPlan = this.optimizeTaskGrouping(scoredTasks, sessionDuration);

    return sessionPlan;
  }

  /**
   * Calculate priority-based score
   */
  calculatePriorityScore(task) {
    const priorityScores = {
      high: 1.0,
      medium: 0.6,
      low: 0.3
    };
    return priorityScores[task.priority] || 0.5;
  }

  /**
   * Calculate deadline urgency score
   */
  calculateDeadlineScore(task) {
    if (!task.dueDate) return 0.3; // No deadline = lower urgency

    const now = new Date();
    const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
    const hoursUntilDue = differenceInHours(dueDate, now);

    // Critical: Due in less than 24 hours
    if (hoursUntilDue <= 24 && hoursUntilDue > 0) return 1.0;
    
    // Urgent: Due in 1-3 days
    if (hoursUntilDue <= 72) return 0.8;
    
    // Important: Due this week
    if (hoursUntilDue <= 168) return 0.6;
    
    // Standard: Due in 2 weeks
    if (hoursUntilDue <= 336) return 0.4;
    
    // Future: More than 2 weeks
    return 0.2;
  }

  /**
   * Calculate complexity match score based on energy
   */
  calculateComplexityScore(task, energyLevel, sessionType) {
    const taskComplexity = this.estimateTaskComplexity(task);
    
    // Match complexity to energy level
    const energyComplexityMatch = {
      high: { high: 1.0, medium: 0.7, low: 0.4 },
      medium: { high: 0.6, medium: 1.0, low: 0.7 },
      low: { high: 0.3, medium: 0.6, low: 1.0 }
    };

    const energyCategory = energyLevel >= 8 ? 'high' : energyLevel >= 5 ? 'medium' : 'low';
    
    return energyComplexityMatch[energyCategory][taskComplexity] || 0.5;
  }

  /**
   * Calculate energy match score
   */
  calculateEnergyMatchScore(task, energyLevel, sessionType) {
    const taskEnergyRequirement = this.estimateEnergyRequirement(task);
    
    // Perfect match = 1.0, mismatch reduces score
    const energyDiff = Math.abs(energyLevel - taskEnergyRequirement);
    return Math.max(0, 1 - (energyDiff / 10));
  }

  /**
   * Calculate context switching score
   */
  calculateContextScore(task, recentSessions) {
    if (recentSessions.length === 0) return 0.5;

    // Check if task is related to recent work
    const recentTaskIds = recentSessions
      .flatMap(session => session.tasks?.map(t => t.task?._id || t.task) || [])
      .filter(Boolean);

    const recentCategories = recentSessions
      .flatMap(session => session.tasks?.map(t => t.task?.category) || [])
      .filter(Boolean);

    // Bonus for continuing related work
    if (task.parentTask && recentTaskIds.includes(task.parentTask)) return 0.9;
    if (task.category && recentCategories.includes(task.category)) return 0.8;
    
    // Check for related tags
    if (task.tags && task.tags.length > 0) {
      const recentTags = recentSessions
        .flatMap(session => session.tasks?.flatMap(t => t.task?.tags || []) || [])
        .filter(Boolean);
      
      const hasCommonTags = task.tags.some(tag => recentTags.includes(tag));
      if (hasCommonTags) return 0.7;
    }

    // Default: Some context switching
    return 0.4;
  }

  /**
   * Estimate task complexity
   */
  estimateTaskComplexity(task) {
    let complexityScore = 0;

    // Priority as proxy for complexity
    if (task.priority === 'high') complexityScore += 3;
    else if (task.priority === 'medium') complexityScore += 2;
    else complexityScore += 1;

    // Duration as complexity indicator
    if (task.estimatedDuration >= 90) complexityScore += 3;
    else if (task.estimatedDuration >= 60) complexityScore += 2;
    else complexityScore += 1;

    // Description length (more complex tasks need more explanation)
    if (task.description && task.description.length > 200) complexityScore += 2;
    else if (task.description && task.description.length > 100) complexityScore += 1;

    // Subtasks indicate complexity
    if (task.subtasks && task.subtasks.length > 3) complexityScore += 2;
    else if (task.subtasks && task.subtasks.length > 0) complexityScore += 1;

    // Tags like "complex", "difficult", "research" indicate complexity
    const complexTags = ['complex', 'difficult', 'research', 'analysis', 'design'];
    if (task.tags && task.tags.some(tag => complexTags.includes(tag.toLowerCase()))) {
      complexityScore += 2;
    }

    // Convert to category
    if (complexityScore >= 8) return 'high';
    if (complexityScore >= 5) return 'medium';
    return 'low';
  }

  /**
   * Estimate energy requirement for task
   */
  estimateEnergyRequirement(task) {
    const complexity = this.estimateTaskComplexity(task);
    const baseEnergy = {
      high: 8,
      medium: 6,
      low: 4
    };

    let energy = baseEnergy[complexity] || 6;

    // Adjust based on task type
    if (task.tags) {
      if (task.tags.includes('creative')) energy += 1;
      if (task.tags.includes('routine')) energy -= 1;
      if (task.tags.includes('meeting')) energy -= 1;
    }

    // Urgent tasks require more energy
    if (task.priority === 'high') energy += 1;

    return Math.min(10, Math.max(1, energy));
  }

  /**
   * Optimize task grouping for session
   */
  optimizeTaskGrouping(scoredTasks, sessionDuration) {
    const selected = [];
    let remainingTime = sessionDuration;
    let currentComplexity = null;

    // Try to group similar complexity tasks
    for (const scoredTask of scoredTasks) {
      const task = scoredTask.task;
      const taskDuration = task.estimatedDuration || 30;
      const taskComplexity = this.estimateTaskComplexity(task);

      // Check if task fits in remaining time
      if (taskDuration <= remainingTime + 10) { // Allow slight overflow
        // Prefer tasks of similar complexity to reduce context switching
        if (!currentComplexity || currentComplexity === taskComplexity || selected.length === 0) {
          selected.push(scoredTask);
          remainingTime -= taskDuration;
          currentComplexity = taskComplexity;

          // Stop if we've filled 80% of the session
          if (remainingTime <= sessionDuration * 0.2) break;
        }
      }
    }

    // If we couldn't fill much time, try adding one more small task
    if (remainingTime > sessionDuration * 0.5 && selected.length < 4) {
      const smallTasks = scoredTasks
        .filter(st => !selected.includes(st))
        .filter(st => (st.task.estimatedDuration || 30) <= remainingTime);
      
      if (smallTasks.length > 0) {
        selected.push(smallTasks[0]);
      }
    }

    return selected;
  }

  /**
   * Generate reasoning for task recommendation
   */
  generateReasoning(task, scores) {
    const reasons = [];
    
    if (scores.priority >= 0.8) {
      reasons.push('High priority task');
    }
    
    if (scores.deadline >= 0.8) {
      reasons.push('Urgent deadline');
    }
    
    if (scores.complexity >= 0.8) {
      reasons.push('Matches your current energy level');
    }
    
    if (scores.context >= 0.8) {
      reasons.push('Related to recent work');
    }

    if (reasons.length === 0) {
      reasons.push('Good fit for this session');
    }

    return reasons.join(' • ');
  }

  /**
   * Get session type recommendation based on time and energy
   */
  recommendSessionType(energyLevel, timeOfDay) {
    const hour = timeOfDay || new Date().getHours();
    
    // Morning: High energy, deep work
    if (hour >= 6 && hour <= 10 && energyLevel >= 7) {
      return {
        type: 'deep_work',
        duration: 90,
        reason: 'Morning peak hours - ideal for deep focused work'
      };
    }
    
    // Late morning: Still good energy
    if (hour >= 10 && hour <= 12 && energyLevel >= 6) {
      return {
        type: 'regular',
        duration: 60,
        reason: 'Good energy levels for regular focused work'
      };
    }
    
    // Post-lunch: Lower energy
    if (hour >= 13 && hour <= 15) {
      return {
        type: 'light',
        duration: 45,
        reason: 'Post-lunch period - shorter sessions work better'
      };
    }
    
    // Late afternoon: Recovery
    if (hour >= 15 && hour <= 17 && energyLevel >= 6) {
      return {
        type: 'regular',
        duration: 60,
        reason: 'Afternoon recovery - good for regular tasks'
      };
    }
    
    // Evening: Variable
    if (hour >= 17 && hour <= 22) {
      if (energyLevel >= 7) {
        return {
          type: 'creative',
          duration: 45,
          reason: 'Evening hours - great for creative work'
        };
      }
      return {
        type: 'light',
        duration: 30,
        reason: 'End of day - keep sessions light'
      };
    }
    
    // Late night/early morning
    return {
      type: 'light',
      duration: 25,
      reason: 'Off-peak hours - short focused bursts'
    };
  }

  /**
   * Learn from completed sessions to improve recommendations
   */
  updateLearningModel(sessionData) {
    // This would integrate with a backend ML model
    // For now, we'll store patterns locally
    const patterns = JSON.parse(localStorage.getItem('fizztask-task-patterns') || '{}');
    
    const { tasks, completedTasks, focusScore, energyLevel, timeOfDay } = sessionData;
    
    // Record successful patterns
    if (focusScore >= 80 && completedTasks.length > 0) {
      const pattern = {
        taskTypes: tasks.map(t => this.estimateTaskComplexity(t.task)),
        energyLevel,
        timeOfDay,
        successRate: completedTasks.length / tasks.length,
        focusScore
      };
      
      if (!patterns[energyLevel]) patterns[energyLevel] = [];
      patterns[energyLevel].push(pattern);
      
      // Keep only recent patterns
      if (patterns[energyLevel].length > 50) {
        patterns[energyLevel] = patterns[energyLevel].slice(-50);
      }
      
      localStorage.setItem('fizztask-task-patterns', JSON.stringify(patterns));
    }
  }
}

// Create singleton instance
const smartTaskService = new SmartTaskService();

export default smartTaskService;