/**
 * Test User Creator
 * 
 * This script creates a new test user in the TaskMaster database
 * for testing purposes.
 */

const mongoose = require('mongoose');
const User = require('./models/userModel');
const Settings = require('./models/settingsModel');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Create test user data
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    };
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: testUser.email });
    
    if (existingUser) {
      console.log(`Test user already exists with email: ${testUser.email}`);
      console.log(`User ID: ${existingUser._id}`);
      
      // Ask if we should update the password
      console.log('Updating password for existing test user...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      
      // Update user
      existingUser.password = hashedPassword;
      await existingUser.save();
      
      console.log('Password updated successfully!');
      console.log(`Email: ${testUser.email}`);
      console.log(`Password: ${testUser.password}`);
      console.log(`User ID: ${existingUser._id}`);
      
      // Close connection and exit
      await mongoose.connection.close();
      return;
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    
    // Create new user
    const newUser = new User({
      name: testUser.name,
      email: testUser.email,
      password: hashedPassword,
      role: testUser.role,
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Save user
    const savedUser = await newUser.save();
    console.log(`Test user created with ID: ${savedUser._id}`);
    
    // Create settings for user
    const settings = new Settings({
      user: savedUser._id,
      theme: 'light',
      language: 'en',
      emailNotifications: true,
      pushNotifications: true
    });
    
    // Save settings
    await settings.save();
    console.log('User settings created');
    
    // Success message
    console.log('\nTest user created successfully:');
    console.log(`Name: ${testUser.name}`);
    console.log(`Email: ${testUser.email}`);
    console.log(`Password: ${testUser.password}`);
    console.log(`User ID: ${savedUser._id}`);
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

// Run function
createTestUser();
