/**
 * Email Status Checker
 * 
 * This script lets you check the status of a specific email
 * to verify if the needsFollowUp flag is set correctly.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Email = require('./models/emailModel');
const Followup = require('./models/followupModel');
const readline = require('readline');

// Connect to MongoDB
connectDB();

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const checkEmailStatus = async () => {
  try {
    console.log('=== EMAIL STATUS CHECKER ===');
    
    // Get email ID or subject
    rl.question('Enter an email ID or subject to search: ', async (searchTerm) => {
      // Find the email(s)
      const emails = await Email.find({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(searchTerm) ? searchTerm : null },
          { subject: { $regex: searchTerm, $options: 'i' } }
        ]
      }).limit(5);
      
      if (emails.length === 0) {
        console.log('No emails found matching your search term.');
        closeAndExit();
        return;
      }
      
      console.log(`Found ${emails.length} matching emails:`);
      
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        console.log(`\n[${i + 1}] ID: ${email._id}`);
        console.log(`    Subject: ${email.subject}`);
        console.log(`    From: ${email.sender.name} (${email.sender.email})`);
        console.log(`    needsFollowUp: ${email.needsFollowUp}`);
        if (email.followUpDueDate) {
          console.log(`    followUpDueDate: ${new Date(email.followUpDueDate).toLocaleString()}`);
        }
        
        // Find follow-ups for this email
        const followups = await Followup.find({ emailId: email.messageId });
        console.log(`    Follow-ups: ${followups.length}`);
        
        followups.forEach((followup, idx) => {
          console.log(`      Follow-up #${idx + 1}: ${followup._id}`);
          console.log(`      Status: ${followup.status}`);
          console.log(`      Due Date: ${new Date(followup.dueDate).toLocaleString()}`);
        });
      }
      
      // Ask if user wants to fix the email status
      rl.question('\nDo you want to fix any email statuses? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          rl.question('Enter the number of the email to fix: ', async (num) => {
            const index = parseInt(num) - 1;
            if (index >= 0 && index < emails.length) {
              const email = emails[index];
              
              // Find follow-ups for this email
              const followups = await Followup.find({ emailId: email.messageId });
              
              // Set needsFollowUp based on existence of follow-ups
              const shouldHaveFollowUp = followups.length > 0;
              
              // Update email
              await Email.updateOne(
                { _id: email._id },
                { 
                  $set: { 
                    needsFollowUp: shouldHaveFollowUp,
                    followUpDueDate: shouldHaveFollowUp && followups[0] ? followups[0].dueDate : null
                  }
                }
              );
              
              console.log(`\nUpdated email "${email.subject}": needsFollowUp = ${shouldHaveFollowUp}`);
            } else {
              console.log('Invalid selection.');
            }
            closeAndExit();
          });
        } else {
          closeAndExit();
        }
      });
    });
  } catch (error) {
    console.error('Error during email check:', error);
    closeAndExit();
  }
};

const closeAndExit = () => {
  rl.close();
  mongoose.connection.close();
  process.exit(0);
};

// Run the checker
checkEmailStatus();
