/**
 * User Login Diagnostic Tool
 * 
 * This script verifies a user's existence in the database and tests
 * password validation to diagnose login issues.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/userModel');
require('dotenv').config();

async function diagnoseBcryptVersion() {
  // Test different bcrypt implementations
  console.log('Testing bcrypt compatibility...');
  
  try {
    const testPassword = 'testpassword';
    
    // Create test hashes
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(testPassword, salt);
    
    console.log('Hash generation successful:', hash.substring(0, 10) + '...');
    
    // Test verification
    const isMatch = await bcrypt.compare(testPassword, hash);
    console.log('Hash verification:', isMatch ? 'SUCCESSFUL' : 'FAILED');
    
    if (!isMatch) {
      console.log('ERROR: Bcrypt verification failed, may indicate incompatible versions');
    }
  } catch (err) {
    console.error('Bcrypt error:', err);
  }
}

async function diagnoseUserLogin(email, password) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`ERROR: No user found with email: ${email}`);
      return;
    }
    
    console.log(`User found: ${user.name} (${user.email})`);
    console.log(`User ID: ${user._id}`);
    console.log(`Role: ${user.role}`);
    console.log(`Password hash: ${user.password.substring(0, 10)}...`);
    
    // Test password
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      console.log(`Password verification: ${isMatch ? 'SUCCESSFUL' : 'FAILED'}`);
      
      if (!isMatch) {
        console.log('The password does not match the stored hash.');
        
        // Create a new hash to compare
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(password, salt);
        console.log(`New hash generated: ${newHash.substring(0, 10)}...`);
        
        // Check if hashes are totally different (suggests bcrypt incompatibility)
        if (newHash.substring(0, 7) !== user.password.substring(0, 7)) {
          console.log('NOTICE: Hash formats appear different, may indicate bcrypt version mismatch');
        }
      }
    } catch (bcryptError) {
      console.error('Error during password verification:', bcryptError);
    }
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('Error diagnosing user login:', error);
  }
}

async function createUserWithPlainTextPassword(email, password) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return;
    }
    
    // Update user with plaintext password for direct comparison
    user._plainTextPassword = password; // Add plaintext field for comparison (not secure!)
    await user.save();
    
    console.log(`Added plaintext comparison field to user: ${user.email}`);
    console.log('WARNING: This is for debugging only, remove after testing!');
    
    // Close MongoDB connection
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error adding plaintext field:', error);
  }
}

async function fixUserPassword(email, password) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`ERROR: No user found with email: ${email}`);
      return;
    }
    
    console.log(`User found: ${user.name} (${user.email})`);
    
    // Hash password without using mongoose middleware
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update user password directly in database (bypass middleware)
    const result = await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );
    
    console.log(`Password updated for user: ${user.email}`);
    console.log(`Update result: ${result.modifiedCount} document(s) modified`);
    
    // Verify update
    const updatedUser = await User.findById(user._id);
    console.log(`New password hash: ${updatedUser.password.substring(0, 10)}...`);
    
    // Test new password
    const isMatch = await bcrypt.compare(password, updatedUser.password);
    console.log(`New password verification: ${isMatch ? 'SUCCESSFUL' : 'FAILED'}`);
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('Error fixing user password:', error);
  }
}

// Get email and password from command line
const args = process.argv.slice(2);
const email = args[0] || 'test@example.com';
const password = args[1] || 'password123';
const action = args[2] || 'diagnose';

// Run function based on action
if (action === 'diagnose') {
  console.log(`Diagnosing login for user: ${email}`);
  diagnoseBcryptVersion().then(() => {
    diagnoseUserLogin(email, password);
  });
} else if (action === 'fix') {
  console.log(`Fixing password for user: ${email}`);
  fixUserPassword(email, password);
} else if (action === 'plaintext') {
  console.log(`Adding plaintext field for user: ${email}`);
  createUserWithPlainTextPassword(email, password);
} else {
  console.log(`Unknown action: ${action}`);
  console.log('Available actions: diagnose, fix, plaintext');
}
