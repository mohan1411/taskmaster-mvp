const mongoose = require('mongoose');
const Email = require('./models/emailModel');
require('dotenv').config();

async function updateEmailAttachments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the email that mentions "attached file"
    const email = await Email.findOne({ subject: 'Taskks' });
    
    if (email) {
      console.log('Found email:', email.subject);
      console.log('Current hasAttachments:', email.hasAttachments);
      
      // Update to indicate it has attachments for testing
      email.hasAttachments = true;
      // Add a mock attachment for testing
      email.attachments = [{
        filename: 'test-document.pdf',
        mimeType: 'application/pdf',
        size: 1024000,
        attachmentId: 'test-attachment-id',
        path: 'uploads/attachments/test-document.pdf'
      }];
      
      await email.save();
      console.log('Updated email with attachment info');
    } else {
      console.log('Email not found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateEmailAttachments();
