/**
 * Super Simple Task Extractor
 * 
 * This is an extremely simplified version that focuses on reliability
 * over features. Save as direct-task-test.js in your backend folder.
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

// Get API key from .env file
const apiKey = process.env.OPENAI_API_KEY;
console.log(`API key found: ${apiKey ? 'Yes' : 'No'}`);

// Simple, direct prompt
const simplePrompt = `
Extract tasks from this email:

Subject: Project Updates and Action Items

Hi Team,

Please complete these tasks:
1. Submit the Q2 report by Friday
2. Review the client proposal
3. Schedule team meeting for next week

Thanks,
Manager
`;

// Write logs to file for detailed debugging
const logFile = 'task-extraction-debug.log';
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
};

// Clear log file
fs.writeFileSync(logFile, '--- Task Extraction Debug Log ---\n');

async function testExtraction() {
  log('Starting simple extractor test');
  
  try {
    // First, test if we can make any API call to OpenAI
    log('Testing basic OpenAI API connectivity...');
    
    const basicResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo", // Use the most widely available model
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Say hello" }
        ],
        max_tokens: 10,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    log(`Basic API test successful, status: ${basicResponse.status}`);
    log(`API response: ${JSON.stringify(basicResponse.data)}`);
    
    // Now test task extraction
    log('Testing task extraction...');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo", // Using the most reliable model
        messages: [
          { 
            role: "system", 
            content: "Extract tasks from emails and output them in a JSON format with title, priority, dueDate, and category fields." 
          },
          { role: "user", content: simplePrompt }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    log(`Task extraction API call successful, status: ${response.status}`);
    
    // Get the response content
    const responseText = response.data.choices[0].message.content.trim();
    log(`Raw API response: ${responseText}`);
    
    // Log token usage for billing/quota checking
    log(`Completion tokens: ${response.data.usage.completion_tokens}`);
    log(`Prompt tokens: ${response.data.usage.prompt_tokens}`);
    log(`Total tokens: ${response.data.usage.total_tokens}`);
    
    // Try to parse as JSON
    try {
      const tasks = JSON.parse(responseText);
      log(`Successfully parsed response as JSON: ${JSON.stringify(tasks, null, 2)}`);
      return true;
    } catch (parseError) {
      log(`Error parsing response as direct JSON: ${parseError.message}`);
      
      // Try to find JSON in the text
      try {
        const jsonMatch = responseText.match(/\{.*\}|\[.*\]/s);
        if (jsonMatch) {
          const potentialJson = jsonMatch[0];
          log(`Found potential JSON: ${potentialJson}`);
          
          const tasks = JSON.parse(potentialJson);
          log(`Successfully parsed extracted JSON: ${JSON.stringify(tasks, null, 2)}`);
          return true;
        } else {
          log('Could not find valid JSON in response');
        }
      } catch (extractError) {
        log(`Error extracting JSON: ${extractError.message}`);
      }
      
      // As a last resort, let's apply some cleanup and try again
      try {
        // Remove all text before first { or [
        const cleanedText = responseText.replace(/^[^{\[]*/, '');
        // Remove all text after last } or ]
        const finalText = cleanedText.replace(/[^}\]]*$/, '');
        
        log(`Cleaned text for parsing: ${finalText}`);
        
        const tasks = JSON.parse(finalText);
        log(`Successfully parsed cleaned JSON: ${JSON.stringify(tasks, null, 2)}`);
        return true;
      } catch (cleanupError) {
        log(`Final JSON parsing attempt failed: ${cleanupError.message}`);
      }
    }
    
    return false;
  } catch (error) {
    log(`ERROR: API request failed: ${error.message}`);
    
    if (error.response) {
      log(`Status: ${error.response.status}`);
      log(`Response data: ${JSON.stringify(error.response.data)}`);
      
      // Check for common error types
      if (error.response.status === 401) {
        log('ERROR: Authentication failed - your API key is likely invalid or expired');
      } else if (error.response.status === 429) {
        log('ERROR: Rate limit or quota exceeded - check your OpenAI account');
      } else if (error.response.status === 404) {
        log('ERROR: Model not found - the requested model may not be available to your account');
      }
    } else if (error.request) {
      log('ERROR: No response received - check your internet connection');
    }
    
    return false;
  }
}

// Run the test
testExtraction()
  .then(success => {
    if (success) {
      log('TEST SUCCESSFUL: Task extraction is working!');
      log('Check the log file for details on the extracted tasks.');
    } else {
      log('TEST FAILED: Task extraction failed.');
      log('Check the log file for detailed error information.');
    }
  })
  .catch(err => {
    log(`Unexpected error: ${err.message}`);
  });
