@echo off
echo TaskMaster Password Reset Tool
echo -----------------------------
echo.

set /p email=Enter your email: 
set /p password=Enter new password: 

echo.
echo Installing required dependencies...
cd /d "%~dp0"
mkdir temp-tools 2>nul
cd temp-tools

echo Creating package.json...
echo {^
  "name": "taskmaster-reset-tools",^
  "version": "1.0.0",^
  "description": "Tools to reset TaskMaster passwords",^
  "main": "index.js",^
  "dependencies": {^
    "mongoose": "^6.9.0",^
    "bcryptjs": "^2.4.3",^
    "dotenv": "^16.0.3"^
  }^
} > package.json

echo Installing packages (this may take a moment)...
call npm install

echo.
echo Resetting password for %email%...
echo.

echo const mongoose = require('mongoose');^
const bcrypt = require('bcryptjs');^
const fs = require('fs');^
^
// Read .env file content from the backend directory^
const envPath = '../backend/.env';^
const envContent = fs.readFileSync(envPath, 'utf8');^
^
// Parse .env content manually^
const envVars = {};^
envContent.split('\n').forEach(line => {^
  if (line.trim() && !line.startsWith('#')) {^
    const [key, ...valueParts] = line.split('=');^
    if (key && valueParts.length > 0) {^
      envVars[key.trim()] = valueParts.join('=').trim();^
    }^
  }^
});^
^
// Get MongoDB URI from parsed .env^
const uri = envVars.MONGODB_URI || 'mongodb://localhost:27017/taskmaster';^
const email = '%email%';^
const newPassword = '%password%';^
^
console.log(`Connecting to MongoDB: ${uri.includes('@') ? uri.replace(/\/\/(.+?)@/, '//***@') : uri}`);^
^
// Connect to MongoDB^
mongoose.connect(uri, {^
  useNewUrlParser: true,^
  useUnifiedTopology: true,^
})^
.then(async () => {^
  console.log('MongoDB connected');^
  ^
  // Define User schema to match your existing schema^
  const userSchema = new mongoose.Schema({^
    name: String,^
    email: String,^
    password: String,^
    googleId: String,^
    avatar: String,^
    role: String,^
    isEmailVerified: Boolean,^
    refreshToken: String,^
    resetPasswordToken: String,^
    resetPasswordExpire: Date,^
    createdAt: Date,^
    updatedAt: Date^
  });^
  ^
  // Create User model^
  const User = mongoose.model('User', userSchema);^
  ^
  try {^
    // Hash the new password^
    const salt = await bcrypt.genSalt(10);^
    const hashedPassword = await bcrypt.hash(newPassword, 10);^
    ^
    // Find user by email and update password^
    const user = await User.findOne({ email });^
    ^
    if (!user) {^
      console.error(`User with email ${email} not found`);^
      process.exit(1);^
    }^
    ^
    user.password = hashedPassword;^
    user.resetPasswordToken = undefined;^
    user.resetPasswordExpire = undefined;^
    ^
    await user.save();^
    ^
    console.log(`Password reset successful for ${email}`);^
    process.exit(0);^
  } catch (error) {^
    console.error('Error resetting password:', error);^
    process.exit(1);^
  }^
})^
.catch(err => {^
  console.error('MongoDB connection error:', err);^
  process.exit(1);^
}); > reset-script.js

node reset-script.js

echo.
echo Password reset process completed.
echo.
pause
