const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function trackDocumentCreation() {
  console.log('=== TRACKING DOCUMENT CREATION ===\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmaster');
    console.log('✓ Connected to MongoDB\n');
    
    const Document = require('./models/documentModel');
    
    // Monitor document creation
    console.log('Monitoring document collection for changes...');
    console.log('Upload a document through the UI now.\n');
    
    // Check initial count
    let lastCount = await Document.countDocuments();
    console.log(`Initial document count: ${lastCount}`);
    
    // Poll for changes
    let attempts = 0;
    const checkInterval = setInterval(async () => {
      attempts++;
      
      const currentCount = await Document.countDocuments();
      
      if (currentCount !== lastCount) {
        console.log(`\n✓ Document count changed: ${lastCount} → ${currentCount}`);
        
        // Get the latest document
        const latestDoc = await Document.findOne().sort({ createdAt: -1 });
        if (latestDoc) {
          console.log('\nLatest document:');
          console.log('- ID:', latestDoc._id);
          console.log('- Name:', latestDoc.originalName);
          console.log('- Status:', latestDoc.processingStatus);
          console.log('- User ID:', latestDoc.userId);
          console.log('- Path:', latestDoc.path);
          console.log('- Created:', latestDoc.createdAt);
          console.log('- Tasks:', latestDoc.extractedTasks?.length || 0);
          
          // Check if file exists
          if (latestDoc.path && fs.existsSync(latestDoc.path)) {
            console.log('- File exists: YES');
            const stats = fs.statSync(latestDoc.path);
            console.log('- File size:', stats.size);
          } else {
            console.log('- File exists: NO');
          }
        }
        
        lastCount = currentCount;
      } else {
        process.stdout.write(`\rChecking... (${attempts}/30) - Current count: ${currentCount}`);
      }
      
      if (attempts >= 30) {
        clearInterval(checkInterval);
        console.log('\n\nStopped monitoring after 30 seconds.');
        await mongoose.disconnect();
      }
    }, 1000);
    
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

// Also check the logs
console.log('=== CHECKING BACKEND LOGS ===\n');
console.log('When you upload a file, the backend console should show:');
console.log('1. POST /api/documents/scan');
console.log('2. "Processing document synchronously: [filename]"');
console.log('3. Parser logs');
console.log('4. Task extraction results\n');

trackDocumentCreation();
