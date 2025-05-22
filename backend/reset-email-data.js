/**
 * Email Data Reset Script
 * 
 * This script:
 * 1. Disconnects the current Gmail integration
 * 2. Deletes all email data from the database
 * 3. Resets the integration settings
 * 
 * Run this script when changing email accounts or to reset email data
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Email = require('./models/emailModel');
const Settings = require('./models/settingsModel');
const Followup = require('./models/followupModel');

// Connect to the database
connectDB();

/**
 * Main reset function
 */
const resetEmailData = async () => {
  try {
    console.log('Starting email data reset process...');
    
    // Step 1: Find all user IDs that have emails
    const userIds = await Email.distinct('user');
    console.log(`Found ${userIds.length} users with email data`);
    
    // Process each user
    for (const userId of userIds) {
      console.log(`Processing user ID: ${userId}`);
      
      // Step 2: Count emails for this user
      const emailCount = await Email.countDocuments({ user: userId });
      console.log(`Found ${emailCount} emails for this user`);
      
      // Step 3: Delete all emails for this user
      await Email.deleteMany({ user: userId });
      console.log(`Deleted all emails for user ID: ${userId}`);
      
      // Step 4: Delete all follow-ups for this user
      const followupCount = await Followup.countDocuments({ user: userId });
      await Followup.deleteMany({ user: userId });
      console.log(`Deleted ${followupCount} follow-ups for user ID: ${userId}`);
      
      // Step 5: Reset Google integration settings
      const settings = await Settings.findOne({ user: userId });
      
      if (settings && settings.integrations.google.connected) {
        console.log('Disconnecting Google integration...');
        
        // Reset integration settings
        settings.integrations.google.connected = false;
        settings.integrations.google.tokenInfo = {
          accessToken: null,
          refreshToken: null,
          expiryDate: null
        };
        
        await settings.save();
        console.log('Google integration has been reset');
      } else {
        console.log('No active Google integration found');
      }
    }
    
    console.log('\nEmail data reset process completed successfully!');
    console.log('Please reconnect your Gmail account through the application settings.');
    
  } catch (error) {
    console.error('Error during email reset process:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the reset function
resetEmailData();
