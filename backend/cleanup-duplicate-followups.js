/**
 * Cleanup Duplicate Follow-ups Script
 * 
 * This script:
 * 1. Scans the database for duplicate follow-ups
 * 2. Keeps the most recent one and removes duplicates
 * 3. Outputs a report of what was cleaned up
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Followup = require('./models/followupModel');
const User = require('./models/userModel');

// Connect to the database
connectDB();

/**
 * Main cleanup function
 */
const cleanupDuplicateFollowups = async () => {
  try {
    console.log('=== Duplicate Follow-ups Cleanup ===');
    
    // Get all users
    const users = await User.find({}, 'email name');
    console.log(`Found ${users.length} users in the database`);
    
    let totalDuplicatesRemoved = 0;
    
    for (const user of users) {
      console.log(`\nProcessing user: ${user.name} (${user.email})`);
      
      // Get all follow-ups for this user
      const followups = await Followup.find({ user: user._id }).sort({ createdAt: -1 });
      console.log(`Found ${followups.length} follow-ups for this user`);
      
      if (followups.length === 0) {
        console.log('No follow-ups to check');
        continue;
      }
      
      // Group follow-ups by emailId
      const followupsByEmailId = {};
      for (const followup of followups) {
        if (!followup.emailId) continue; // Skip follow-ups without emailId
        
        if (!followupsByEmailId[followup.emailId]) {
          followupsByEmailId[followup.emailId] = [];
        }
        followupsByEmailId[followup.emailId].push(followup);
      }
      
      // Find and remove duplicates
      let userDuplicatesRemoved = 0;
      
      for (const [emailId, emailFollowups] of Object.entries(followupsByEmailId)) {
        if (emailFollowups.length > 1) {
          console.log(`Found ${emailFollowups.length} follow-ups for email ID: ${emailId}`);
          
          // Keep the most recent one, remove the rest
          const sortedFollowups = emailFollowups.sort((a, b) => b.createdAt - a.createdAt);
          const keepFollowup = sortedFollowups[0];
          const duplicatesToRemove = sortedFollowups.slice(1);
          
          console.log(`Keeping follow-up ID: ${keepFollowup._id} (created: ${keepFollowup.createdAt})`);
          
          for (const duplicate of duplicatesToRemove) {
            console.log(`Removing duplicate follow-up ID: ${duplicate._id} (created: ${duplicate.createdAt})`);
            await Followup.findByIdAndDelete(duplicate._id);
            userDuplicatesRemoved++;
            totalDuplicatesRemoved++;
          }
        }
      }
      
      console.log(`Removed ${userDuplicatesRemoved} duplicate follow-ups for this user`);
    }
    
    console.log(`\n=== Cleanup Summary ===`);
    console.log(`Total duplicate follow-ups removed: ${totalDuplicatesRemoved}`);
    
  } catch (error) {
    console.error('Error during cleanup process:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
};

// Run the cleanup function
cleanupDuplicateFollowups();
