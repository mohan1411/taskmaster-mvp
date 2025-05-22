/**
 * Complete Gmail Integration Reset Script
 * 
 * This script:
 * 1. Inspects current settings and email data
 * 2. Completely removes all email and Google integration data
 * 3. Provides detailed information about what was removed
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Email = require('./models/emailModel');
const Settings = require('./models/settingsModel');
const Followup = require('./models/followupModel');
const User = require('./models/userModel');

// Connect to the database
connectDB();

/**
 * Main reset function
 */
const completeReset = async () => {
  try {
    console.log('=== TaskMaster Email System Reset ===');
    
    // Step 1: Get all users
    const users = await User.find({}, 'email name');
    console.log(`\nFound ${users.length} users in the database`);
    
    for (const user of users) {
      console.log(`\nInspecting user: ${user.name} (${user.email})`);
      
      // Step 2: Check settings
      const settings = await Settings.findOne({ user: user._id });
      if (settings) {
        console.log('Settings found:');
        console.log('- Email sync enabled:', settings.emailSync.enabled);
        console.log('- Gmail connected:', settings.integrations.google.connected);
        
        if (settings.integrations.google.connected) {
          console.log('- Access token available:', !!settings.integrations.google.tokenInfo.accessToken);
          console.log('- Refresh token available:', !!settings.integrations.google.tokenInfo.refreshToken);
          
          // Check token expiry
          const expiryDate = settings.integrations.google.tokenInfo.expiryDate;
          if (expiryDate) {
            const now = new Date();
            const expired = now > new Date(expiryDate);
            console.log('- Token expired:', expired);
            console.log('- Expiry date:', new Date(expiryDate).toISOString());
          } else {
            console.log('- No token expiry date found');
          }
        }
      } else {
        console.log('No settings found for this user');
      }
      
      // Step 3: Check emails
      const emailCount = await Email.countDocuments({ user: user._id });
      console.log(`\nEmail data: ${emailCount} emails found`);
      
      // Step 4: Check followups
      const followupCount = await Followup.countDocuments({ user: user._id });
      console.log(`Followup data: ${followupCount} followups found`);
      
      // Get confirmation to proceed
      console.log('\nReady to reset ALL email data and Gmail integration for this user');
      console.log('This will:');
      console.log('1. Delete ALL emails from the database');
      console.log('2. Delete ALL followups');
      console.log('3. Disconnect Gmail integration');
      
      // Perform reset
      console.log('\nPerforming reset...');
      
      // Delete emails
      if (emailCount > 0) {
        await Email.deleteMany({ user: user._id });
        console.log(`- Deleted ${emailCount} emails`);
      } else {
        console.log('- No emails to delete');
      }
      
      // Delete followups
      if (followupCount > 0) {
        await Followup.deleteMany({ user: user._id });
        console.log(`- Deleted ${followupCount} followups`);
      } else {
        console.log('- No followups to delete');
      }
      
      // Reset settings
      if (settings) {
        settings.integrations.google.connected = false;
        settings.integrations.google.tokenInfo = {
          accessToken: null,
          refreshToken: null,
          expiryDate: null
        };
        await settings.save();
        console.log('- Reset Gmail integration settings');
      }
    }
    
    console.log('\nReset complete!');
    console.log('Please return to the application and connect your Gmail account again.');
    console.log('Steps:');
    console.log('1. Go to Settings > Integrations');
    console.log('2. Click "Connect Gmail"');
    console.log('3. Sign in with your new Gmail account and approve permissions');
    console.log('4. Try syncing emails again');
    
  } catch (error) {
    console.error('Error during reset process:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
};

// Run the reset function
completeReset();
