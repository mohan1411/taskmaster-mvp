const mongoose = require('mongoose');
const Document = require('./models/documentModel');
const Email = require('./models/emailModel');
const attachmentProcessor = require('./services/attachmentProcessor');
require('dotenv').config();

/**
 * Process attachments for the specific email
 */

async function processSpecificEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // The email ID from the browser
    const emailId = '6846ec5bf942d13795181e5c';
    
    console.log('📧 Processing attachments for email ID:', emailId);
    
    // Find the email
    const email = await Email.findById(emailId);
    
    if (!email) {
      console.log('❌ Email not found!');
      await mongoose.connection.close();
      return;
    }
    
    console.log('✅ Email found:', email.subject);
    
    if (!email.attachments || email.attachments.length === 0) {
      console.log('❌ No attachments in this email!');
      await mongoose.connection.close();
      return;
    }
    
    console.log(`\n📎 Found ${email.attachments.length} attachment(s)`);
    
    // Process each attachment
    for (const attachment of email.attachments) {
      console.log(`\n🔄 Processing: ${attachment.filename}`);
      console.log(`   Type: ${attachment.mimeType}`);
      console.log(`   Path: ${attachment.path}`);
      
      // Check if document already exists
      let doc = await Document.findOne({
        emailId: emailId,
        originalName: attachment.filename,
        deleted: { $ne: true }
      });
      
      if (doc) {
        console.log('   📄 Document already exists, reprocessing...');
        doc.processingStatus = 'pending';
        doc.extractedTasks = [];
        doc.processingError = null;
        await doc.save();
      } else {
        console.log('   📄 Creating new document...');
        doc = await Document.create({
          originalName: attachment.filename,
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          size: attachment.size,
          path: attachment.path,
          emailId: emailId, // Using the MongoDB _id
          userId: email.user,
          processingStatus: 'pending'
        });
        console.log('   ✅ Document created with ID:', doc._id);
      }
      
      // Process the document
      console.log('   ⚙️  Processing with enhanced parser...');
      
      try {
        await attachmentProcessor.processDocument(doc._id, attachment.path);
        
        // Wait for processing
        console.log('   ⏳ Waiting for processing...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check results
        const processedDoc = await Document.findById(doc._id);
        console.log(`   ✅ Processing complete!`);
        console.log(`   Status: ${processedDoc.processingStatus}`);
        console.log(`   Tasks found: ${processedDoc.extractedTasks?.length || 0}`);
        
        if (processedDoc.extractedTasks && processedDoc.extractedTasks.length > 0) {
          console.log('\n   📋 Extracted tasks:');
          processedDoc.extractedTasks.forEach((task, i) => {
            console.log(`   ${i + 1}. ${task.title}`);
            if (task.dueDate) console.log(`      Due: ${task.dueDate}`);
            if (task.priority !== 'medium') console.log(`      Priority: ${task.priority}`);
          });
        }
      } catch (error) {
        console.error('   ❌ Processing error:', error.message);
      }
    }
    
    // Verify the results
    console.log('\n\n📊 Final verification:');
    const finalDocs = await Document.find({
      emailId: emailId,
      deleted: { $ne: true }
    }).select('originalName processingStatus extractedTasks');
    
    console.log(`Total documents for this email: ${finalDocs.length}`);
    finalDocs.forEach(doc => {
      console.log(`\n📄 ${doc.originalName}`);
      console.log(`   Status: ${doc.processingStatus}`);
      console.log(`   Tasks: ${doc.extractedTasks?.length || 0}`);
    });
    
    await mongoose.connection.close();
    
    console.log('\n\n✅ Processing complete!');
    console.log('Now try clicking "Extract Tasks from 1 Document" again.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

console.log('🚀 Processing attachments for specific email...\n');
processSpecificEmail();
