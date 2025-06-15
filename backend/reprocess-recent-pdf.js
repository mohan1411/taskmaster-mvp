const mongoose = require('mongoose');
const Document = require('./models/documentModel');
const Email = require('./models/emailModel');
const attachmentProcessor = require('./services/attachmentProcessor');
require('dotenv').config();

/**
 * Find and reprocess the most recent email with PDF attachments
 */

async function reprocessRecentPDF() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find recent emails with attachments
    const recentEmails = await Email.find({ 
      hasAttachments: true,
      'attachments.mimeType': 'application/pdf'
    })
    .sort({ createdAt: -1 })
    .limit(5);

    if (recentEmails.length === 0) {
      console.log('❌ No emails with PDF attachments found');
      await mongoose.connection.close();
      return;
    }

    console.log(`Found ${recentEmails.length} recent email(s) with PDF attachments:\n`);

    recentEmails.forEach((email, index) => {
      console.log(`${index + 1}. ${email.subject || '(No subject)'}`);
      console.log(`   Message ID: ${email.messageId}`);
      console.log(`   From: ${email.sender?.email || 'Unknown'}`);
      console.log(`   Date: ${email.createdAt.toLocaleString()}`);
      console.log(`   Attachments: ${email.attachments.map(a => a.filename).join(', ')}`);
      console.log('');
    });

    // Process the most recent one
    const targetEmail = recentEmails[0];
    console.log(`\n🎯 Processing: ${targetEmail.subject}`);

    // Find documents for this email
    const documents = await Document.find({ 
      emailId: targetEmail.messageId,
      mimeType: 'application/pdf',
      deleted: { $ne: true }
    });

    console.log(`\n📄 Found ${documents.length} PDF document(s) for this email`);

    if (documents.length === 0) {
      // Try to create document records from attachments
      console.log('\n📎 No documents found. Creating from attachments...');
      
      for (const attachment of targetEmail.attachments) {
        if (attachment.mimeType === 'application/pdf' && attachment.path) {
          console.log(`\nCreating document for: ${attachment.filename}`);
          
          const newDoc = await Document.create({
            originalName: attachment.filename,
            filename: attachment.filename,
            mimeType: attachment.mimeType,
            size: attachment.size,
            path: attachment.path,
            emailId: targetEmail.messageId,
            userId: targetEmail.user,
            processingStatus: 'pending'
          });
          
          console.log('Processing document with enhanced parser...');
          
          // Process the document
          try {
            await attachmentProcessor.processDocument(newDoc._id, attachment.path);
            
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check results
            const processedDoc = await Document.findById(newDoc._id);
            console.log(`\n✅ Processing complete!`);
            console.log(`Status: ${processedDoc.processingStatus}`);
            console.log(`Tasks found: ${processedDoc.extractedTasks?.length || 0}`);
            
            if (processedDoc.extractedTasks && processedDoc.extractedTasks.length > 0) {
              console.log('\n📋 Extracted tasks:');
              processedDoc.extractedTasks.forEach((task, i) => {
                console.log(`${i + 1}. ${task.title}`);
                if (task.dueDate) console.log(`   Due: ${task.dueDate}`);
                if (task.priority !== 'medium') console.log(`   Priority: ${task.priority}`);
              });
            }
          } catch (error) {
            console.error('Processing error:', error);
          }
        }
      }
    } else {
      // Reprocess existing documents
      for (const doc of documents) {
        console.log(`\n📄 Reprocessing: ${doc.originalName}`);
        console.log(`   Current status: ${doc.processingStatus}`);
        console.log(`   Current tasks: ${doc.extractedTasks?.length || 0}`);
        
        // Reset and reprocess
        doc.processingStatus = 'pending';
        doc.processingError = null;
        doc.extractedTasks = [];
        await doc.save();
        
        try {
          await attachmentProcessor.processDocument(doc._id, doc.path);
          
          // Wait for processing
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check results
          const reprocessedDoc = await Document.findById(doc._id);
          console.log(`\n✅ Reprocessing complete!`);
          console.log(`New status: ${reprocessedDoc.processingStatus}`);
          console.log(`Tasks found: ${reprocessedDoc.extractedTasks?.length || 0}`);
          
          if (reprocessedDoc.extractedTasks && reprocessedDoc.extractedTasks.length > 0) {
            console.log('\n📋 Extracted tasks:');
            reprocessedDoc.extractedTasks.forEach((task, i) => {
              console.log(`${i + 1}. ${task.title}`);
              if (task.dueDate) console.log(`   Due: ${task.dueDate}`);
              if (task.priority !== 'medium') console.log(`   Priority: ${task.priority}`);
            });
          }
        } catch (error) {
          console.error('Reprocessing error:', error);
        }
      }
    }

    console.log('\n✅ Done!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

console.log('🔄 Finding and reprocessing recent PDF attachments...\n');
reprocessRecentPDF();
