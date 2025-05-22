/**
 * Reset Tasks and Follow-ups Script
 * 
 * This script:
 * 1. Deletes all tasks from the database
 * 2. Deletes all follow-ups from the database
 * 3. Resets the taskExtracted flag on emails
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Task = require('./models/taskModel');
const Email = require('./models/emailModel');
const Followup = require('./models/followupModel');
const User = require('./models/userModel');

// Connect to the database
connectDB();

/**
 * Main reset function
 */
const resetTasksAndFollowups = async () => {
  try {
    console.log('=== TASKS AND FOLLOW-UPS RESET ===');
    
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users in the database`);
    
    let totalTasksRemoved = 0;
    let totalFollowupsRemoved = 0;
    let totalEmailsReset = 0;
    
    // Process each user
    for (const user of users) {
      console.log(`\nProcessing user: ${user.name} (${user.email})`);
      
      // Step 1: Count and delete tasks
      const taskCount = await Task.countDocuments({ user: user._id });
      console.log(`Found ${taskCount} tasks for this user`);
      
      if (taskCount > 0) {
        await Task.deleteMany({ user: user._id });
        console.log(`Deleted all ${taskCount} tasks`);
        totalTasksRemoved += taskCount;
      }
      
      // Step 2: Count and delete follow-ups
      const followupCount = await Followup.countDocuments({ user: user._id });
      console.log(`Found ${followupCount} follow-ups for this user`);
      
      if (followupCount > 0) {
        await Followup.deleteMany({ user: user._id });
        console.log(`Deleted all ${followupCount} follow-ups`);
        totalFollowupsRemoved += followupCount;
      }
      
      // Step 3: Reset taskExtracted and needsFollowUp flags on emails
      const emailsToReset = await Email.countDocuments({
        user: user._id,
        $or: [
          { taskExtracted: true },
          { needsFollowUp: true }
        ]
      });
      
      if (emailsToReset > 0) {
        await Email.updateMany(
          { 
            user: user._id,
            $or: [
              { taskExtracted: true },
              { needsFollowUp: true }
            ]
          },
          { 
            $set: { 
              taskExtracted: false,
              needsFollowUp: false,
              followUpDueDate: null
            }
          }
        );
        console.log(`Reset flags on ${emailsToReset} emails`);
        totalEmailsReset += emailsToReset;
      }
    }
    
    console.log('\n=== RESET SUMMARY ===');
    console.log(`Total tasks removed: ${totalTasksRemoved}`);
    console.log(`Total follow-ups removed: ${totalFollowupsRemoved}`);
    console.log(`Total emails reset: ${totalEmailsReset}`);
    
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
resetTasksAndFollowups();
