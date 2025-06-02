// Check task extraction and creation process
const mongoose = require('mongoose');
const config = require('../config/config');
const Email = require('../models/emailModel');

console.log('=== Task Extraction Process Debug ===');

const debugTaskExtraction = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.mongoUri);
    console.log('✓ Database connected');

    // Find emails that have tasks extracted
    const emailsWithTasks = await Email.find({ taskExtracted: true });
    console.log(`📧 Emails marked as task extracted: ${emailsWithTasks.length}`);

    // Check recent email extraction activity
    const recentEmails = await Email.find()
      .sort({ createdAt: -1 })
      .limit(10);

    console.log('\n=== Recent Email Extraction Status ===');
    for (const email of recentEmails) {
      console.log(`📧 Subject: ${email.subject}`);
      console.log(`   Task Extracted: ${email.taskExtracted || false}`);
      console.log(`   Message ID: ${email.messageId}`);
      console.log(`   User: ${email.user}`);
      console.log('---');
    }

    // Check if tasks are created with emailSource reference
    let Task;
    try {
      Task = require('../models/taskModel');
      
      // Find tasks that reference emails
      const tasksFromEmails = await Task.find({ 
        $or: [
          { emailSource: { $exists: true } },
          { emailId: { $exists: true } },
          { source: 'email' }
        ]
      });
      
      console.log(`\n📋 Tasks created from emails: ${tasksFromEmails.length}`);
      
      // Show details of email-sourced tasks
      for (const task of tasksFromEmails) {
        console.log(`📋 Task: ${task.title}`);
        console.log(`   Email Source: ${task.emailSource || task.emailId || 'Unknown'}`);
        console.log(`   User: ${task.user}`);
        console.log(`   Status: ${task.status}`);
        console.log('---');
      }

    } catch (taskError) {
      console.log('❌ Task model issue:', taskError.message);
    }

    // Check email task extractor function
    console.log('\n=== Checking Task Extractor ===');
    try {
      const { extractTasksFromEmail } = require('../controllers/emailTaskExtractor');
      console.log('✓ Task extractor function found');
      
      // Test with a sample email
      if (recentEmails.length > 0) {
        console.log('\nTesting task extraction with recent email...');
        const testEmail = recentEmails[0];
        
        const result = await extractTasksFromEmail(testEmail);
        console.log('Extraction result:', result);
      }
      
    } catch (extractorError) {
      console.log('❌ Task extractor error:', extractorError.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

debugTaskExtraction();
