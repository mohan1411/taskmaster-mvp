require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

// Create a dedicated log file
const logFile = 'task-diagnostic.log';
fs.writeFileSync(logFile, '=== TASK EXTRACTION DIAGNOSTIC LOG ===\n\n', { flag: 'w' });

// Logging helper
function log(message) {
  const entry = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logFile, entry);
  console.log(message);
}

// Sample email for testing
const testEmail = {
  sender: { name: 'Test Sender', email: 'test@example.com' },
  subject: 'Project Updates for Next Week',
  receivedAt: new Date().toISOString(),
  body: 'Please submit the report by Friday and schedule the team meeting for next Monday. Also, don\'t forget to follow up with the client about their feedback.'
};

// Test the complete extraction process
async function runDiagnostic() {
  log('=== STARTING DIAGNOSTIC ===');
  
  // Step 1: Check environment
  const apiKey = process.env.OPENAI_API_KEY;
  log(`API Key available: ${apiKey ? 'Yes (starts with ' + apiKey.substring(0, 3) + '...)' : 'No'}`);
  
  if (!apiKey) {
    log('ERROR: No API key found. Please check your .env file.');
    return;
  }
  
  // Step 2: Test OpenAI API directly
  try {
    log('Making test API call to OpenAI...');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You extract tasks from emails. Return them as a JSON array with the following fields for each task: title, description (optional), priority (high, medium, low), dueDate (optional), category."
          },
          { 
            role: "user", 
            content: `Extract tasks from this email:\nSubject: ${testEmail.subject}\nBody: ${testEmail.body}`
          }
        ],
        temperature: 0.1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    log(`API call successful. Status: ${response.status}`);
    
    // Step 3: Process response
    const responseContent = response.data.choices[0].message.content;
    log(`Raw response: ${responseContent}`);
    
    // Step A: Try direct parsing
    try {
      log('Attempting direct JSON parsing...');
      const directTasks = JSON.parse(responseContent);
      log(`Direct parsing successful! Found ${directTasks.length} tasks.`);
      log(`Parsed tasks: ${JSON.stringify(directTasks, null, 2)}`);
    } catch (directError) {
      log(`Direct parsing failed: ${directError.message}`);
    }
    
    // Step B: Try parsing after markdown cleanup
    try {
      log('Cleaning markdown formatting...');
      const cleanedResponse = responseContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      log(`Cleaned response: ${cleanedResponse}`);
      
      const cleanedTasks = JSON.parse(cleanedResponse);
      log(`Markdown cleaning successful! Found ${cleanedTasks.length} tasks.`);
      log(`Cleaned tasks: ${JSON.stringify(cleanedTasks, null, 2)}`);
      
      // Step 4: Validate and standardize tasks
      log('Validating and standardizing tasks...');
      const validatedTasks = cleanedTasks.map(task => ({
        title: task.title || "Untitled Task",
        description: task.description || "",
        priority: ['high', 'medium', 'low'].includes(task.priority?.toLowerCase()) 
          ? task.priority.toLowerCase() 
          : "medium",
        dueDate: task.dueDate || null,
        category: task.category || "Email Task"
      }));
      
      log(`Validated tasks: ${JSON.stringify(validatedTasks, null, 2)}`);
      log('Diagnostic completed successfully!');
    } catch (cleanedError) {
      log(`Markdown cleaning parsing failed: ${cleanedError.message}`);
      
      // Step C: Try regex extraction as last resort
      try {
        log('Attempting regex extraction...');
        const jsonMatch = responseContent.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          const jsonContent = jsonMatch[0];
          log(`Found JSON content via regex: ${jsonContent}`);
          
          const regexTasks = JSON.parse(jsonContent);
          log(`Regex extraction successful! Found ${regexTasks.length} tasks.`);
        } else {
          log('No JSON array pattern found in response.');
        }
      } catch (regexError) {
        log(`Regex extraction failed: ${regexError.message}`);
      }
    }
  } catch (apiError) {
    log(`ERROR calling OpenAI API: ${apiError.message}`);
    if (apiError.response) {
      log(`Response status: ${apiError.response.status}`);
      log(`Response data: ${JSON.stringify(apiError.response.data)}`);
    }
  }
  
  log('=== DIAGNOSTIC COMPLETE ===');
  log(`Check the complete log file at: ${logFile}`);
}

// Run the diagnostic
runDiagnostic();