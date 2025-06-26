const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Email = require('../models/emailModel');
const User = require('../models/userModel');
const FocusSession = require('../models/focusSessionModel');
const FocusPattern = require('../models/focusPatternModel');

async function fixEmailsAndClearFocus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the newuser@example.com
    const newUser = await User.findOne({ email: 'newuser@example.com' });
    if (!newUser) {
      console.error('User newuser@example.com not found!');
      process.exit(1);
    }

    console.log(`Found user: ${newUser.email} with ID: ${newUser._id}`);

    // Update all emails to belong to newuser@example.com
    console.log('Updating email ownership...');
    const updateResult = await Email.updateMany(
      {},
      { $set: { user: newUser._id } }
    );
    console.log(`Updated ${updateResult.modifiedCount} emails to belong to ${newUser.email}`);

    // Clear all focus sessions and patterns
    console.log('Clearing focus sessions...');
    await FocusSession.deleteMany({});
    
    console.log('Clearing focus patterns...');
    await FocusPattern.deleteMany({});

    // Reset user's focus-related fields if they exist
    if (newUser.focusMetrics || newUser.todaysFocusTime || newUser.weeklyFocusTime) {
      console.log('Resetting user focus metrics...');
      await User.updateOne(
        { _id: newUser._id },
        { 
          $set: { 
            'focusMetrics.todaysFocusTime': 0,
            'focusMetrics.weeklyFocusTime': 0,
            'focusMetrics.sessionsCompleted': 0,
            'focusMetrics.currentStreak': 0
          }
        }
      );
    }

    console.log('All done!');
    
    // Verify the changes
    const emailCount = await Email.countDocuments({ user: newUser._id });
    console.log(`\nVerification: ${newUser.email} now has ${emailCount} emails`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
fixEmailsAndClearFocus();