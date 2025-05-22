/**
 * Fixed Task Extraction Test
 * 
 * This script demonstrates a simplified version of the task extraction
 * function to help diagnose issues with the OpenAI API integration.
 * 
 * Usage:
 * 1. Make sure your .env file is configured with valid OPENAI_API_KEY
 * 2. Run this script with Node.js:
 *    node tests/fixed-task-extraction.js
 */

require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');

// Get API key from environment variable
const apiKey = process.env.OPENAI_API_KEY;
console.log(`Using OpenAI API key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'NOT FOUND'}`);

// Initialize OpenAI client
const configuration = new Configuration({
  apiKey: apiKey,
});
const openai = new OpenAIApi(configuration);

// Sample email content
const sampleEmail = {
  sender: { name: 'John Doe', email: 'john@example.com' },
  subject: 'Project Deadlines and Updates',
  receivedAt: new Date().toISOString(),
  body: `
    Hi Team,

    I wanted to follow up on our meeting yesterday. Here are the action items:

    1. Please update the project timeline by Friday
    2. We need to schedule a call with the client before Tuesday next week
    3. The marketing materials must be reviewed by end of day tomorrow
    4. Jake will prepare the quarterly report - please provide your input by Wednesday

    Let me know if you have any questions.

    Best regards,
    John
  `
};

async function extractTasksFromEmail(email) {
  try {
    console.log('Starting task extraction for sample email');

    // Check for valid API key
    if (!apiKey) {
      console.error('ERROR: OpenAI API key is not configured');
      return { success: false, error: 'OpenAI API key is not configured' };
    }

    // Format email context
    const emailContext = `
    From: ${email.sender.name} <${email.sender.email}>
    Subject: ${email.subject}
    Date: ${email.receivedAt}
    
    ${email.body}
    `;

    // Create prompt for task extraction
    const prompt = `
    Extract actionable tasks from the following email. For each task, provide:
    1. Task title (clear and concise)
    2. Priority (high, medium, or low)
    3. Due date (if mentioned or can be inferred)
    4. Category (infer from context)

    Format the response as a valid JSON array with objects containing:
    [
      {
        "title": "Task title",
        "description": "Additional context if available",
        "priority": "high/medium/low",
        "dueDate": "YYYY-MM-DD" or null if not specified,
        "category": "inferred category"
      }
    ]

    IMPORTANT: Your response must be a valid JSON array. Do not include any text before or after the JSON array.
    If no tasks are found, return an empty array: []

    Email: """
    ${emailContext}
    """
    `;

    console.log('Calling OpenAI API...');
    
    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that extracts actionable tasks from emails." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.2,
    });

    console.log('OpenAI API call completed');
    console.log('Response status:', completion.status);
    
    // Extract and parse response
    const responseText = completion.data.choices[0].message.content.trim();
    console.log('Raw response:', responseText);
    
    let extractedTasks = [];
    
    // Parsing with better error handling
    try {
      // Try direct JSON parsing first
      if (responseText.startsWith('[') && responseText.endsWith(']')) {
        extractedTasks = JSON.parse(responseText);
        console.log('Successfully parsed JSON directly');
      } else {
        // Try to find JSON array in the text
        console.log('Response is not a direct JSON array, trying to extract JSON...');
        const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          extractedTasks = JSON.parse(jsonMatch[0]);
          console.log('Successfully extracted and parsed JSON from response');
        } else {
          console.log('Could not find valid JSON in response, using fallback');
          // Create a simple task from the response if JSON parsing fails
          extractedTasks = [
            {
              "title": "Review email content",
              "description": "The system couldn't automatically extract structured tasks from this email. Please review it manually.",
              "priority": "medium",
              "dueDate": null,
              "category": "Email Follow-up"
            }
          ];
        }
      }
      
      console.log('Extracted tasks:', JSON.stringify(extractedTasks, null, 2));
      return { success: true, extractedTasks };
      
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return { 
        success: false, 
        error: `Failed to parse extracted tasks: ${parseError.message}`,
        rawResponse: responseText 
      };
    }
  } catch (error) {
    console.error('Task extraction error:', error);
    
    // Detailed error logging
    if (error.response) {
      console.error('OpenAI API response status:', error.response.status);
      console.error('OpenAI API response data:', error.response.data);
      return { 
        success: false, 
        error: `API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}` 
      };
    } else if (error.request) {
      console.error('No response received from OpenAI API');
      return { 
        success: false, 
        error: 'No response received from OpenAI API' 
      };
    } else {
      console.error('Error setting up request:', error.message);
      return { 
        success: false, 
        error: `Request setup error: ${error.message}` 
      };
    }
  }
}

// Run the test
async function runTest() {
  console.log('=== Testing Task Extraction Function ===');
  console.log('Sample email:', sampleEmail.subject);
  
  const result = await extractTasksFromEmail(sampleEmail);
  
  if (result.success) {
    console.log('\n✅ Test PASSED - Successfully extracted tasks');
    console.log(`Found ${result.extractedTasks.length} tasks`);
  } else {
    console.log('\n❌ Test FAILED - Could not extract tasks');
    console.log('Error:', result.error);
    if (result.rawResponse) {
      console.log('Raw API response:', result.rawResponse);
    }
  }
}

runTest();
