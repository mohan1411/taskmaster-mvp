/**
 * OpenAI API Test Script
 * 
 * This script tests connectivity to the OpenAI API with the provided API key.
 * It validates that your OpenAI setup is working correctly.
 * 
 * Usage:
 * 1. Make sure your .env file is configured with valid OPENAI_API_KEY
 * 2. Run this script with Node.js:
 *    node tests/openai-test.js
 */

require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');

// Get API key from environment variable
const apiKey = process.env.OPENAI_API_KEY;

// Check if API key is provided
if (!apiKey) {
  console.error('Error: OPENAI_API_KEY is not configured in your .env file');
  process.exit(1);
}

console.log(`Testing OpenAI API with key: ${apiKey.substring(0, 5)}...`);

// Initialize OpenAI client
const configuration = new Configuration({
  apiKey: apiKey,
});
const openai = new OpenAIApi(configuration);

async function testCompletionAPI() {
  console.log('\n--- Testing Completion API ---');
  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: "Hello, I am testing the OpenAI API. Please respond with 'API test successful!'",
      max_tokens: 20,
      temperature: 0.2
    });
    
    console.log('Response status:', completion.status);
    console.log('Response data:');
    console.log('- Model:', completion.data.model);
    console.log('- Text:', completion.data.choices[0].text.trim());
    console.log('- Finish reason:', completion.data.choices[0].finish_reason);
    console.log('Completion API test PASSED');
  } catch (error) {
    console.error('Completion API test FAILED');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testChatCompletionAPI() {
  console.log('\n--- Testing Chat Completion API ---');
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello, I am testing the OpenAI API. Please respond with 'API test successful!'" }
      ],
      max_tokens: 20,
      temperature: 0.2
    });
    
    console.log('Response status:', completion.status);
    console.log('Response data:');
    console.log('- Model:', completion.data.model);
    console.log('- Message:', completion.data.choices[0].message.content.trim());
    console.log('- Finish reason:', completion.data.choices[0].finish_reason);
    console.log('Chat Completion API test PASSED');
  } catch (error) {
    console.error('Chat Completion API test FAILED');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function runTests() {
  console.log('Starting OpenAI API tests...');
  await testCompletionAPI();
  await testChatCompletionAPI();
  console.log('\nTests completed.');
}

runTests();
