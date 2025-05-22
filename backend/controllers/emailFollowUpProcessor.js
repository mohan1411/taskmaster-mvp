/**
 * Fix for duplicate follow-ups in TaskMaster
 * This patch updates emailController.js to use atomic operations
 */

const { google } = require('googleapis');
const axios = require('axios');
const Email = require('../models/emailModel');
const User = require('../models/userModel');
const Settings = require('../models/settingsModel');
const Followup = require('../models/followupModel');
const config = require('../config/config');
const { Configuration, OpenAIApi } = require('openai');
const { extractTasksFromEmail: extractTasksHelper, extractTasksWithoutAI } = require('./emailTaskExtractor');
const { detectFollowUpNeeds } = require('./followupController');
const { createFollowupAtomic, removeDuplicateFollowups } = require('../utils/followupUtilsV2');

/**
 * Detect follow-up needs in email and create a follow-up record
 * @param {Object} email - Email record
 * @param {string} userId - User ID
 * @param {string} emailBody - Email content
 * @returns {Promise<Object>} - Detection result
 */
const processEmailFollowUp = async (email, userId, emailBody) => {
  try {
    console.log(`Processing follow-up for email ID: ${email.messageId}`);
    
    // Create email object for detection
    const emailForDetection = {
      _id: email._id,
      sender: email.sender,
      subject: email.subject,
      receivedAt: email.receivedAt,
      threadId: email.threadId,
      messageId: email.messageId,
      body: emailBody || email.snippet
    };
    
    // Detect follow-up needs
    const result = await detectFollowUpNeeds(emailForDetection);
    
    if (!result.success) {
      console.error(`Error detecting follow-up needs: ${result.error}`);
      return { success: false, error: result.error };
    }
    
    const followUpAnalysis = result.followUpAnalysis;
    
    // Update email with follow-up info if needed
    if (followUpAnalysis.needsFollowUp) {
      // Update email record
      email.needsFollowUp = true;
      email.followUpDueDate = new Date(followUpAnalysis.suggestedDate);
      await email.save();
      
      // Prepare follow-up data
      const followupData = {
        user: userId,
        emailId: email.messageId,
        threadId: email.threadId,
        subject: email.subject,
        contactName: email.sender.name,
        contactEmail: email.sender.email,
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(followUpAnalysis.suggestedDate),
        reason: followUpAnalysis.reason,
        notes: followUpAnalysis.reason,
        keyPoints: followUpAnalysis.keyPoints,
        aiGenerated: true
      };
      
      // Create follow-up using atomic operation
      const followup = await createFollowupAtomic(followupData);
      
      // Remove any duplicate follow-ups that might have been created
      await removeDuplicateFollowups(userId, email.messageId);
      
      return { 
        success: true, 
        needsFollowUp: true, 
        followup,
        analysis: followUpAnalysis
      };
    } else {
      // Update email to reflect no follow-up needed
      email.needsFollowUp = false;
      await email.save();
      
      return { 
        success: true, 
        needsFollowUp: false,
        analysis: followUpAnalysis
      };
    }
  } catch (error) {
    console.error(`Error processing follow-up: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Export the function for use in emailController.js
module.exports = {
  processEmailFollowUp
};
