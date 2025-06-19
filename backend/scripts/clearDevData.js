const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const Task = require('../models/taskModel');
const Email = require('../models/emailModel');
const FollowUp = require('../models/followUpModel');
const FocusSession = require('../models/focusSessionModel');
const FocusPattern = require('../models/focusPatternModel');

async function clearDevData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear collections (except User)
    console.log('Clearing tasks...');
    await Task.deleteMany({});
    
    console.log('Clearing emails...');
    await Email.deleteMany({});
    
    console.log('Clearing follow-ups...');
    await FollowUp.deleteMany({});
    
    console.log('Clearing focus sessions...');
    await FocusSession.deleteMany({});
    
    console.log('Clearing focus patterns...');
    await FocusPattern.deleteMany({});
    
    console.log('All data cleared except users!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
}

// Run the script
clearDevData();