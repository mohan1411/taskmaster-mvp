/**
 * Reliable Email Task Extractor
 * 
 * This is a simplified but robust implementation for task extraction.
 * Save this as reliable-task-extractor.js in your backend folder.
 */

const axios = require('axios');
const fs = require('fs');

// Logging setup for debugging
const LOG_ENABLED = true;
const LOG_FILE = 'task-extraction.log';

// Helper function for logging
function log(message) {
  if (!LOG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(message);
  
  try {
    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (err) {
    console.error('Could not write to log file:', err.message);
  }
}

/**
 * Extracts tasks from an email using OpenAI API
 * @param {Object} email - Email object with sender, subject, receivedAt, and body
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<Array>} - Array of extracted tasks
 */
async function extractTasksFromEmail(email, apiKey) {
  if (!apiKey) {
    log('ERROR: No API key provided');
    return [];
  }
  
  try {
    log(`Processing email: ${email.subject}`);
    
    // Create the simplest possible prompt that works reliably
    const prompt = `
    Extract tasks from this email. For each task, include title, priority (high/medium/low), due date (YYYY-MM-DD if mentioned), and category.

    FROM: ${email.sender.name} <${email.sender.email}>
    SUBJECT: ${email.subject}
    DATE: ${email.receivedAt}

    ${email.body}
    `;
    
    log('Making API request to OpenAI...');
    
    // Make API request with explicit timeout and error handling
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo", // Most widely available model
        messages: [
          {
            role: "system",
            content: "You extract tasks from emails and return them in JSON format. Always return a valid JSON array of task objects with title, priority, dueDate, and category fields."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.1, // Low temperature for more consistent results
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 15000, // 15 second timeout
      }
    );
    
    log(`API response received. Status: ${response.status}`);
    
    // Extract response content
    const responseText = response.data.choices[0].message.content.trim();
    log(`Response length: ${responseText.length} characters`);
    log(`Response preview: ${responseText.substring(0, 100)}...`);
    
    // Create default fallback task in case parsing fails
    const fallbackTask = [{
      title: "Review email content",
      description: "Please review this email manually.",
      priority: "medium",
      dueDate: null,
      category: "Email Follow-up"
    }];
    
    // Try multiple parsing approaches - from most to least likely
    try {
      // Approach 1: Direct JSON parsing
      try {
        if (responseText.startsWith('[') && responseText.endsWith(']')) {
          const tasks = JSON.parse(responseText);
          if (Array.isArray(tasks) && tasks.length > 0) {
            log(`Successfully parsed ${tasks.length} tasks directly`);
            return validateTasks(tasks);
          }
        }
      } catch (directParseError) {
        log(`Direct JSON parsing failed: ${directParseError.message}`);
      }
      
      // Approach 1.5: Remove markdown code block formatting if present
      try {
        if (responseText.includes('```json') || responseText.includes('```')) {
          // Remove markdown code block markers
          const cleanedText = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
          
          log(`Found markdown code block, attempting to parse cleaned text: ${cleanedText.substring(0, 50)}...`);
          
          if (cleanedText.startsWith('[') && cleanedText.endsWith(']')) {
            const tasks = JSON.parse(cleanedText);
            if (Array.isArray(tasks) && tasks.length > 0) {
              log(`Successfully parsed ${tasks.length} tasks from markdown code block`);
              return validateTasks(tasks);
            }
          }
        }
      } catch (markdownError) {
        log(`Markdown cleaning parsing failed: ${markdownError.message}`);
      }
      
      // Approach 2: Find JSON array in text
      try {
        const arrayMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
        if (arrayMatch) {
          const tasks = JSON.parse(arrayMatch[0]);
          if (Array.isArray(tasks) && tasks.length > 0) {
            log(`Extracted ${tasks.length} tasks from JSON array match`);
            return validateTasks(tasks);
          }
        }
      } catch (arrayMatchError) {
        log(`JSON array extraction failed: ${arrayMatchError.message}`);
      }
      
      // Approach 3: Find individual JSON objects
      try {
        const objectMatches = [...responseText.matchAll(/\{\s*"[^"]+"\s*:.*?\}/gs)];
        if (objectMatches.length > 0) {
          const tasks = objectMatches.map(match => {
            try {
              return JSON.parse(match[0]);
            } catch (e) {
              return null;
            }
          }).filter(task => task !== null);
          
          if (tasks.length > 0) {
            log(`Extracted ${tasks.length} individual task objects`);
            return validateTasks(tasks);
          }
        }
      } catch (objectMatchError) {
        log(`Individual object extraction failed: ${objectMatchError.message}`);
      }
      
      // If we got this far, no parsing approach worked
      log('All parsing approaches failed. Using fallback task.');
      return fallbackTask;
    } catch (parsingError) {
      log(`Unexpected error during parsing: ${parsingError.message}`);
      return fallbackTask;
    }
  } catch (error) {
    log(`Error calling OpenAI API: ${error.message}`);
    
    if (error.response) {
      log(`Status: ${error.response.status}`);
      log(`Data: ${JSON.stringify(error.response.data)}`);
    }
    
    // Return empty array on failure
    return [];
  }
}

/**
 * Validates and normalizes tasks
 * @param {Array} tasks - Array of task objects
 * @returns {Array} - Array of validated and normalized task objects
 */
function validateTasks(tasks) {
  return tasks.map(task => {
    // Ensure all required fields exist with sensible defaults
    return {
      title: task.title || "Untitled Task",
      description: task.description || "",
      priority: ['high', 'medium', 'low'].includes(task.priority?.toLowerCase?.()) 
        ? task.priority.toLowerCase() 
        : "medium",
      dueDate: task.dueDate || null,
      category: task.category || "Email Task"
    };
  });
}

module.exports = { extractTasksFromEmail };
