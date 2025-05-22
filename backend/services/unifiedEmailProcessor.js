/**
 * Fixed Unified Email Content Processor - MVP Version
 * 
 * This module integrates task and follow-up detection in a single pass through email content.
 * It processes an email and extracts both tasks and follow-ups simultaneously.
 * 
 * For MVP: Automatic processing on email sync is disabled but the code is kept for future use.
 */

const mongoose = require('mongoose');
const Task = require('../models/taskModel');
const Followup = require('../models/followupModel');
const Email = require('../models/emailModel');
const config = require('../config/config');
const { OpenAI } = require('openai');

// Initialize OpenAI
let openai = null;
try {
  if (config.openaiApiKey) {
    openai = new OpenAI({
      apiKey: config.openaiApiKey
    });
    console.log('OpenAI initialized successfully for unified email processor');
  } else {
    console.warn('OpenAI API key not configured - Task extraction will be limited');
  }
} catch (error) {
  console.error('Error initializing OpenAI:', error.message);
}

/**
 * Process an email to extract both tasks and follow-ups in a single pass
 * @param {Object} email - The email object to process
 * @param {Object} user - The user object
 * @returns {Promise<Object>} - Object containing extracted tasks and follow-ups
 */
const processEmailContent = async (email, user) => {
  try {
    console.log(`Processing email: ${email.subject}`);
    
    if (!openai) {
      throw new Error('OpenAI API is not configured or initialized');
    }
    
    // Create a context from email parts
    const emailContent = `
    From: ${email.from}
    Subject: ${email.subject}
    Date: ${email.date}
    ---------------------------
    ${email.body}
    `;
    
    // Create a detailed prompt for OpenAI to extract both tasks and follow-ups
    const prompt = `
    Analyze the following email content and extract two types of items:
    
    1. TASKS: Any specific action items that need to be completed.
       For each task identify:
       - Task title (clear, concise description of what needs to be done)
       - Priority (High, Medium, Low)
       - Due date (if mentioned)
       - Description (any relevant details about the task)
    
    2. FOLLOW-UPS: Any items that require following up with someone.
       For each follow-up identify:
       - Subject (clear description of what needs follow-up)
       - Contact name (person to follow up with)
       - Contact email (if available)
       - Due date (deadline if mentioned)
       - Notes (any relevant details about the follow-up)
    
    Respond in structured JSON format like this:
    {
      "tasks": [
        {
          "title": "Task title here",
          "priority": "high/medium/low",
          "dueDate": "YYYY-MM-DD or null if not specified",
          "description": "Additional context for the task"
        }
      ],
      "followups": [
        {
          "subject": "Follow up on X",
          "contactName": "Person to follow up with",
          "contactEmail": "email@example.com or empty string",
          "dueDate": "YYYY-MM-DD or null if not specified", 
          "notes": "Additional context for the follow-up"
        }
      ]
    }
    
    EMAIL:
    ${emailContent}
    `;
    
    // Call OpenAI API to extract content
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // Use appropriate model
      messages: [
        {
          role: "system",
          content: "You are a precise assistant that extracts tasks and follow-ups from emails. You only output valid JSON with no additional text."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.1, // Low temperature for more consistent results
      max_tokens: 2000
    });
    
    // Extract the response content
    const responseContent = completion.choices[0].message.content.trim();
    
    // Parse the JSON response
    let extractedData;
    try {
      // Remove any markdown formatting if present
      const jsonString = responseContent.replace(/```json|```/g, '').trim();
      extractedData = JSON.parse(jsonString);
      
      console.log("Extracted data:", JSON.stringify(extractedData, null, 2));
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.log("Raw response:", responseContent);
      throw new Error("Failed to parse extraction results");
    }
    
    // Return the extracted data
    return {
      tasks: extractedData.tasks || [],
      followups: extractedData.followups || []
    };
    
  } catch (error) {
    console.error("Error processing email content:", error);
    throw error;
  }
};

/**
 * Save extracted tasks to the database
 * @param {Array} tasks - Array of extracted tasks
 * @param {Object} user - User object
 * @param {Object} email - Email object
 * @returns {Promise<Array>} - Array of saved task objects
 */
const saveTasks = async (tasks, user, email) => {
  const savedTasks = [];
  
  for (const task of tasks) {
    try {
      console.log(`Creating task: ${task.title}`);
      
      // Convert priority to lowercase to match schema enum
      let priority = (task.priority || 'medium').toLowerCase();
      // Ensure priority matches one of the enum values
      if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
        // Map "high" to "urgent" if needed
        priority = priority === 'high' ? 'high' : 'medium';
      }
      
      // Create a new task matching your TaskModel schema
      const newTask = new Task({
        title: task.title,
        description: task.description || '',
        status: 'pending',
        priority: priority,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        user: user._id,
        emailSource: email._id.toString(), // Using emailSource instead of sourceEmail
        aiGenerated: true,
        labels: ['email-extracted']
      });
      
      console.log(`Task object: ${JSON.stringify(newTask)}`);
      
      // Save the task
      const savedTask = await newTask.save();
      savedTasks.push(savedTask);
      
      // Update email with reference to this task
      await Email.findByIdAndUpdate(email._id, {
        $push: { tasks: savedTask._id },
        $set: { processed: true }
      });
      
      console.log(`Task saved successfully: ${savedTask.title}`);
    } catch (error) {
      console.error(`Error saving task "${task.title}":`, error);
    }
  }
  
  return savedTasks;
};

/**
 * Save extracted follow-ups to the database
 * @param {Array} followups - Array of extracted follow-ups
 * @param {Object} user - User object
 * @param {Object} email - Email object
 * @returns {Promise<Array>} - Array of saved follow-up objects
 */
const saveFollowups = async (followups, user, email) => {
  const savedFollowups = [];
  
  for (const followup of followups) {
    try {
      console.log(`Creating followup: ${followup.subject}`);
      
      // Create a new follow-up matching your FollowupModel schema
      const newFollowup = new Followup({
        user: user._id,
        emailId: email._id.toString(),
        threadId: email.threadId || '',
        subject: followup.subject,
        contactName: followup.contactName || '',
        contactEmail: followup.contactEmail || '',
        status: 'pending',
        priority: 'medium',
        dueDate: followup.dueDate ? new Date(followup.dueDate) : new Date(Date.now() + 86400000), // Default to tomorrow
        notes: followup.notes || '',
        aiGenerated: true
      });
      
      console.log(`Followup object: ${JSON.stringify(newFollowup)}`);
      
      // Save the follow-up
      const savedFollowup = await newFollowup.save();
      savedFollowups.push(savedFollowup);
      
      // Update email with reference to this follow-up
      await Email.findByIdAndUpdate(email._id, {
        $push: { followups: savedFollowup._id },
        $set: { processed: true }
      });
      
      console.log(`Follow-up saved successfully: ${savedFollowup.subject}`);
    } catch (error) {
      console.error(`Error saving follow-up "${followup.subject}":`, error);
      // If the error is a duplicate key error, log it but don't stop processing
      if (error.code === 11000) {
        console.log(`Duplicate follow-up detected, skipping: ${followup.subject}`);
      }
    }
  }
  
  return savedFollowups;
};

/**
 * Process a batch of emails for a user - MVP version
 * @param {Object} user - User object
 * @param {Number} limit - Maximum number of emails to process
 * @returns {Promise<Object>} - Object containing processing results
 */
const processUserEmails = async (user, limit = 10) => {
  try {
    // For MVP: Automatic processing is disabled, so this function will only
    // process emails when manually triggered and will not be called during initial sync
    console.log(`Starting manual email processing for user ${user.email}. Limit: ${limit}`);
    // Find unprocessed emails for the user
    const unprocessedEmails = await Email.find({ 
      user: user._id, 
      processed: false 
    }).limit(limit);
    
    console.log(`Found ${unprocessedEmails.length} unprocessed emails for user ${user.email}`);
    
    const results = {
      processed: 0,
      tasks: [],
      followups: [],
      errors: []
    };
    
    // Process each email
    for (const email of unprocessedEmails) {
      try {
        console.log(`Processing email ID: ${email._id}, Subject: ${email.subject}`);
        
        // Extract tasks and follow-ups
        const extracted = await processEmailContent(email, user);
        
        console.log(`Extraction results - Tasks: ${extracted.tasks.length}, Followups: ${extracted.followups.length}`);
        
        // Save tasks
        const savedTasks = await saveTasks(extracted.tasks, user, email);
        results.tasks = results.tasks.concat(savedTasks);
        
        // Save follow-ups
        const savedFollowups = await saveFollowups(extracted.followups, user, email);
        results.followups = results.followups.concat(savedFollowups);
        
        // Mark as processed even if no tasks/followups were found
        if (extracted.tasks.length === 0 && extracted.followups.length === 0) {
          await Email.findByIdAndUpdate(email._id, { processed: true });
        }
        
        results.processed++;
        
      } catch (emailError) {
        console.error(`Error processing email ${email._id}:`, emailError);
        results.errors.push({
          emailId: email._id,
          subject: email.subject,
          error: emailError.message
        });
      }
    }
    
    return results;
    
  } catch (error) {
    console.error("Error in processing user emails:", error);
    throw error;
  }
};

module.exports = {
  processEmailContent,
  processUserEmails,
  saveTasks,
  saveFollowups
};
