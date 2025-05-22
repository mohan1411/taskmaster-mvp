// test-reminders.js
// Test script to verify reminder functionality

// Load environment variables
require('dotenv').config();

// Import the reminder controller
const { processReminders } = require('./controllers/reminderController');

// Import database connection
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB()
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      console.log('Testing reminder processing...');
      const result = await processReminders();
      console.log('Reminder processing result:', result);
    } catch (error) {
      console.error('Error testing reminders:', error);
    } finally {
      // Disconnect from MongoDB after test
      console.log('Test complete. Disconnecting from MongoDB...');
      await require('mongoose').disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
