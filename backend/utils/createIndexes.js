const mongoose = require('mongoose');
const Task = require('../models/taskModel');
const User = require('../models/userModel');
const Email = require('../models/emailModel');
const Followup = require('../models/followupModel');
const Settings = require('../models/settingsModel');
const FocusSession = require('../models/focusSessionModel');
const FocusPattern = require('../models/focusPatternModel');

/**
 * Create database indexes for optimal performance
 */
const createIndexes = async () => {
  console.log('Creating database indexes...');
  
  try {
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ googleId: 1 }, { sparse: true });
    await User.collection.createIndex({ resetPasswordToken: 1 }, { sparse: true });
    await User.collection.createIndex({ verificationToken: 1 }, { sparse: true });
    console.log('✓ User indexes created');
    
    // Task indexes
    await Task.collection.createIndex({ user: 1, status: 1 });
    await Task.collection.createIndex({ user: 1, dueDate: 1 });
    await Task.collection.createIndex({ user: 1, priority: 1 });
    await Task.collection.createIndex({ user: 1, category: 1 });
    await Task.collection.createIndex({ user: 1, createdAt: -1 });
    await Task.collection.createIndex({ emailSource: 1 }, { sparse: true });
    await Task.collection.createIndex({ 
      title: 'text', 
      description: 'text' 
    }, { 
      weights: { title: 2, description: 1 } 
    });
    console.log('✓ Task indexes created');
    
    // Email indexes
    await Email.collection.createIndex({ user: 1, receivedAt: -1 });
    await Email.collection.createIndex({ user: 1, messageId: 1 }, { unique: true });
    await Email.collection.createIndex({ user: 1, threadId: 1 });
    await Email.collection.createIndex({ user: 1, 'sender.email': 1 });
    await Email.collection.createIndex({ user: 1, isRead: 1 });
    await Email.collection.createIndex({ user: 1, needsFollowUp: 1 });
    await Email.collection.createIndex({ user: 1, taskExtracted: 1 });
    await Email.collection.createIndex({ 
      subject: 'text', 
      snippet: 'text' 
    });
    console.log('✓ Email indexes created');
    
    // Followup indexes
    await Followup.collection.createIndex({ user: 1, status: 1 });
    await Followup.collection.createIndex({ user: 1, dueDate: 1 });
    await Followup.collection.createIndex({ user: 1, emailId: 1 });
    await Followup.collection.createIndex({ user: 1, threadId: 1 });
    await Followup.collection.createIndex({ user: 1, contactEmail: 1 });
    await Followup.collection.createIndex({ user: 1, createdAt: -1 });
    await Followup.collection.createIndex({ 
      subject: 'text', 
      notes: 'text' 
    });
    console.log('✓ Followup indexes created');
    
    // Settings indexes
    await Settings.collection.createIndex({ user: 1 }, { unique: true });
    console.log('✓ Settings indexes created');
    
    // Focus Session indexes
    await FocusSession.collection.createIndex({ user: 1, startTime: -1 });
    await FocusSession.collection.createIndex({ user: 1, sessionType: 1 });
    await FocusSession.collection.createIndex({ user: 1, active: 1 });
    await FocusSession.collection.createIndex({ user: 1, endTime: -1 });
    await FocusSession.collection.createIndex({ 'environment.location': 1 }, { sparse: true });
    console.log('✓ Focus Session indexes created');
    
    // Focus Pattern indexes
    await FocusPattern.collection.createIndex({ user: 1 }, { unique: true });
    await FocusPattern.collection.createIndex({ 'dailyPatterns.dayOfWeek': 1 });
    console.log('✓ Focus Pattern indexes created');
    
    // Compound indexes for common queries
    await Task.collection.createIndex({ 
      user: 1, 
      status: 1, 
      priority: 1, 
      dueDate: 1 
    });
    
    await Email.collection.createIndex({ 
      user: 1, 
      isRead: 1, 
      receivedAt: -1 
    });
    
    await Followup.collection.createIndex({ 
      user: 1, 
      status: 1, 
      dueDate: 1 
    });
    
    console.log('✓ Compound indexes created');
    
    // TTL indexes for automatic cleanup
    await User.collection.createIndex(
      { resetPasswordExpires: 1 }, 
      { expireAfterSeconds: 0, sparse: true }
    );
    
    console.log('✓ TTL indexes created');
    
    console.log('All indexes created successfully!');
    
    // List all indexes for verification
    if (process.env.NODE_ENV === 'development') {
      console.log('\nCurrent indexes:');
      const collections = [
        { name: 'User', model: User },
        { name: 'Task', model: Task },
        { name: 'Email', model: Email },
        { name: 'Followup', model: Followup },
        { name: 'Settings', model: Settings },
        { name: 'FocusSession', model: FocusSession },
        { name: 'FocusPattern', model: FocusPattern }
      ];
      
      for (const { name, model } of collections) {
        const indexes = await model.collection.indexes();
        console.log(`\n${name} indexes:`, indexes.map(idx => ({
          name: idx.name,
          key: idx.key
        })));
      }
    }
    
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
};

// Export for use in other files
module.exports = createIndexes;

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  const connectDB = require('../config/db');
  
  (async () => {
    try {
      await connectDB();
      await createIndexes();
      console.log('\nIndex creation completed!');
      process.exit(0);
    } catch (error) {
      console.error('Failed to create indexes:', error);
      process.exit(1);
    }
  })();
}