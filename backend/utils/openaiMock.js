/**
 * This file is a temporary fix for OpenAI API compatibility issues
 * It removes direct dependencies on the OpenAI package by providing mock implementations
 */

// Mock Configuration and OpenAIApi
const Configuration = function(config) {
  this.apiKey = config.apiKey;
};

const OpenAIApi = function(config) {
  this.config = config;
  
  // Mock createChatCompletion method
  this.createChatCompletion = async function(options) {
    console.log('Mock OpenAI API called with:', options.model);
    
    // Return a mock response
    return {
      data: {
        choices: [
          {
            message: {
              content: 'This is a mock response from the OpenAI API because the original package is having compatibility issues.'
            }
          }
        ],
        model: options.model || 'mock-model'
      }
    };
  };
};

module.exports = { Configuration, OpenAIApi };
