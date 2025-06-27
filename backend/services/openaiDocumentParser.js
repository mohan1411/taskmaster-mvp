const { getOpenAI } = require('../utils/openaiHelper');
const config = require('../config/config');

class OpenAIDocumentParser {
  constructor() {
    this.openai = getOpenAI();
  }

  async parseDocument(text, context = {}) {
    if (!this.openai) {
      throw new Error('OpenAI is not configured. Please check your OPENAI_API_KEY.');
    }

    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key is not set in environment variables.');
    }

    try {
      console.log('[OPENAI PARSER] Using OpenAI to extract tasks from document...');
      console.log('[OPENAI PARSER] Document preview (first 500 chars):', text.substring(0, 500));
      
      const prompt = `
You are a task extraction expert. Extract ONLY the main actionable tasks from the following document.

IMPORTANT RULES:
1. Extract only TOP-LEVEL tasks, not sub-items or details
2. Each task should be a complete, standalone action item
3. Include sub-bullets as part of the task description, not as separate tasks
4. A task must be something someone needs to DO, not just information
5. Combine related sub-items into a single task

For each task, provide:
- title: Clear, action-oriented title (the main task)
- description: Include all relevant sub-items and details as a single description
- priority: urgent, high, medium, or low
- dueDate: in ISO format if mentioned
- assignee: if mentioned
- confidence: 0-100 (how confident you are this is a real task)

Format as JSON array:
[
  {
    "title": "Main task title",
    "description": "Details including all sub-items combined",
    "priority": "high",
    "dueDate": "YYYY-MM-DD" or null,
    "assignee": "Person name" or null,
    "confidence": 85,
    "sourceText": "The original text section"
  }
]

Document text:
"""
${text}
"""`;

      const response = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are a task extraction expert. Extract only main actionable tasks, not sub-items. Always respond with valid JSON only."
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        max_tokens: 2000,
        temperature: 0.2,
      });

      const responseText = response.data.choices[0].message.content.trim();
      console.log('OpenAI response received, parsing...');
      
      // Parse the JSON response
      let extractedTasks = [];
      try {
        extractedTasks = JSON.parse(responseText);
        
        if (!Array.isArray(extractedTasks)) {
          console.error('OpenAI response is not an array:', responseText);
          extractedTasks = [];
        }
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        console.error('Response was:', responseText);
        
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          try {
            extractedTasks = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.error('Failed to extract JSON from response');
            extractedTasks = [];
          }
        }
      }

      console.log(`[OPENAI PARSER] Extracted ${extractedTasks.length} main tasks`);
      extractedTasks.forEach((task, index) => {
        console.log(`[OPENAI PARSER] Task ${index + 1}: "${task.title}" (priority: ${task.priority})`);
      });
      
      // Ensure all tasks have required fields and add line numbers
      return extractedTasks.map((task, index) => ({
        title: task.title || 'Untitled Task',
        description: task.description || '',
        priority: task.priority || 'medium',
        dueDate: task.dueDate || null,
        assignee: task.assignee || null,
        confidence: task.confidence || 80,
        sourceText: task.sourceText || '',
        lineNumber: index + 1
      }));
      
    } catch (error) {
      console.error('OpenAI document parsing error:', error);
      
      if (error.response) {
        console.error('OpenAI API error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        if (error.response.status === 401) {
          throw new Error('OpenAI API key is invalid. Please check your OPENAI_API_KEY.');
        } else if (error.response.status === 429) {
          throw new Error('OpenAI API rate limit exceeded. Please try again later.');
        } else if (error.response.status === 500) {
          throw new Error('OpenAI API server error. Please try again later.');
        }
      }
      
      throw new Error(`Failed to parse document with OpenAI: ${error.message}`);
    }
  }
}

module.exports = new OpenAIDocumentParser();
