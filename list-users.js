// This script is designed to be run from the backend directory
// to use the existing node_modules
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmaster';

// Connect to MongoDB
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected');
  
  // Define User schema to match your existing schema
  const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    googleId: String,
    avatar: String,
    role: String,
    isEmailVerified: Boolean,
    refreshToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: Date,
    updatedAt: Date
  });
  
  // Create User model
  const User = mongoose.model('User', userSchema);
  
  try {
    // Find all users
    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('No users found in the database.');
      process.exit(0);
    }
    
    console.log(`Found ${users.length} users in the database:`);
    console.log('------------------------------------------');
    
    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role || 'user'}`);
      console.log(`Email verified: ${user.isEmailVerified ? 'Yes' : 'No'}`);
      console.log(`Created: ${user.createdAt}`);
      console.log('------------------------------------------');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Check that your MongoDB connection is working and accessible.');
  console.log('Connection string used (partially hidden):');
  console.log(`${uri.replace(/\/\/(.+?)@/, '//***@')}`);
  process.exit(1);
});
