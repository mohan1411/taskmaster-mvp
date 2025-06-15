const mongoose = require('mongoose');
const Document = require('./models/documentModel');
const Email = require('./models/emailModel');
const attachmentProcessor = require('./services/attachmentProcessor');
const path = require('path');
require('dotenv').config();

/**
 * Force process the PDF attachment
 */

async function forceProcessPDF() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find the email with tas1.pdf
    const email = await Email.findOne({
      'attachments.filename': 'tas1.pdf'
    }).sort({ createdAt: -1 });

    if (!email) {
      console.log('❌ No email found with tas1.pdf attachment');
      await mongoose.connection.close();
      return;
    }

    console.log('📧 Found email:', email.subject);
    console.log('   Email ID:', email._id);
    
    // Find the PDF attachment
    const pdfAttachment = email.attachments.find(a => a.filename === 'tas1.pdf');
    if (!pdfAttachment) {
      console.log('❌ PDF attachment not found in email');
      await mongoose.connection.close();
      return;
    }

    console.log('\n📎 PDF Attachment:');
    console.log('   Filename:', pdfAttachment.filename);
    console.log('   Path:', pdfAttachment.path);
    console.log('   Size:', pdfAttachment.size);

    // Delete any existing document for this PDF
    console.log('\n🗑️  Removing any existing documents...');
    await Document.deleteMany({
      $or: [
        { emailId: email._id.toString(), originalName: 'tas1.pdf' },
        { emailId: email.messageId, originalName: 'tas1.pdf' }
      ]
    });

    // Create a fresh document
    console.log('\n📄 Creating new document...');
    const newDoc = await Document.create({
      originalName: pdfAttachment.filename,
      filename: pdfAttachment.filename,
      mimeType: pdfAttachment.mimeType || 'application/pdf',
      size: pdfAttachment.size,
      path: pdfAttachment.path || path.join(__dirname, '../../uploads/attachments', pdfAttachment.filename),
      emailId: email._id.toString(), // Use the MongoDB ID that frontend expects
      userId: email.user,
      processingStatus: 'pending'
    });

    console.log('✅ Document created with ID:', newDoc._id);

    // Process the document
    console.log('\n⚙️  Processing document with enhanced parser...');
    
    try {
      // Check if file exists
      const fs = require('fs').promises;
      const filePath = newDoc.path;
      
      try {
        await fs.access(filePath);
        console.log('✅ File exists at:', filePath);
      } catch {
        // Try alternate path
        const altPath = path.join(__dirname, '../..', pdfAttachment.path);
        try {
          await fs.access(altPath);
          console.log('✅ File found at alternate path:', altPath);
          newDoc.path = altPath;
          await newDoc.save();
        } catch {
          console.log('❌ File not found. Paths tried:');
          console.log('   1.', filePath);
          console.log('   2.', altPath);
          await mongoose.connection.close();
          return;
        }
      }

      // Process the document
      await attachmentProcessor.processDocument(newDoc._id, newDoc.path);
      
      // Wait for processing
      console.log('⏳ Waiting for processing to complete...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check results
      const processedDoc = await Document.findById(newDoc._id);
      console.log('\n✅ Processing complete!');
      console.log('   Status:', processedDoc.processingStatus);
      console.log('   Tasks found:', processedDoc.extractedTasks?.length || 0);
      
      if (processedDoc.extractedTasks && processedDoc.extractedTasks.length > 0) {
        console.log('\n📋 Extracted tasks:');
        processedDoc.extractedTasks.forEach((task, i) => {
          console.log(`${i + 1}. ${task.title}`);
          if (task.dueDate) console.log(`   Due: ${task.dueDate}`);
          if (task.priority !== 'medium') console.log(`   Priority: ${task.priority}`);
        });
      } else {
        console.log('\n⚠️  No tasks extracted. Possible reasons:');
        console.log('1. The parser couldn\'t find task patterns');
        console.log('2. The PDF extraction failed');
        console.log('3. The file is corrupted');
        
        if (processedDoc.processingError) {
          console.log('\n❌ Processing error:', processedDoc.processingError);
        }
      }
      
    } catch (error) {
      console.error('❌ Processing error:', error);
    }

    await mongoose.connection.close();
    
    console.log('\n\n✅ Force processing complete!');
    console.log('Now try clicking "Extract Tasks from 1 Document" again in the UI.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

console.log('🚀 Force processing PDF attachment...\n');
forceProcessPDF();
