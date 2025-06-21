const { OpenAI } = require('openai');
const Task = require('../models/taskModel');
const FocusSession = require('../models/focusSessionModel');
const Email = require('../models/emailModel');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Base Agent class for FizzTask
 */
class Agent {
  constructor(name, role, instructions, tools = []) {
    this.name = name;
    this.role = role;
    this.instructions = instructions;
    this.tools = tools;
    this.model = "gpt-3.5-turbo";
  }

  async execute(input, context = {}) {
    try {
      const messages = [
        { role: "system", content: this.instructions },
        { role: "user", content: JSON.stringify({ input, context }) }
      ];

      const response = await openai.chat.completions.create({
        model: this.model,
        messages,
        tools: this.tools.length > 0 ? this.tools : undefined,
        tool_choice: this.tools.length > 0 ? "auto" : undefined,
      });

      return this.processResponse(response);
    } catch (error) {
      console.error(`Agent ${this.name} error:`, error);
      throw error;
    }
  }

  processResponse(response) {
    const message = response.choices[0].message;
    
    if (message.tool_calls) {
      // Handle tool calls
      return {
        type: 'tool_calls',
        calls: message.tool_calls,
        content: message.content
      };
    }

    return {
      type: 'message',
      content: message.content
    };
  }
}

/**
 * Task Prioritization Agent
 * Analyzes tasks and suggests optimal order based on various factors
 */
class TaskPrioritizationAgent extends Agent {
  constructor() {
    super(
      "TaskPrioritizer",
      "Task Prioritization Specialist",
      `You are an expert at task prioritization. You analyze tasks based on:
      - Urgency (due dates, deadlines)
      - Importance (impact, consequences)
      - Energy requirements (cognitive load, complexity)
      - Dependencies (what needs to be done first)
      - User's current energy level and time available
      
      You suggest the optimal order for completing tasks and explain your reasoning.
      Consider the Eisenhower Matrix, energy management principles, and productivity best practices.
      
      Output format:
      {
        "prioritizedTasks": [
          {
            "taskId": "xxx",
            "title": "Task title",
            "priority": 1,
            "reasoning": "Why this task should be done first/next",
            "estimatedEnergy": "low/medium/high",
            "bestTimeSlot": "morning/afternoon/evening"
          }
        ],
        "generalAdvice": "Overall strategy for the day"
      }`
    );
  }

  async prioritizeTasks(tasks, userContext) {
    const input = {
      tasks: tasks.map(t => ({
        id: t._id,
        title: t.title,
        description: t.description,
        dueDate: t.dueDate,
        priority: t.priority,
        category: t.category,
        estimatedDuration: t.estimatedDuration,
        tags: t.tags
      })),
      userContext: {
        currentEnergy: userContext.energyLevel || 5,
        availableTime: userContext.availableHours || 8,
        currentTime: new Date().toISOString(),
        preferences: userContext.preferences || {}
      }
    };

    const response = await this.execute(input);
    return JSON.parse(response.content);
  }
}

/**
 * Focus Session Planning Agent
 * Creates optimal focus session plans based on tasks and user state
 */
class FocusSessionPlannerAgent extends Agent {
  constructor() {
    super(
      "FocusPlanner",
      "Focus Session Strategist",
      `You are an expert at planning productive focus sessions. You:
      - Group related tasks for better flow
      - Consider cognitive load and task switching costs
      - Apply Pomodoro or Deep Work principles appropriately
      - Factor in user's energy patterns and preferences
      - Suggest break activities and timing
      
      Output format:
      {
        "sessionPlan": {
          "recommendedDuration": 25/45/90,
          "sessionType": "pomodoro/deep-work/custom",
          "tasks": ["taskId1", "taskId2"],
          "breakSuggestions": ["5 min walk", "stretching"],
          "focusTips": ["specific tips for this session"],
          "expectedOutcome": "What should be accomplished"
        },
        "reasoning": "Why this plan makes sense"
      }`
    );
  }

  async planSession(availableTasks, userPreferences) {
    const input = {
      tasks: availableTasks,
      preferences: userPreferences,
      timeOfDay: new Date().getHours(),
      recentSessions: userPreferences.recentSessions || []
    };

    const response = await this.execute(input);
    return JSON.parse(response.content);
  }
}

/**
 * Email Intelligence Agent
 * Analyzes emails for actionable items and deadlines
 */
class EmailIntelligenceAgent extends Agent {
  constructor() {
    super(
      "EmailAnalyzer",
      "Email Intelligence Specialist",
      `You are an expert at analyzing emails for productivity insights. You:
      - Extract actionable tasks with clear next steps
      - Identify deadlines and time-sensitive items
      - Detect follow-up requirements
      - Assess priority based on sender and content
      - Recognize project-related information
      - Flag important decisions needed
      
      Output format:
      {
        "extractedTasks": [
          {
            "title": "Clear task title",
            "description": "Detailed description",
            "dueDate": "ISO date string or null",
            "priority": "low/medium/high/urgent",
            "category": "work/personal/health/learning/other",
            "source": "email snippet that led to this task"
          }
        ],
        "followUpNeeded": true/false,
        "followUpDate": "ISO date string or null",
        "urgencyLevel": "immediate/soon/eventual/none",
        "keyPoints": ["main points from the email"],
        "suggestedResponse": "Brief suggested response if needed"
      }`
    );
  }

  async analyzeEmail(email) {
    const input = {
      subject: email.subject,
      sender: email.sender,
      body: email.body || email.snippet,
      receivedAt: email.receivedAt
    };

    const response = await this.execute(input);
    return JSON.parse(response.content);
  }
}

/**
 * Productivity Coach Agent
 * Provides personalized productivity advice and insights
 */
class ProductivityCoachAgent extends Agent {
  constructor() {
    super(
      "ProductivityCoach",
      "Personal Productivity Coach",
      `You are a supportive and insightful productivity coach. You:
      - Analyze work patterns and suggest improvements
      - Provide encouragement and motivation
      - Identify potential burnout risks
      - Suggest work-life balance improvements
      - Offer specific, actionable advice
      - Celebrate achievements and progress
      
      Your tone is friendly, supportive, and practical. Avoid being preachy.
      
      Output format:
      {
        "insights": [
          {
            "type": "pattern/achievement/concern/suggestion",
            "message": "Specific insight",
            "recommendation": "What to do about it"
          }
        ],
        "motivationalMessage": "Personalized encouragement",
        "topPriority": "One key thing to focus on",
        "progressHighlight": "Something they're doing well"
      }`
    );
  }

  async provideCoaching(userStats, recentActivity) {
    const input = {
      stats: userStats,
      recentActivity: recentActivity,
      date: new Date().toISOString()
    };

    const response = await this.execute(input);
    return JSON.parse(response.content);
  }
}

/**
 * Agent Orchestrator
 * Coordinates multiple agents for complex workflows
 */
class AgentOrchestrator {
  constructor() {
    this.agents = {
      prioritizer: new TaskPrioritizationAgent(),
      focusPlanner: new FocusSessionPlannerAgent(),
      emailAnalyzer: new EmailIntelligenceAgent(),
      coach: new ProductivityCoachAgent()
    };
  }

  /**
   * Daily Planning Workflow
   * Uses multiple agents to create a comprehensive daily plan
   */
  async createDailyPlan(userId, tasks, emails, userContext) {
    try {
      // Step 1: Analyze emails for new tasks
      const emailTasks = [];
      for (const email of emails.slice(0, 5)) { // Limit to recent 5 emails
        const analysis = await this.agents.emailAnalyzer.analyzeEmail(email);
        emailTasks.push(...analysis.extractedTasks);
      }

      // Step 2: Combine with existing tasks and prioritize
      const allTasks = [...tasks, ...emailTasks];
      const prioritization = await this.agents.prioritizer.prioritizeTasks(
        allTasks, 
        userContext
      );

      // Step 3: Plan focus sessions for high-priority tasks
      const topTasks = prioritization.prioritizedTasks.slice(0, 5);
      const sessionPlan = await this.agents.focusPlanner.planSession(
        topTasks,
        userContext.preferences
      );

      // Step 4: Get coaching insights
      const coaching = await this.agents.coach.provideCoaching(
        userContext.stats,
        userContext.recentActivity
      );

      return {
        dailyPlan: {
          prioritizedTasks: prioritization.prioritizedTasks,
          focusSession: sessionPlan.sessionPlan,
          newTasksFromEmail: emailTasks,
          coachingInsights: coaching,
          createdAt: new Date()
        }
      };
    } catch (error) {
      console.error('Agent orchestration error:', error);
      throw error;
    }
  }

  /**
   * Smart Task Creation
   * Uses AI to enhance task creation with better details
   */
  async enhanceTaskCreation(basicTaskInfo, userContext) {
    const enhancer = new Agent(
      "TaskEnhancer",
      "Task Enhancement Specialist",
      `You enhance basic task information with:
      - Better, actionable titles
      - Detailed steps in description
      - Realistic time estimates
      - Appropriate categorization
      - Helpful tags
      - Smart due date suggestions
      
      Output a complete task object with all fields enhanced.`
    );

    const response = await enhancer.execute({
      basicInfo: basicTaskInfo,
      userPatterns: userContext.patterns,
      currentWorkload: userContext.workload
    });

    return JSON.parse(response.content);
  }
}

// Export agents and orchestrator
module.exports = {
  Agent,
  TaskPrioritizationAgent,
  FocusSessionPlannerAgent,
  EmailIntelligenceAgent,
  ProductivityCoachAgent,
  AgentOrchestrator
};