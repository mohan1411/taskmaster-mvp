const mongoose = require('mongoose');
const Document = require('./models/documentModel');
const Email = require('./models/emailModel');
require('dotenv').config();

/**
 * Direct investigation of the extraction issue
 */

async function investigateExtraction() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Step 1: Find ALL documents in the system
    console.log('=== STEP 1: All Documents in Database ===');
    const allDocs = await Document.find({}).select('originalName emailId processingStatus extractedTasks');
    
    console.log(`Total documents: ${allDocs.length}`);
    allDocs.forEach(doc => {
      console.log(`\n📄 ${doc.originalName}`);
      console.log(`   ID: ${doc._id}`);
      console.log(`   Email ID: ${doc.emailId}`);
      console.log(`   Status: ${doc.processingStatus}`);
      console.log(`   Tasks: ${doc.extractedTasks?.length || 0}`);
    });

    // Step 2: Find the specific PDF
    console.log('\n\n=== STEP 2: Looking for tas1.pdf ===');
    const pdfDoc = await Document.findOne({ 
      originalName: { $regex: /tas1\.pdf/i }
    });

    if (pdfDoc) {
      console.log('✅ Found tas1.pdf!');
      console.log(`   Document ID: ${pdfDoc._id}`);
      console.log(`   Email ID stored: ${pdfDoc.emailId}`);
      console.log(`   Status: ${pdfDoc.processingStatus}`);
      console.log(`   Tasks extracted: ${pdfDoc.extractedTasks?.length || 0}`);
      
      if (pdfDoc.extractedTasks && pdfDoc.extractedTasks.length > 0) {
        console.log('\n📋 Tasks in document:');
        pdfDoc.extractedTasks.forEach((task, i) => {
          console.log(`   ${i + 1}. ${task.title}`);
        });
      }
    } else {
      console.log('❌ tas1.pdf not found in documents!');
    }

    // Step 3: Find the email with this attachment
    console.log('\n\n=== STEP 3: Finding Email with PDF ===');
    const emailWithPdf = await Email.findOne({
      'attachments.filename': 'tas1.pdf'
    });

    if (emailWithPdf) {
      console.log('✅ Found email with tas1.pdf');
      console.log(`   Subject: ${emailWithPdf.subject}`);
      console.log(`   MongoDB ID: ${emailWithPdf._id}`);
      console.log(`   Message ID: ${emailWithPdf.messageId}`);
      
      // Check what the frontend will look for
      console.log('\n🔍 Frontend will search for documents with emailId:');
      console.log(`   ${emailWithPdf._id}`);
      
      // Check if any documents match
      const matchingDocs = await Document.find({
        emailId: emailWithPdf._id.toString()
      });
      
      console.log(`\n📊 Documents matching this emailId: ${matchingDocs.length}`);
      
      if (pdfDoc && pdfDoc.emailId !== emailWithPdf._id.toString()) {
        console.log('\n⚠️  MISMATCH FOUND!');
        console.log(`   Document has emailId: ${pdfDoc.emailId}`);
        console.log(`   But should have: ${emailWithPdf._id}`);
        
        // Fix it
        console.log('\n🔧 Fixing the mismatch...');
        pdfDoc.emailId = emailWithPdf._id.toString();
        await pdfDoc.save();
        console.log('✅ Fixed! Document now has correct emailId');
      }
    }

    // Step 4: Test what the API endpoint will return
    console.log('\n\n=== STEP 4: Simulating API Call ===');
    if (emailWithPdf) {
      const documents = await Document.find({
        emailId: emailWithPdf._id.toString(),
        deleted: { $ne: true }
      }).select('originalName processingStatus extractedTasks');
      
      console.log(`API would return ${documents.length} documents`);
      documents.forEach(doc => {
        console.log(`\n📄 ${doc.originalName}`);
        console.log(`   Status: ${doc.processingStatus}`);
        console.log(`   Tasks: ${doc.extractedTasks?.length || 0}`);
      });
    }

    await mongoose.connection.close();
    
    console.log('\n\n✅ Investigation complete!');
    console.log('\n📌 Next steps:');
    console.log('1. If no documents were found, the attachment was never processed');
    console.log('2. If mismatch was fixed, try clicking the button again');
    console.log('3. If tasks exist but still not showing, there might be a frontend issue');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

console.log('🔍 Investigating extraction issue...\n');
investigateExtraction();
