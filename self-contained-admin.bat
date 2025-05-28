@echo off
echo TaskMaster - Create Admin Account
echo -------------------------------
echo.

echo Installing required dependencies...
cd /d "%~dp0"
mkdir temp-tools 2>nul
cd temp-tools

echo Creating package.json...
echo {^
  "name": "taskmaster-admin-tool",^
  "version": "1.0.0",^
  "description": "Tool to create admin account for TaskMaster",^
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
echo Creating admin account...
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
  // Define Settings schema^
  const settingsSchema = new mongoose.Schema({^
    user: {^
      type: mongoose.Schema.Types.ObjectId,^
      ref: 'User'^
    },^
    theme: {^
      type: String,^
      default: 'light'^
    },^
    language: {^
      type: String,^
      default: 'en'^
    },^
    emailNotifications: {^
      type: Boolean,^
      default: true^
    },^
    pushNotifications: {^
      type: Boolean,^
      default: true^
    }^
  });^
  ^
  // Create models^
  const User = mongoose.model('User', userSchema);^
  const Settings = mongoose.model('Settings', settingsSchema);^
  ^
  try {^
    // Check if admin user already exists^
    const existingAdmin = await User.findOne({ email: 'admin@taskmaster.com' });^
    ^
    if (existingAdmin) {^
      // Reset admin password if exists^
      const hashedPassword = await bcrypt.hash('admin123', 10);^
      existingAdmin.password = hashedPassword;^
      existingAdmin.isEmailVerified = true;^
      await existingAdmin.save();^
      console.log('Admin user password reset to: admin123');^
    } else {^
      // Create admin user^
      const hashedPassword = await bcrypt.hash('admin123', 10);^
      const adminUser = new User({^
        name: 'Admin',^
        email: 'admin@taskmaster.com',^
        password: hashedPassword,^
        role: 'admin',^
        isEmailVerified: true,^
        createdAt: new Date(),^
        updatedAt: new Date()^
      });^
      ^
      await adminUser.save();^
      ^
      // Create settings for admin user^
      await new Settings({^
        user: adminUser._id^
      }).save();^
      ^
      console.log('Admin user created with:');^
      console.log('Email: admin@taskmaster.com');^
      console.log('Password: admin123');^
    }^
    ^
    process.exit(0);^
  } catch (error) {^
    console.error('Error creating admin user:', error);^
    process.exit(1);^
  }^
})^
.catch(err => {^
  console.error('MongoDB connection error:', err);^
  process.exit(1);^
}); > admin-script.js

node admin-script.js

echo.
echo Admin account creation process completed.
echo.
pause
