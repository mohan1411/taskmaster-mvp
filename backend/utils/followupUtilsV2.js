/**
 * Enhanced Follow-up Utilities
 * Version 2.0 - Fixed duplicate creation by implementing atomic operations
 */

const mongoose = require('mongoose');
const Followup = require('../models/followupModel');
const fs = require('fs');
const path = require('path');

// Set up logging
const logDir = path.join(__dirname, '../logs');
// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logPath = path.join(logDir, 'followup-utils.log');

// Logger function
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Log to file (append)
  fs.appendFileSync(logPath, logMessage, { flag: 'a+' });
};

/**
 * Create a follow-up using atomic findOneAndUpdate operation
 * This prevents race conditions that could cause duplicate follow-ups
 * 
 * @param {Object} data - Follow-up data object
 * @returns {Promise<Object>} - Created or existing follow-up
 */
const createFollowupAtomic = async (data) => {
  try {
    log(`Attempting to create follow-up for email ID: ${data.emailId}`);
    
    if (!data.emailId) {
      log(`ERROR: Missing emailId in follow-up data`);
      return null;
    }
    
    // Use findOneAndUpdate with upsert to atomically create or update
    // This prevents race conditions where two requests try to create the same follow-up
    const result = await Followup.findOneAndUpdate(
      { 
        user: data.user, 
        emailId: data.emailId
      },
      { 
        $setOnInsert: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { 
        new: true,           // Return the updated document
        upsert: true,        // Create if it doesn't exist
        runValidators: true  // Run model validators
      }
    );
    
    if (result) {
      log(`Successfully processed follow-up for email ID: ${data.emailId} (ID: ${result._id})`);
      return result;
    } else {
      log(`ERROR: Failed to process follow-up for email ID: ${data.emailId}`);
      return null;
    }
  } catch (error) {
    log(`ERROR creating/updating follow-up: ${error.message}`);
    log(error.stack);
    return null;
  }
};

/**
 * Remove duplicate follow-ups for an email
 * 
 * @param {string} userId - User ID
 * @param {string} emailId - Email message ID
 * @returns {Promise<number>} - Number of duplicates removed
 */
const removeDuplicateFollowups = async (userId, emailId) => {
  try {
    // Find all follow-ups for this email
    const followups = await Followup.find({
      user: userId,
      emailId: emailId
    }).sort({ createdAt: 1 });
    
    if (followups.length <= 1) {
      // No duplicates
      return 0;
    }
    
    log(`Found ${followups.length} follow-ups for email ID: ${emailId}`);
    
    // Keep the first one, remove the rest
    const keepFollowup = followups[0];
    const duplicatesToRemove = followups.slice(1);
    
    log(`Keeping follow-up ID: ${keepFollowup._id}`);
    
    // Remove duplicates
    let removed = 0;
    for (const duplicate of duplicatesToRemove) {
      log(`Removing duplicate follow-up ID: ${duplicate._id}`);
      await Followup.findByIdAndDelete(duplicate._id);
      removed++;
    }
    
    log(`Removed ${removed} duplicate follow-ups for email ID: ${emailId}`);
    return removed;
  } catch (error) {
    log(`ERROR removing duplicates: ${error.message}`);
    return 0;
  }
};

// Export functions
module.exports = {
  createFollowupAtomic,
  removeDuplicateFollowups
};
