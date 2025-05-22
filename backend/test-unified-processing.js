// Test script for unified email processing
const mongoose = require('mongoose');
const User = require('./models/userModel');
const Email = require('./models/emailModel');
const { processUserEmails } = require('./services/unifiedEmailProcessor');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

// Main function
const testUnifiedProcessing = async () => {
  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  try {
    // Find a user
    const user = await User.findOne({ role: 'admin' });
    if (!user) {
      console.error('No admin user found');
      process.exit(1);
    }

    console.log(`Testing unified processing for user: ${user.email}`);

    // Process user's emails
    const results = await processUserEmails(user, 5);

    console.log('Processing completed:');
    console.log(`- Emails processed: ${results.processed}`);
    console.log(`- Tasks extracted: ${results.tasks.length}`);
    console.log(`- Follow-ups extracted: ${results.followups.length}`);
    console.log(`- Errors: ${results.errors.length}`);

    if (results.tasks.length > 0) {
      console.log('\nExample tasks:');
      results.tasks.slice(0, 3).forEach(task => {
        console.log(`- ${task.title} (Priority: ${task.priority})`);
      });
    }

    if (results.followups.length > 0) {
      console.log('\nExample follow-ups:');
      results.followups.slice(0, 3).forEach(followup => {
        console.log(`- ${followup.title} (Contact: ${followup.contactPerson || 'Not specified'})`);
      });
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the test
testUnifiedProcessing();
