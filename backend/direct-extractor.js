// direct-extractor.js with date conversion
const axios = require('axios');
const config = require('./config/config');

// Helper to convert relative dates to actual dates
function convertToDate(dateString) {
  if (!dateString) return null;
  
  // If already a date format like YYYY-MM-DD, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  const today = new Date();
  const lowerDate = dateString.toLowerCase();
  
  // Handle common relative dates
  if (lowerDate === 'today') {
    return today.toISOString().split('T')[0];
  }
  
  if (lowerDate === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  if (lowerDate === 'friday' || lowerDate.includes('this friday')) {
    const friday = new Date(today);
    friday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7);
    return friday.toISOString().split('T')[0];
  }
  
  if (lowerDate === 'monday' || lowerDate.includes('next monday')) {
    const monday = new Date(today);
    monday.setDate(today.getDate() + (1 - today.getDay() + 7) % 7 + 7);
    return monday.toISOString().split('T')[0];
  }
  
  if (lowerDate.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }
  
  // Default to null if can't parse
  return null;
}

async function extractTasks(email) {
  try {
    console.log('Starting task extraction with direct extractor');
    
    // Format the email content
    const emailContent = `
    From: ${email.sender.name} <${email.sender.email}>
    Subject: ${email.subject}
    Date: ${email.receivedAt}
    
    ${email.body}
    `;
    
    // Make API request directly
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "Extract tasks from emails and return them as a JSON array of objects with title, description (optional), priority (high/medium/low), dueDate (optional, use YYYY-MM-DD format if possible), and category fields."
          },
          { 
            role: "user", 
            content: `Extract the tasks from this email: ${emailContent}`
          }
        ],
        temperature: 0.1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openaiApiKey}`
        }
      }
    );
    
    console.log('Response received:', response.status);
    
    // Get the response content
    const responseContent = response.data.choices[0].message.content;
    console.log('Raw response:', responseContent);
    
    // Try to parse JSON from response
    try {
      // Remove any markdown formatting
      const cleanedResponse = responseContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      console.log('Cleaned response:', cleanedResponse);
      
      // Parse the JSON
      const tasks = JSON.parse(cleanedResponse);
      
      // Process and convert dates
      const processedTasks = tasks.map(task => ({
        title: task.title || "Untitled Task",
        description: task.description || "",
        priority: ['high', 'medium', 'low'].includes(task.priority?.toLowerCase()) 
          ? task.priority.toLowerCase() 
          : "medium",
        dueDate: convertToDate(task.dueDate),
        category: task.category || "Email Task"
      }));
      
      console.log('Processed tasks:', JSON.stringify(processedTasks, null, 2));
      return processedTasks;
    } catch (parseError) {
      console.error('Error parsing response:', parseError.message);
      
      // Return a fallback task
      return [{
        title: "Review email content manually",
        description: "The system couldn't automatically extract tasks from this email. Please review it manually.",
        priority: "medium",
        dueDate: null,
        category: "Email Follow-up"
      }];
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error.message);
    
    // Return a fallback task on error
    return [{
      title: "Review email content (API error occurred)",
      description: "An error occurred during automatic task extraction. Please review this email manually.",
      priority: "medium",
      dueDate: null,
      category: "Manual Processing"
    }];
  }
}

module.exports = { extractTasks };