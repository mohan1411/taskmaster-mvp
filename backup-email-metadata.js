const mongoose = require('mongoose');
const Email = require('./backend/models/emailModel');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: './backend/.env' });

/**
 * Backup email metadata before deletion
 * This creates a JSON backup of email information (without the actual email content)
 */

async function backupEmailMetadata() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Get all emails
    const emails = await Email.find({})
      .select('-__v')
      .lean();
    
    if (emails.length === 0) {
      console.log('No emails found to backup.');
      await mongoose.connection.close();
      return;
    }

    console.log(`📊 Found ${emails.length} emails to backup`);

    // Create backup directory
    const backupDir = path.join(__dirname, 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `email-backup-${timestamp}.json`);

    // Create backup data
    const backupData = {
      timestamp: new Date().toISOString(),
      emailCount: emails.length,
      emails: emails.map(email => ({
        _id: email._id,
        messageId: email.messageId,
        threadId: email.threadId,
        subject: email.subject,
        sender: email.sender,
        recipients: email.recipients,
        hasAttachments: email.hasAttachments,
        attachments: email.attachments,
        labels: email.labels,
        receivedAt: email.receivedAt,
        isRead: email.isRead,
        taskExtracted: email.taskExtracted,
        needsFollowUp: email.needsFollowUp,
        followUpDueDate: email.followUpDueDate,
        createdAt: email.createdAt,
        updatedAt: email.updatedAt
      }))
    };

    // Write backup file
    await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`\n✅ Backup created successfully!`);
    console.log(`📁 Backup file: ${backupFile}`);
    console.log(`📊 Backed up ${emails.length} emails`);

    // Calculate backup file size
    const stats = await fs.stat(backupFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`💾 Backup size: ${fileSizeInMB} MB`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    process.exit(1);
  }
}

console.log('💾 TaskMaster - Backup Email Metadata\n');
console.log('This will create a backup of email metadata (not the actual email content)');
console.log('The backup can be useful for reference after deletion.\n');

backupEmailMetadata();
