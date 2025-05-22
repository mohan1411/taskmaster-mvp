// This script is designed to be run from the backend directory
// to use the existing node_modules
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmaster';
const email = process.argv[2]; // Get email from command line

if (!email) {
  console.error('Please provide an email address to check');
  console.error('Usage: node check-user.js youremail@example.com');
  process.exit(1);
}

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
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`No user found with email: ${email}`);
      console.log('Note: Email addresses are case-sensitive in MongoDB.');
      console.log('Try the create-admin-fixed.bat script to create a default admin account.');
      process.exit(1);
    }
    
    console.log(`User found with email: ${email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log(`Email verified: ${user.isEmailVerified ? 'Yes' : 'No'}`);
    console.log(`Account created: ${user.createdAt}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking user:', error);
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
