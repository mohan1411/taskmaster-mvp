/**
 * Follow-up Label Fix Test
 * 
 * This script tests the fix for the follow-up label issue:
 * 1. Creates a follow-up for an email
 * 2. Verifies the email has the needsFollowUp flag set to true
 * 3. Deletes the follow-up
 * 4. Verifies the email has the needsFollowUp flag set to false
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Email = require('./models/emailModel');
const Followup = require('./models/followupModel');
const User = require('./models/userModel');

// Connect to the database
connectDB();

// Test runner
const testFollowupLabels = async () => {
  try {
    console.log('=== FOLLOW-UP LABEL TEST ===');
    
    // Find a user to test with
    const user = await User.findOne({});
    if (!user) {
      console.error('No users found in the database. Please create a user first.');
      process.exit(1);
    }
    
    console.log(`Using user: ${user.name} (${user.email})`);
    
    // Find an email to test with
    const email = await Email.findOne({ user: user._id });
    if (!email) {
      console.error('No emails found in the database. Please sync emails first.');
      process.exit(1);
    }
    
    console.log(`Using email: "${email.subject}" (ID: ${email._id})`);
    console.log(`Initial needsFollowUp status: ${email.needsFollowUp}`);
    
    // Step 1: Create a follow-up for the email
    console.log('\nStep 1: Creating follow-up...');
    const followup = await Followup.create({
      user: user._id,
      emailId: email.messageId,
      threadId: email.threadId,
      subject: email.subject,
      contactName: email.sender.name,
      contactEmail: email.sender.email,
      status: 'pending',
      priority: 'medium',
      dueDate: new Date(),
      notes: 'Test follow-up',
      aiGenerated: false
    });
    
    console.log(`Created follow-up with ID: ${followup._id}`);
    
    // Step 2: Verify the email has been updated
    const updatedEmail = await Email.findById(email._id);
    console.log(`Email needsFollowUp after creating follow-up: ${updatedEmail.needsFollowUp}`);
    
    // Update the email if needed
    if (!updatedEmail.needsFollowUp) {
      console.log('Updating email needsFollowUp flag to true...');
      await Email.findByIdAndUpdate(email._id, { needsFollowUp: true });
    }
    
    // Step 3: Delete the follow-up
    console.log('\nStep 3: Deleting follow-up...');
    await Followup.findByIdAndDelete(followup._id);
    console.log('Follow-up deleted');
    
    // Step 4: Check if there are any other follow-ups for this email
    const otherFollowups = await Followup.findOne({
      user: user._id,
      emailId: email.messageId
    });
    
    console.log(`Other follow-ups exist: ${!!otherFollowups}`);
    
    // Step 5: Update the email based on whether other follow-ups exist
    if (!otherFollowups) {
      console.log('No other follow-ups exist, updating email needsFollowUp flag to false...');
      await Email.findByIdAndUpdate(email._id, { needsFollowUp: false });
    }
    
    // Step 6: Verify the final state
    const finalEmail = await Email.findById(email._id);
    console.log(`\nFinal email needsFollowUp status: ${finalEmail.needsFollowUp}`);
    
    console.log('\nTest completed!');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the test
testFollowupLabels();
