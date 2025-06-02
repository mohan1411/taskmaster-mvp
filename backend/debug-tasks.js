// Debug task visibility issues
const mongoose = require('mongoose');
const config = require('../config/config');

console.log('=== Task Visibility Debug ===');

const debugTasks = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.mongoUri);
    console.log('✓ Database connected');

    // Check if Task model exists
    let Task;
    try {
      Task = require('../models/taskModel');
      console.log('✓ Task model loaded successfully');
    } catch (modelError) {
      console.log('❌ Task model error:', modelError.message);
      return;
    }

    // Count total tasks in database
    const totalTasks = await Task.countDocuments();
    console.log(`📊 Total tasks in database: ${totalTasks}`);

    // Check for tasks from email extraction
    const emailTasks = await Task.find({ emailSource: { $exists: true } });
    console.log(`📧 Tasks extracted from emails: ${emailTasks.length}`);

    // Show recent tasks
    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');

    console.log('\n=== Recent Tasks ===');
    for (const task of recentTasks) {
      console.log(`📋 ${task.title}`);
      console.log(`   User: ${task.user?.email || task.user}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Created: ${task.createdAt}`);
      console.log(`   Email Source: ${task.emailSource || 'None'}`);
      console.log('---');
    }

    // Check for tasks by user
    const users = await Task.distinct('user');
    console.log(`\n👥 Users with tasks: ${users.length}`);

    for (const userId of users) {
      const userTasks = await Task.find({ user: userId });
      console.log(`   User ${userId}: ${userTasks.length} tasks`);
    }

    // Check task schema
    console.log('\n=== Task Schema Fields ===');
    const sampleTask = await Task.findOne();
    if (sampleTask) {
      console.log('Sample task fields:', Object.keys(sampleTask.toObject()));
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

debugTasks();
