// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('./config/config');
const connectDB = require('./config/db');
const User = require('./models/userModel');
const { syncEmails } = require('./controllers/emailController-debug');

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Find user and test auth
const testSync = async () => {
  try {
    console.log('Starting Gmail sync test...');
    console.log('Looking for user...');
    
    // Find a user to test with
    const user = await User.findOne({});
    
    if (!user) {
      console.error('ERROR: No users found in the database');
      process.exit(1);
    }
    
    console.log(`Found user: ${user.name} (${user.email})`);
    
    // Create test request with user authentication
    const testReq = {
      user: user
    };
    
    // Create test response
    const testRes = {
      status: (code) => {
        console.log(`Response status: ${code}`);
        return testRes;
      },
      json: (data) => {
        console.log('Response data:');
        console.log(JSON.stringify(data, null, 2));
        
        // Exit after response
        setTimeout(() => {
          console.log('Test completed');
          process.exit(0);
        }, 1000);
      }
    };
    
    // Call sync function
    console.log('Calling syncEmails function...');
    await syncEmails(testReq, testRes);
    
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
};

// Run the test
testSync();
