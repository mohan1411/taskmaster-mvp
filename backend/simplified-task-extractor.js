/**
 * Simplified Task Extractor
 * 
 * This file contains a simplified implementation of the task extraction functionality
 * without any dependencies on the main application. Use this to directly extract tasks
 * from email content.
 * 
 * Run with: node simplified-task-extractor.js
 */

require('dotenv').config();
const axios = require('axios');

// Sample email content - you can replace this with your own email text
const emailContent = `
From: Sarah Johnson <sarah.johnson@example.com>
Subject: Project Updates and Action Items for Q2 Planning
Date: May 1, 2023

Hi Team,

I hope you're all doing well. Following our quarterly planning meeting yesterday, 
I wanted to summarize the key action items and next steps for everyone.

Action Items:
1. Please update your department's Q2 budget forecasts by next Friday (May 9th)
2. John needs to schedule the client demo for the new product features before the end of next week
3. Marketing team must finalize the press release for our upcoming product launch by May 15th
4. Everyone should complete their performance review self-assessments by May 20th

Also, I'd like to remind everyone that our team-building retreat is scheduled for June 5-7.
Please ensure you've completed your travel arrangements by May 12th.

Let me know if you have any questions.

Best regards,
Sarah
`;

/**
 * Extract tasks from email content
 * @param {string} emailText - The email content to extract tasks from
 * @returns {Promise<Object>} - Object with success status and tasks or error
 */
async function extractTasks(emailText) {
  try {
    console.log('Starting task extraction...');
    
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('No OpenAI API key found in environment variables');
      return { success: false, error: 'No OpenAI API key configured' };
    }
    
    console.log(`Using API key starting with: ${apiKey.substring(0, 10)}...`);
    
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
    ${emailText}
    """
    `;
    
    console.log('Making API request to OpenAI...');
    
    try {
      // Direct API call without using any library
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-3.5-turbo", // Fallback to a standard model for better compatibility
          messages: [
            { role: "system", content: "You are a helpful assistant that extracts actionable tasks from emails." },
            { role: "user", content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.2,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
      
      console.log('API request successful');
      
      // Extract the content from the response
      const responseText = response.data.choices[0].message.content.trim();
      console.log('\nRaw API response:');
      console.log(responseText);
      
      // Parse the response as JSON
      let extractedTasks = [];
      
      try {
        // Try direct JSON parsing
        if (responseText.startsWith('[') && responseText.endsWith(']')) {
          extractedTasks = JSON.parse(responseText);
          console.log('\nSuccessfully parsed JSON directly');
        } else {
          // Try to find JSON array in the text
          console.log('\nResponse is not a direct JSON array, trying to extract JSON...');
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
        
        return { success: true, tasks: extractedTasks };
      } catch (parseError) {
        console.error('Error parsing response:', parseError.message);
        return { 
          success: false, 
          error: `Failed to parse the OpenAI response: ${parseError.message}`,
          rawResponse: responseText
        };
      }
    } catch (apiError) {
      console.error('API error:', apiError.message);
      
      if (apiError.response) {
        console.error('Status:', apiError.response.status);
        console.error('Data:', apiError.response.data);
        
        return { 
          success: false, 
          error: `OpenAI API error: ${apiError.response.status}`,
          details: apiError.response.data
        };
      }
      
      return { success: false, error: `OpenAI API error: ${apiError.message}` };
    }
  } catch (error) {
    console.error('General error:', error.message);
    return { success: false, error: `Task extraction error: ${error.message}` };
  }
}

// Run the task extraction
async function main() {
  console.log('===============================================');
  console.log('SIMPLIFIED TASK EXTRACTOR');
  console.log('===============================================\n');
  
  const result = await extractTasks(emailContent);
  
  if (result.success) {
    console.log('\n✅ Task extraction successful!');
    console.log(`Found ${result.tasks.length} tasks:`);
    console.log(JSON.stringify(result.tasks, null, 2));
  } else {
    console.error('\n❌ Task extraction failed:');
    console.error(result.error);
    if (result.details) {
      console.error('Error details:', result.details);
    }
    if (result.rawResponse) {
      console.error('Raw response:', result.rawResponse);
    }
  }
  
  console.log('\n===============================================');
}

// Run the script if executed directly
if (require.main === module) {
  main();
}

// Export the function for use in other scripts
module.exports = { extractTasks };
