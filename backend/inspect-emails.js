const mongoose = require('mongoose');
const Email = require('./models/emailModel');
require('dotenv').config();

async function inspectEmails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const emails = await Email.find({}).select('subject snippet hasAttachments messageId');
    
    console.log(`\nFound ${emails.length} emails:\n`);
    
    emails.forEach((email, i) => {
      console.log(`${i + 1}. Subject: ${email.subject}`);
      console.log(`   Snippet: ${email.snippet}`);
      console.log(`   Has Attachments: ${email.hasAttachments}`);
      console.log(`   Message ID: ${email.messageId}`);
      console.log('');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

inspectEmails();
