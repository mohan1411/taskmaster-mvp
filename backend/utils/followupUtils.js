// Fix for duplicate follow-ups in emailController.js

const mongoose = require('mongoose');
const { google } = require('googleapis');
const axios = require('axios');
const Email = require('../models/emailModel');
const User = require('../models/userModel');
const Settings = require('../models/settingsModel');
const Followup = require('../models/followupModel');
const config = require('../config/config');
const fs = require('fs');
const path = require('path');

/**
 * Checks if a follow-up already exists for the given email
 * @param {string} userId - User ID
 * @param {string} messageId - Email message ID
 * @returns {Promise<boolean>} - True if follow-up exists, false otherwise
 */
const followupExists = async (userId, messageId) => {
  try {
    const existingFollowup = await Followup.findOne({
      user: userId,
      emailId: messageId
    });
    return !!existingFollowup;
  } catch (error) {
    console.error('Error checking for existing follow-up:', error);
    return false; // Assume no follow-up exists if there's an error
  }
};

/**
 * Creates a new follow-up if one doesn't already exist for the email
 * @param {Object} data - Follow-up data
 * @returns {Promise<Object>} - Created follow-up or null
 */
const createFollowupIfNotExists = async (data) => {
  try {
    // Check if a follow-up already exists for this email
    const exists = await followupExists(data.user, data.emailId);
    
    if (exists) {
      console.log(`Follow-up already exists for email ID: ${data.emailId}`);
      return null;
    }
    
    // Create new follow-up
    const followup = await Followup.create(data);
    console.log(`Created new follow-up for email ID: ${data.emailId}`);
    return followup;
  } catch (error) {
    console.error('Error creating follow-up:', error);
    return null;
  }
};

// Export both helper functions
module.exports = {
  followupExists,
  createFollowupIfNotExists
};
