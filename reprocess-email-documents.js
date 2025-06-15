const mongoose = require('mongoose');
const Document = require('./backend/models/documentModel');
const Email = require('./backend/models/emailModel');
const attachmentProcessor = require('./backend/services/attachmentProcessor');
require('dotenv').config({ path: './backend/.env' });

/**
 * Reprocess documents for an email to use the enhanced parser
 */

async function reprocessEmailDocuments(emailMessageId) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find the email by messageId
    const email = await Email.findOne({ messageId: emailMessageId });
    
    if (!email) {
      console.log('❌ Email not found with messageId:', emailMessageId);
      await mongoose.connection.close();
      return;
    }

    console.log(`📧 Found email: ${email.subject}`);
    console.log(`   Has attachments: ${email.hasAttachments}`);
    console.log(`   Attachment count: ${email.attachments?.length || 0}`);

    // Find all documents associated with this email
    const documents = await Document.find({ 
      emailId: email.messageId,
      deleted: { $ne: true }
    });

    console.log(`\n📄 Found ${documents.length} document(s) for this email`);

    if (documents.length === 0) {
      console.log('\n❌ No documents found. The attachment may not have been processed as a document.');
      console.log('\nPossible reasons:');
      console.log('1. The document processing failed');
      console.log('2. The attachment was not downloaded properly');
      console.log('3. The document type is not supported for task extraction');
      
      // Check if there are attachments that need processing
      if (email.attachments && email.attachments.length > 0) {
        console.log('\n📎 Email has attachments. Attempting to process them...');
        
        for (const attachment of email.attachments) {
          console.log(`\nProcessing attachment: ${attachment.filename}`);
          
          // Create document record if it doesn't exist
          const existingDoc = await Document.findOne({
            emailId: email.messageId,
            originalName: attachment.filename
          });
          
          if (!existingDoc && attachment.path) {
            console.log('Creating new document record...');
            const newDoc = await Document.create({
              originalName: attachment.filename,
              filename: attachment.filename,
              mimeType: attachment.mimeType,
              size: attachment.size,
              path: attachment.path,
              emailId: email.messageId,
              userId: email.user,
              processingStatus: 'pending'
            });
            
            console.log('Processing document...');
            await attachmentProcessor.processDocument(newDoc._id, attachment.path);
            
            // Wait a bit for processing
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check results
            const processedDoc = await Document.findById(newDoc._id);
            console.log(`✅ Document processed. Found ${processedDoc.extractedTasks?.length || 0} tasks`);
          }
        }
      }
      
      await mongoose.connection.close();
      return;
    }

    // Reprocess each document
    for (const doc of documents) {
      console.log(`\n📄 Document: ${doc.originalName}`);
      console.log(`   Status: ${doc.processingStatus}`);
      console.log(`   Current tasks: ${doc.extractedTasks?.length || 0}`);
      console.log(`   Path: ${doc.path}`);

      if (!doc.path) {
        console.log('   ❌ No file path available, cannot reprocess');
        continue;
      }

      // Check if file exists
      const fs = require('fs').promises;
      try {
        await fs.access(doc.path);
        console.log('   ✅ File exists, reprocessing...');
        
        // Reset the document status
        doc.processingStatus = 'pending';
        doc.processingError = null;
        doc.extractedTasks = [];
        await doc.save();
        
        // Reprocess
        await attachmentProcessor.processDocument(doc._id, doc.path);
        
        // Wait a moment for processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check results
        const reprocessedDoc = await Document.findById(doc._id);
        console.log(`   ✅ Reprocessing complete!`);
        console.log(`   New status: ${reprocessedDoc.processingStatus}`);
        console.log(`   Tasks found: ${reprocessedDoc.extractedTasks?.length || 0}`);
        
        if (reprocessedDoc.extractedTasks && reprocessedDoc.extractedTasks.length > 0) {
          console.log('\n   📋 Extracted tasks:');
          reprocessedDoc.extractedTasks.forEach((task, i) => {
            console.log(`   ${i + 1}. ${task.title}`);
            if (task.dueDate) console.log(`      Due: ${task.dueDate}`);
            if (task.priority !== 'medium') console.log(`      Priority: ${task.priority}`);
          });
        }
        
      } catch (error) {
        console.log(`   ❌ File not found at ${doc.path}`);
        console.log('   Cannot reprocess without the original file');
      }
    }

    console.log('\n✅ Reprocessing complete!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Check command line arguments
if (process.argv.length < 3) {
  console.log('Usage: node reprocess-email-documents.js <emailMessageId>');
  console.log('\nTo find the email message ID:');
  console.log('1. Look at the browser developer tools');
  console.log('2. Check the network requests when viewing the email');
  console.log('3. Or check the MongoDB database for the email');
  process.exit(1);
}

const emailMessageId = process.argv[2];
console.log(`🔄 Reprocessing documents for email message ID: ${emailMessageId}\n`);

reprocessEmailDocuments(emailMessageId);
