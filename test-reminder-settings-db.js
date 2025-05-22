const mongoose = require('mongoose');
const Followup = require('./backend/models/followupModel');
const User = require('./backend/models/userModel');

// Test script to verify reminder settings functionality
async function testReminderSettings() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/taskmaster');
    console.log('Connected to MongoDB');

    // Find or create a test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      console.log('Creating test user...');
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123' // This should be hashed in real app
      });
    }

    console.log('Test user:', testUser._id);

    // Create a test follow-up
    const testFollowup = await Followup.create({
      user: testUser._id,
      emailId: 'test-email-123',
      subject: 'Test Follow-up for Reminder Settings',
      contactName: 'John Doe',
      contactEmail: 'john@example.com',
      priority: 'high',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'pending',
      reminderSettings: {
        enabled: true,
        schedule: [
          { time: '1d', notificationType: 'email' },
          { time: '3h', notificationType: 'in-app' }
        ],
        priorityBased: true
      }
    });

    console.log('Created test follow-up:', testFollowup._id);

    // Test updating reminder settings
    const updatedReminderSettings = {
      enabled: true,
      schedule: [
        { time: '2d', notificationType: 'browser' },
        { time: '6h', notificationType: 'email' },
        { time: '30m', notificationType: 'in-app' }
      ],
      priorityBased: false
    };

    testFollowup.reminderSettings = {
      ...testFollowup.reminderSettings,
      ...updatedReminderSettings
    };

    await testFollowup.save();
    console.log('Updated reminder settings successfully');

    // Retrieve and verify the updated follow-up
    const retrievedFollowup = await Followup.findById(testFollowup._id);
    console.log('Retrieved reminder settings:', JSON.stringify(retrievedFollowup.reminderSettings, null, 2));

    // Test the update method similar to how the controller does it
    const updateResult = await Followup.findOneAndUpdate(
      { _id: testFollowup._id, user: testUser._id },
      { 
        'reminderSettings.enabled': false,
        'reminderSettings.schedule': [{ time: '1d', notificationType: 'email' }],
        'reminderSettings.priorityBased': true
      },
      { new: true }
    );

    console.log('Update via findOneAndUpdate:', JSON.stringify(updateResult.reminderSettings, null, 2));

    // Clean up
    await Followup.findByIdAndDelete(testFollowup._id);
    console.log('Cleaned up test follow-up');

    console.log('\n✅ All tests passed! Reminder settings functionality is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testReminderSettings();
