/**
 * Test Routes for TaskMaster API
 * These routes are for testing and debugging specific functionality
 */

const express = require('express');
const router = express.Router();
const config = require('../config/config');
const { extractTasksFromEmail } = require('../controllers/emailTaskExtractor');
const { protect } = require('../middleware/authMiddleware');
const { getOpenAI } = require('../utils/openaiHelper');

// Test OpenAI connectivity
router.get('/openai-status', async (req, res) => {
  try {
    console.log('Testing OpenAI API connectivity...');
    console.log('API Key:', config.openaiApiKey ? `${config.openaiApiKey.substring(0, 5)}...` : 'Missing');
    
    if (!config.openaiApiKey) {
      return res.status(400).json({
        success: false,
        message: 'OpenAI API key is not configured'
      });
    }
    
    const openai = getOpenAI();
    if (!openai) {
      return res.status(500).json({
        success: false,
        message: 'OpenAI API client could not be initialized'
      });
    }
    
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Test the OpenAI API connection by responding with 'Connection successful!'" }
      ],
      max_tokens: 20,
      temperature: 0.2,
    });
    
    const response = completion.data.choices[0].message.content.trim();
    
    res.json({
      success: true,
      message: 'OpenAI API connection successful',
      response: response,
      model: completion.data.model
    });
  } catch (error) {
    console.error('OpenAI API test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing OpenAI API connection',
      error: error.message,
      errorDetails: error.response ? error.response.data : null
    });
  }
});

// Test task extraction with a sample email
router.post('/extract-tasks', protect, async (req, res) => {
  try {
    // Get test email content from request body or use a default
    const email = req.body.email || {
      _id: 'test123',
      sender: { name: 'John Doe', email: 'john@example.com' },
      subject: 'Project Updates and Action Items',
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
    
    // Call our task extraction helper
    const result = await extractTasksFromEmail(email);
    
    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('Task extraction test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing task extraction',
      error: error.message
    });
  }
});

module.exports = router;
