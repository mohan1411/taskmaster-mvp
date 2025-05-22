/**
 * Email Task Extractor - Helper module for extracting tasks from emails
 * This implements the same successful pattern as the test script
 */

const config = require('../config/config');
const { getOpenAI } = require('../utils/openaiHelper');

/**
 * Extract tasks from email content using OpenAI API
 * @param {Object} email - The email object with sender, subject, receivedAt, and body
 * @returns {Promise<Object>} - Object with success status and extracted tasks or error
 */
const extractTasksFromEmail = async (email) => {
  try {
    console.log('Starting task extraction for email:', email._id);
    console.log('Using OpenAI API key:', config.openaiApiKey ? `${config.openaiApiKey.substring(0, 5)}...` : 'Missing API key');

    // Check for valid API key
    if (!config.openaiApiKey) {
      console.error('ERROR: OpenAI API key is not configured');
      return { success: false, error: 'OpenAI API key is not configured' };
    }
    
    // Get the OpenAI client
    const openai = getOpenAI();
    if (!openai) {
      console.error('ERROR: OpenAI client could not be initialized');
      return { success: false, error: 'OpenAI client could not be initialized' };
    }

    // Format email context
    const emailContext = `
    From: ${email.sender.name} <${email.sender.email}>
    Subject: ${email.subject}
    Date: ${email.receivedAt}
    
    ${email.body || ''}
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
    
    try {
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

      console.log('OpenAI API call completed with status:', completion.status);
      
      // Extract and parse response
      const responseText = completion.data.choices[0].message.content.trim();
      console.log('Raw API response:', responseText);
      
      let extractedTasks = [];
      
      // Check if response is valid JSON array
      if (responseText.startsWith('[') && responseText.endsWith(']')) {
        try {
          extractedTasks = JSON.parse(responseText);
          console.log('Successfully parsed JSON directly');
        } catch (parseError) {
          console.error('Error parsing direct JSON:', parseError.message);
          // Continue to alternative parsing methods
        }
      }
      
      // If direct parsing failed, try to extract JSON from text
      if (extractedTasks.length === 0) {
        console.log('Trying alternative JSON extraction...');
        try {
          const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
          if (jsonMatch) {
            extractedTasks = JSON.parse(jsonMatch[0]);
            console.log('Successfully extracted and parsed JSON from response');
          }
        } catch (matchError) {
          console.error('Error extracting JSON pattern:', matchError.message);
          // Continue to fallback
        }
      }
      
      // If all parsing fails, create a fallback task
      if (extractedTasks.length === 0) {
        console.log('Using fallback task');
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
      
      console.log(`Successfully extracted ${extractedTasks.length} tasks`);
      return { success: true, extractedTasks };
    } catch (apiError) {
      console.error('OpenAI API error:', apiError.message);
      if (apiError.response) {
        console.error('API response status:', apiError.response.status);
        console.error('API response:', apiError.response.data);
        return { 
          success: false, 
          error: `OpenAI API error: ${apiError.response.status} - ${JSON.stringify(apiError.response.data)}` 
        };
      }
      return { success: false, error: `OpenAI API error: ${apiError.message}` };
    }
  } catch (error) {
    console.error('Task extraction error:', error.message);
    return { success: false, error: `Task extraction error: ${error.message}` };
  }
};

/**
 * Simple extraction function that doesn't use OpenAI
 * @param {Object} email - The email object with sender, subject, receivedAt, and body
 * @returns {Promise<Object>} - Object with success status and extracted tasks
 */
const extractTasksWithoutAI = async (email) => {
  try {
    console.log('Using simplified extraction without AI for email:', email._id);
    
    // Create a simple task based on the email subject
    const extractedTasks = [
      {
        title: `Task from: ${email.subject}`,
        description: email.snippet || email.body.substring(0, 100) || "Task extracted from email",
        priority: "medium",
        dueDate: null,
        category: "Email Task"
      }
    ];
    
    console.log('Created simple task without AI:', extractedTasks);
    
    return {
      success: true,
      extractedTasks
    };
  } catch (error) {
    console.error('Simple extraction error:', error);
    return {
      success: false,
      error: `Simple extraction error: ${error.message}`
    };
  }
};

module.exports = { extractTasksFromEmail,extractTasksWithoutAI };
