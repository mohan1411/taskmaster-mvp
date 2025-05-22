/**
 * Manual Email Flag Reset Tool
 * 
 * This script:
 * 1. Finds all emails that have follow-ups
 * 2. Sets their needsFollowUp flag to true
 * 3. Finds all emails without follow-ups
 * 4. Sets their needsFollowUp flag to false
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Email = require('./models/emailModel');
const Followup = require('./models/followupModel');
const User = require('./models/userModel');

// Connect to MongoDB
connectDB();

const resetEmailFlags = async () => {
  try {
    console.log('=== EMAIL FOLLOW-UP FLAG RESET ===');
    
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      console.log(`\nProcessing user: ${user.name} (${user.email})`);
      
      // Find all emails for this user
      const emails = await Email.find({ user: user._id });
      console.log(`Found ${emails.length} emails`);
      
      let updatedCount = 0;
      let noChangeCount = 0;
      
      // Process each email
      for (const email of emails) {
        // Find follow-ups for this email
        const followup = await Followup.findOne({ 
          user: user._id,
          emailId: email.messageId
        });
        
        const shouldHaveFollowUp = !!followup;
        
        // Only update if current status doesn't match desired status
        if (email.needsFollowUp !== shouldHaveFollowUp) {
          await Email.updateOne(
            { _id: email._id },
            { 
              $set: { 
                needsFollowUp: shouldHaveFollowUp,
                followUpDueDate: followup ? followup.dueDate : null
              }
            }
          );
          updatedCount++;
          console.log(`Updated email "${email.subject}": needsFollowUp = ${shouldHaveFollowUp}`);
        } else {
          noChangeCount++;
        }
      }
      
      console.log(`\nUpdated ${updatedCount} emails for user ${user.name}`);
      console.log(`${noChangeCount} emails were already correct`);
    }
    
    console.log('\n=== EMAIL FLAG RESET COMPLETE ===');
    
  } catch (error) {
    console.error('Error during email flag reset:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the reset
resetEmailFlags();
