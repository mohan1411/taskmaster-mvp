const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/userModel');
const Email = require('./models/emailModel');
const Task = require('./models/taskModel');
const Document = require('./models/documentModel');
const FollowUp = require('./models/followupModel');

const cleanDemoData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmaster', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
    
    // Find demo user
    const demoUser = await User.findOne({ email: 'newuser@example.com' });
    
    if (demoUser) {
      console.log('🧹 Cleaning demo data for user:', demoUser.email);
      
      // Delete all related data
      const results = await Promise.all([
        Task.deleteMany({ user: demoUser._id }),
        Email.deleteMany({ user: demoUser._id }),
        Document.deleteMany({ user: demoUser._id }),
        FollowUp.deleteMany({ user: demoUser._id }),
        User.deleteOne({ _id: demoUser._id })
      ]);
      
      console.log('✅ Deleted:');
      console.log(`   - ${results[0].deletedCount} tasks`);
      console.log(`   - ${results[1].deletedCount} emails`);
      console.log(`   - ${results[2].deletedCount} documents`);
      console.log(`   - ${results[3].deletedCount} follow-ups`);
      console.log(`   - ${results[4].deletedCount} user`);
    } else {
      console.log('ℹ️  No demo user found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
};

cleanDemoData();