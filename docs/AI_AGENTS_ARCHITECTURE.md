# FizzTask AI Agents Architecture

## Overview
FizzTask implements a multi-agent system to provide intelligent productivity assistance. The system uses specialized agents that collaborate to help users manage tasks, plan focus sessions, analyze emails, and receive personalized coaching.

## Agent Design Patterns Used

### 1. **Multi-Agent Collaboration**
- Multiple specialized agents work together
- Each agent has a specific domain expertise
- Agents can be invoked independently or orchestrated together

### 2. **Tool Use Pattern**
- Agents can access database models (Tasks, Emails, FocusSessions)
- Integration with OpenAI for intelligence
- Agents can invoke other agents as tools

### 3. **Orchestration Pattern**
- `AgentOrchestrator` coordinates multiple agents
- Implements complex workflows like daily planning
- Manages agent communication and data flow

### 4. **Specialization Pattern**
- Each agent has a focused role:
  - Task Prioritization
  - Focus Session Planning
  - Email Intelligence
  - Productivity Coaching

## Agent Types

### 1. Task Prioritization Agent
**Purpose**: Analyzes and prioritizes tasks based on multiple factors

**Capabilities**:
- Considers urgency, importance, energy requirements
- Applies Eisenhower Matrix principles
- Factors in user's current energy level
- Suggests optimal task order

**Input**: List of tasks, user context
**Output**: Prioritized task list with reasoning

### 2. Focus Session Planner Agent
**Purpose**: Creates optimal focus session plans

**Capabilities**:
- Groups related tasks for better flow
- Applies Pomodoro or Deep Work principles
- Considers cognitive load
- Suggests break activities

**Input**: Available tasks, user preferences
**Output**: Session plan with duration, tasks, and tips

### 3. Email Intelligence Agent
**Purpose**: Extracts actionable insights from emails

**Capabilities**:
- Extracts tasks with clear next steps
- Identifies deadlines and follow-ups
- Assesses priority based on content
- Suggests responses when needed

**Input**: Email content
**Output**: Extracted tasks, follow-up needs, key points

### 4. Productivity Coach Agent
**Purpose**: Provides personalized productivity insights

**Capabilities**:
- Analyzes work patterns
- Identifies potential burnout risks
- Suggests improvements
- Provides encouragement

**Input**: User stats, recent activity
**Output**: Insights, recommendations, motivational messages

## API Endpoints

### Daily Planning
```
POST /api/agents/daily-plan
```
Generates a comprehensive daily plan using all agents

### Task Prioritization
```
POST /api/agents/prioritize-tasks
```
Get AI-powered task prioritization

### Focus Session Planning
```
POST /api/agents/plan-focus-session
```
Get personalized focus session recommendations

### Email Analysis
```
POST /api/agents/analyze-email
```
Extract tasks and insights from emails

### Productivity Insights
```
GET /api/agents/productivity-insights
```
Get personalized coaching insights

### Task Enhancement
```
POST /api/agents/enhance-task
```
Enhance basic task info with AI

## Implementation Details

### Agent Base Class
```javascript
class Agent {
  constructor(name, role, instructions, tools = []) {
    this.name = name;
    this.role = role;
    this.instructions = instructions;
    this.tools = tools;
    this.model = "gpt-3.5-turbo";
  }

  async execute(input, context = {}) {
    // Executes agent with OpenAI
  }
}
```

### Orchestration Flow
1. **Email Analysis**: Extract tasks from unprocessed emails
2. **Task Collection**: Combine email tasks with existing tasks
3. **Prioritization**: Apply intelligent prioritization
4. **Session Planning**: Create optimal focus sessions
5. **Coaching**: Provide personalized insights

## Frontend Integration

### AI Assistant Component
Located at: `/frontend/src/components/agents/AIAssistant.js`

Features:
- Generate daily plans
- View prioritized tasks
- Get focus session recommendations
- See extracted email tasks
- Receive coaching insights

### User Flow
1. User opens AI Assistant page
2. Clicks "Generate AI Daily Plan"
3. System analyzes emails, tasks, and user context
4. Presents comprehensive plan with:
   - Prioritized task list
   - Recommended focus session
   - New tasks from emails
   - Productivity insights

## Security Considerations

1. **API Key Protection**: OpenAI key stored in environment variables
2. **User Data Isolation**: Agents only access authenticated user's data
3. **Rate Limiting**: API endpoints should be rate-limited
4. **Input Validation**: All agent inputs are validated

## Future Enhancements

### 1. Learning Agents
- Agents that learn from user feedback
- Personalization based on historical data
- Adaptive recommendations

### 2. Collaborative Agents
- Team-based productivity agents
- Shared task coordination
- Meeting scheduling optimization

### 3. Integration Agents
- Calendar integration for better planning
- Slack/Teams integration for communication
- Project management tool integration

### 4. Specialized Agents
- Writing assistant for emails/documents
- Code review agent for developers
- Research agent for information gathering

## Configuration

### Environment Variables
```
OPENAI_API_KEY=your_openai_api_key
```

### Agent Models
Currently using `gpt-3.5-turbo` for cost efficiency
Can upgrade to `gpt-4` for better performance

## Testing Agents

1. **Unit Tests**: Test individual agent responses
2. **Integration Tests**: Test agent orchestration
3. **User Testing**: Validate recommendations make sense
4. **Performance**: Monitor API response times

## Best Practices

1. **Clear Instructions**: Each agent has specific, detailed instructions
2. **Structured Output**: Agents return JSON for easy parsing
3. **Error Handling**: Graceful fallbacks if AI fails
4. **Context Awareness**: Agents consider user state and preferences
5. **Explainability**: Agents provide reasoning for recommendations