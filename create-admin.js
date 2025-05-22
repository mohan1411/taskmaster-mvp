const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './backend/.env' });

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
  
  // Define Settings schema
  const settingsSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    theme: {
      type: String,
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    }
  });
  
  // Create models
  const User = mongoose.model('User', userSchema);
  const Settings = mongoose.model('Settings', settingsSchema);
  
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@taskmaster.com' });
    
    if (existingAdmin) {
      // Reset admin password if exists
      const hashedPassword = await bcrypt.hash('admin123', 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.isEmailVerified = true;
      await existingAdmin.save();
      console.log('Admin user password reset to: admin123');
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = new User({
        name: 'Admin',
        email: 'admin@taskmaster.com',
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await adminUser.save();
      
      // Create settings for admin user
      await new Settings({
        user: adminUser._id
      }).save();
      
      console.log('Admin user created with:');
      console.log('Email: admin@taskmaster.com');
      console.log('Password: admin123');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
