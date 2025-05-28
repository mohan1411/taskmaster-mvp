@echo off
echo TaskMaster - List All Users
echo -------------------------
echo.

echo Installing required dependencies...
cd /d "%~dp0"
mkdir temp-tools 2>nul
cd temp-tools

echo Creating package.json...
echo {^
  "name": "taskmaster-list-tool",^
  "version": "1.0.0",^
  "description": "Tool to list users in TaskMaster",^
  "main": "index.js",^
  "dependencies": {^
    "mongoose": "^6.9.0",^
    "dotenv": "^16.0.3"^
  }^
} > package.json

echo Installing packages (this may take a moment)...
call npm install

echo.
echo Listing all users...
echo.

echo const mongoose = require('mongoose');^
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
    // Find all users^
    const users = await User.find({});^
    ^
    if (users.length === 0) {^
      console.log('No users found in the database.');^
      process.exit(0);^
    }^
    ^
    console.log(`Found ${users.length} users in the database:`);^
    console.log('------------------------------------------');^
    ^
    users.forEach((user, index) => {^
      console.log(`User ${index + 1}:`);^
      console.log(`Name: ${user.name}`);^
      console.log(`Email: ${user.email}`);^
      console.log(`Role: ${user.role || 'user'}`);^
      console.log(`Email verified: ${user.isEmailVerified ? 'Yes' : 'No'}`);^
      console.log(`Created: ${user.createdAt}`);^
      console.log('------------------------------------------');^
    });^
    ^
    process.exit(0);^
  } catch (error) {^
    console.error('Error listing users:', error);^
    process.exit(1);^
  }^
})^
.catch(err => {^
  console.error('MongoDB connection error:', err);^
  process.exit(1);^
}); > list-script.js

node list-script.js

echo.
echo Listing users process completed.
echo.
pause
