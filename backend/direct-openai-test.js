/**
 * Direct OpenAI API Test
 * 
 * This is an independent test script that directly calls the OpenAI API
 * without any dependencies on your application code.
 * 
 * Run this with: node direct-openai-test.js
 */

require('dotenv').config();
const axios = require('axios');

// Get API key from environment
const apiKey = process.env.OPENAI_API_KEY;
console.log(`Using API key starting with: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT FOUND'}`);

// Test data
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

Let me know if you have any questions.

Best regards,
Sarah
`;

// Prompt for task extraction
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

Email: """
${emailContent}
"""
`;

// Test OpenAI API directly with axios
async function directOpenAITest() {
  console.log('Starting direct OpenAI API test...');
  
  try {
    console.log('Making API call to OpenAI...');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o-mini", // Using the specified model
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
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('\nResponse data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Extract the content from the response
    const responseContent = response.data.choices[0].message.content;
    console.log('\nExtracted tasks:');
    console.log(responseContent);
    
    // Try to parse as JSON
    try {
      const tasks = JSON.parse(responseContent);
      console.log('\nParsed JSON tasks:');
      console.log(JSON.stringify(tasks, null, 2));
      console.log(`\nSuccessfully extracted ${tasks.length} tasks!`);
    } catch (parseError) {
      console.error('\nFailed to parse response as JSON:', parseError.message);
      console.log('Raw response content:', responseContent);
    }
    
    console.log('\nTest completed!');
  } catch (error) {
    console.error('\n❌ Error calling OpenAI API:');
    
    if (error.response) {
      // The API responded with an error status code
      console.error('Status code:', error.response.status);
      console.error('Response data:', error.response.data);
      
      // Handle common error cases
      if (error.response.status === 401) {
        console.error('\n🔑 Authentication error: Your API key is invalid or expired.');
        console.error('Please obtain a valid API key from the OpenAI dashboard: https://platform.openai.com/api-keys');
      } else if (error.response.status === 404) {
        console.error('\n⚠️ Model not found: The specified model "gpt-4o-mini" may not exist or you may not have access to it.');
        console.error('Try using "gpt-3.5-turbo" instead, or check your OpenAI account for available models.');
      } else if (error.response.status === 429) {
        console.error('\n⚠️ Rate limit or quota exceeded: You have hit rate limits or exhausted your quota.');
        console.error('Check your usage on the OpenAI dashboard: https://platform.openai.com/usage');
      }
    } else if (error.request) {
      // No response received from the server
      console.error('No response received. Check your internet connection.');
    } else {
      // Error with the request itself
      console.error('Error setting up request:', error.message);
    }
    
    // Detailed error information for debugging
    console.error('\nDetailed error information:');
    console.error(error);
  }
}

// Run the test
directOpenAITest();
