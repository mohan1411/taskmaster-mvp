const mongoose = require('mongoose');
const User = require('./models/userModel');
const Task = require('./models/taskModel');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function diagnoseTaskCreation() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find the user
    const userEmail = 'newuser@example.com';
    console.log(`\nLooking for user: ${userEmail}`);
    
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log('✅ User found:', {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    });
    
    // Check existing tasks
    const existingTasks = await Task.find({ user: user._id });
    console.log(`\n📋 Existing tasks for this user: ${existingTasks.length}`);
    
    // Try to create a test task
    console.log('\nAttempting to create a test task...');
    
    const testTask = new Task({
      user: user._id,
      title: 'Test Task from Diagnostic Script',
      description: 'This is a test task created by the diagnostic script',
      priority: 'medium',
      status: 'pending',
      category: 'test',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      labels: ['test', 'diagnostic']
    });
    
    const savedTask = await testTask.save();
    console.log('✅ Test task created successfully:', {
      id: savedTask._id,
      title: savedTask.title,
      status: savedTask.status
    });
    
    // Check if we can find the task
    const foundTask = await Task.findById(savedTask._id);
    if (foundTask) {
      console.log('✅ Task can be retrieved successfully');
    } else {
      console.log('❌ Task could not be retrieved');
    }
    
    // Clean up - delete the test task
    await Task.deleteOne({ _id: savedTask._id });
    console.log('🧹 Test task cleaned up');
    
    console.log('\n✨ Diagnosis complete - No issues found with task creation');
    
  } catch (error) {
    console.error('\n❌ Error during diagnosis:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

diagnoseTaskCreation();
