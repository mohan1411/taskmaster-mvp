require('dotenv').config();
const axios = require('axios');

// Simple test function
async function testOpenAI() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('ERROR: No OpenAI API key found in environment variables');
      return;
    }

    console.log('Testing OpenAI API with a simple prompt...');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You extract tasks from emails and return them as JSON array with title, priority, dueDate, and category fields."
          },
          { 
            role: "user", 
            content: "Extract tasks from this email: Please send the report by Friday and schedule the meeting for next week."
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

    console.log('Response status:', response.status);
    console.log('Raw response:', response.data.choices[0].message.content);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testOpenAI();