// This script is designed to be run from the backend directory
// to use the existing node_modules
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmaster';
const email = process.argv[2]; // Get email from command line
const newPassword = process.argv[3]; // Get new password from command line

if (!email || !newPassword) {
  console.error('Please provide email and new password as arguments');
  console.error('Usage: node reset-password-fixed.js youremail@example.com newpassword');
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
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Find user by email and update password
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }
    
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    console.log(`Password reset successful for ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
