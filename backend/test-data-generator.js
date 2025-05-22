/**
 * Large Email Volume Test Generator
 * 
 * This script creates synthetic test emails in the database
 * to simulate a user with 1000+ emails for testing purposes.
 */

const mongoose = require('mongoose');
const User = require('./models/userModel');
const Email = require('./models/emailModel');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

// Configuration
const DEFAULT_EMAIL_COUNT = 1500;

/**
 * Generate synthetic emails and save to database
 * @param {string} userId - User ID
 * @param {number} count - Number of emails to generate
 */
async function generateEmails(userId, count) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found with ID:', userId);
      process.exit(1);
    }
    
    console.log(`Generating ${count} emails for user: ${user.name} (${user.email})`);
    
    // Define time periods
    const now = new Date();
    const periods = [
      { name: 'Last 30 days', start: new Date(now - 30 * 24 * 60 * 60 * 1000), end: now, portion: 0.2 },
      { name: '31-90 days', start: new Date(now - 90 * 24 * 60 * 60 * 1000), end: new Date(now - 30 * 24 * 60 * 60 * 1000), portion: 0.3 },
      { name: '91-365 days', start: new Date(now - 365 * 24 * 60 * 60 * 1000), end: new Date(now - 90 * 24 * 60 * 60 * 1000), portion: 0.3 },
      { name: 'Older than 1 year', start: new Date(now - 730 * 24 * 60 * 60 * 1000), end: new Date(now - 365 * 24 * 60 * 60 * 1000), portion: 0.2 }
    ];
    
    // Project names
    const projects = ['Marketing Campaign', 'Website Redesign', 'Product Launch', 'Customer Survey', 'Strategic Planning'];
    
    // Sender names
    const senders = [
      { name: 'John Smith', email: 'john.smith@company.com' },
      { name: 'Jane Doe', email: 'jane.doe@company.com' },
      { name: 'Marketing Team', email: 'marketing@company.com' },
      { name: 'HR Department', email: 'hr@company.com' },
      { name: 'Project Manager', email: 'projects@company.com' },
      { name: 'IT Support', email: 'support@company.com' },
      { name: 'CEO Office', email: 'ceo@company.com' },
      { name: 'External Client', email: 'client@example.com' }
    ];
    
    // Email templates
    const templates = [
      { subject: 'Meeting about PROJECT', body: 'Hi NAME,\n\nLet\'s schedule a meeting to discuss PROJECT. How does tomorrow at 2pm sound?\n\nRegards,\nSENDER', task: true },
      { subject: 'PROJECT update', body: 'Team,\n\nJust a quick update on PROJECT. We need to finalize the deliverables by Friday.\n\nPlease update your status.\n\nThanks,\nSENDER', task: true },
      { subject: 'Follow up: PROJECT discussion', body: 'Hello NAME,\n\nFollowing our discussion about PROJECT, I wanted to check if you had any questions.\n\nBest,\nSENDER', followup: true },
      { subject: 'Weekly newsletter', body: 'Hello team,\n\nHere\'s this week\'s newsletter with company updates.\n\nHave a great week!\n\nHR Team', task: false },
      { subject: 'PROJECT deadline reminder', body: 'Hi NAME,\n\nThis is a reminder that the PROJECT deadline is approaching. Please submit your work by EOD Friday.\n\nThanks,\nSENDER', task: true }
    ];
    
    // Create emails in batches
    const batchSize = 100;
    let created = 0;
    
    for (let i = 0; i < periods.length; i++) {
      const period = periods[i];
      const periodCount = Math.floor(count * period.portion);
      
      console.log(`Generating ${periodCount} emails for period: ${period.name}`);
      
      for (let j = 0; j < periodCount; j += batchSize) {
        const batch = [];
        const currentBatchSize = Math.min(batchSize, periodCount - j);
        
        for (let k = 0; k < currentBatchSize; k++) {
          // Pick random template, sender, project
          const template = templates[Math.floor(Math.random() * templates.length)];
          const sender = senders[Math.floor(Math.random() * senders.length)];
          const project = projects[Math.floor(Math.random() * projects.length)];
          
          // Create random date in period
          const date = new Date(period.start.getTime() + Math.random() * (period.end.getTime() - period.start.getTime()));
          
          // Create email subject and body
          const subject = template.subject.replace('PROJECT', project);
          const body = template.body
            .replace('NAME', user.name)
            .replace('PROJECT', project)
            .replace('SENDER', sender.name);
          
          // Create email object
          const email = new Email({
            user: user._id,
            from: `${sender.name} <${sender.email}>`,
            subject: subject,
            body: body,
            date: date,
            processed: false
          });
          
          batch.push(email);
        }
        
        // Save batch
        await Email.insertMany(batch);
        created += batch.length;
        
        // Show progress
        process.stdout.write(`.`);
        if (created % 500 === 0) {
          process.stdout.write(` ${created} emails created\n`);
        }
      }
    }
    
    console.log(`\nCreated total of ${created} test emails for user ${user.name}`);
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('Error generating emails:', error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const userId = args[0];
const emailCount = args[1] ? parseInt(args[1]) : DEFAULT_EMAIL_COUNT;

// Validate arguments
if (!userId) {
  console.error('Please provide a user ID as the first argument');
  process.exit(1);
}

// Run generator
generateEmails(userId, emailCount);
