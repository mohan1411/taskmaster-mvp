/**
 * OpenAI Helper - Alternative version that works without the OpenAI package
 * This is a fallback for when the OpenAI package is not available
 */

const config = require('../config/config');
const axios = require('axios');

// Flag to indicate if OpenAI features are available
let openAIAvailable = false;

// Mock OpenAI API client
const mockOpenAI = {
  createChatCompletion: async (options) => {
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    
    // Make a direct API call to OpenAI using axios
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: options.model || 'gpt-3.5-turbo',
        messages: options.messages,
        max_tokens: options.max_tokens || 500,
        temperature: options.temperature || 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${config.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error.message);
      if (error.response) {
        console.error('API response:', error.response.data);
      }
      throw error;
    }
  }
};

/**
 * Get the OpenAI API client (either real or mock)
 * @returns {Object} - OpenAI API client or mock
 */
function getOpenAI() {
  if (openAIAvailable) {
    try {
      // Try to load the real OpenAI package
      const { Configuration, OpenAIApi } = require('openai');
      
      if (!config.openaiApiKey) {
        console.warn('OpenAI API key is not configured');
        return null;
      }
      
      const configuration = new Configuration({
        apiKey: config.openaiApiKey,
      });
      
      return new OpenAIApi(configuration);
    } catch (err) {
      console.warn('OpenAI package not available, using mock implementation');
      openAIAvailable = false;
    }
  }
  
  // Use mock implementation
  console.log('Using mockOpenAI implementation');
  return mockOpenAI;
}

// Check if OpenAI package is available
try {
  require('openai');
  openAIAvailable = true;
  console.log('OpenAI package is available');
} catch (err) {
  console.warn('OpenAI package is not installed, will use mock implementation');
  openAIAvailable = false;
}

module.exports = {
  getOpenAI,
  // Provide mock constructors for compatibility
  Configuration: function() {},
  OpenAIApi: function() {}
};
