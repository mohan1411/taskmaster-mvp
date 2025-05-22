/**
 * Complete Followup Cleanup Utility
 * This script:
 * 1. Finds all duplicate followups
 * 2. Keeps only one followup per email
 * 3. Updates all indexes and database constraints
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to the database
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  performCleanup();
}).catch(err => {
  console.error('Could not connect to MongoDB:', err);
  process.exit(1);
});

/**
 * Main cleanup function
 */
async function performCleanup() {
  const logFile = path.join(__dirname, 'followup-cleanup.log');
  
  // Clear log file
  fs.writeFileSync(logFile, '');
  
  // Helper function to log both to console and file
  const log = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    console.log(message);
    fs.appendFileSync(logFile, logMessage);
  };
  
  try {
    log('=== FOLLOWUP CLEANUP PROCESS STARTED ===');

    // Define models
    const Followup = mongoose.model('Followup');
    const Email = mongoose.model('Email');
    const User = mongoose.model('User');
    
    // Step 1: Create a unique index on emailId and user to prevent future duplicates
    log('Step 1: Creating unique compound index on user+emailId...');
    try {
      await Followup.collection.dropIndex('user_emailId_unique');
      log('  Dropped existing index');
    } catch (error) {
      log('  No existing index to drop');
    }
    
    try {
      await Followup.collection.createIndex(
        { user: 1, emailId: 1 }, 
        { unique: true, name: 'user_emailId_unique', background: true }
      );
      log('  Successfully created unique index');
    } catch (indexError) {
      log(`  ERROR creating index: ${indexError.message}`);
      log('  Will continue with duplicate cleanup anyway');
    }
    
    // Step 2: Find all users
    const users = await User.find({});
    log(`Found ${users.length} users`);
    
    let totalDuplicatesRemoved = 0;
    
    // Step 3: Process each user
    for (const user of users) {
      log(`\nProcessing user: ${user.name} (${user.email})`);
      
      // Find all followups for this user
      const followups = await Followup.find({ user: user._id });
      log(`  Found ${followups.length} followups for this user`);
      
      if (followups.length === 0) continue;
      
      // Group followups by emailId
      const followupsByEmailId = {};
      let duplicates = 0;
      
      followups.forEach(followup => {
        if (!followup.emailId) return;
        
        if (!followupsByEmailId[followup.emailId]) {
          followupsByEmailId[followup.emailId] = [];
        }
        
        followupsByEmailId[followup.emailId].push(followup);
        
        if (followupsByEmailId[followup.emailId].length > 1) {
          duplicates++;
        }
      });
      
      log(`  Found ${duplicates} emails with duplicate followups`);
      
      // Process duplicates
      let emailsProcessed = 0;
      let followupsRemoved = 0;
      
      for (const [emailId, emailFollowups] of Object.entries(followupsByEmailId)) {
        if (emailFollowups.length <= 1) continue;
        
        emailsProcessed++;
        log(`  Processing email ID: ${emailId} with ${emailFollowups.length} followups`);
        
        // Sort by creation date (newest first)
        emailFollowups.sort((a, b) => b.createdAt - a.createdAt);
        
        // Keep the newest followup
        const keepFollowup = emailFollowups[0];
        log(`    Keeping followup ID: ${keepFollowup._id} (created: ${keepFollowup.createdAt})`);
        
        // Remove all others
        for (let i = 1; i < emailFollowups.length; i++) {
          const removeFollowup = emailFollowups[i];
          log(`    Removing followup ID: ${removeFollowup._id} (created: ${removeFollowup.createdAt})`);
          
          try {
            await Followup.findByIdAndDelete(removeFollowup._id);
            followupsRemoved++;
          } catch (removeError) {
            log(`    ERROR removing followup: ${removeError.message}`);
          }
        }
      }
      
      log(`  Processed ${emailsProcessed} emails with duplicates`);
      log(`  Removed ${followupsRemoved} duplicate followups`);
      totalDuplicatesRemoved += followupsRemoved;
    }
    
    log('\n=== SUMMARY ===');
    log(`Total duplicate followups removed: ${totalDuplicatesRemoved}`);
    log('Cleanup process complete');
    
    // Verify the unique index
    log('\nVerifying unique index on user+emailId...');
    const indexes = await Followup.collection.indexes();
    const hasUniqueIndex = indexes.some(index => 
      index.name === 'user_emailId_unique' && index.unique === true
    );
    
    if (hasUniqueIndex) {
      log('✅ Unique index is in place - future duplicates should be prevented');
    } else {
      log('❌ WARNING: Unique index not found - duplicates may still occur');
    }
    
  } catch (error) {
    log(`ERROR during cleanup: ${error.message}`);
    log(error.stack);
  } finally {
    log('\nClosing database connection...');
    await mongoose.connection.close();
    log('Database connection closed');
    process.exit(0);
  }
}
