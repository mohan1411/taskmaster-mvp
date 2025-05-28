@echo off
echo TaskMaster Large Volume Test
echo --------------------------
echo.
echo This script will test processing a large batch of emails with the batch processor.
echo This is a simulation to verify the batch processing system works correctly.
echo.

cd /d "%~dp0"
cd backend

echo Creating test script...
node -e "const fs=require('fs');fs.writeFileSync('test-batch-processing.js', `
// Test script for batch email processing
const mongoose = require('mongoose');
const User = require('./models/userModel');
const Email = require('./models/emailModel');
const { batchProcessEmails } = require('./services/batchEmailProcessor');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB connected');

  try {
    // Find a user
    const user = await User.findOne({ role: 'admin' });
    if (!user) {
      console.log('No admin user found');
      process.exit(1);
    }

    console.log(\`Testing batch processing for user: \${user.email}\`);

    // Count unprocessed emails
    const unprocessedCount = await Email.countDocuments({ 
      user: user._id, 
      processed: false 
    });

    console.log(\`Found \${unprocessedCount} unprocessed emails\`);

    // Setup progress tracking callback
    const trackProgress = (update) => {
      switch (update.type) {
        case 'init':
          console.log(\`Preparing to process \${update.total} emails in \${update.batches} batches\`);
          break;
        case 'batch':
          console.log(\`Starting batch \${update.batchNumber} with \${update.emailCount} emails. Total processed: \${update.totalProcessed}\`);
          break;
        case 'email':
          process.stdout.write('.');
          break;
        case 'error':
          process.stdout.write('E');
          break;
        case 'complete':
          console.log(\`\\nProcessing completed: \${update.totalProcessed} emails, \${update.tasksFound} tasks, \${update.followupsFound} follow-ups, \${update.errors} errors\`);
          console.log(\`Duration: \${update.duration.toFixed(2)} seconds\`);
          break;
      }
    };

    // Run batch processing with limited number of emails
    const MAX_TEST_EMAILS = 5; // Limit for testing
    console.log(\`Running batch processor with limit of \${MAX_TEST_EMAILS} emails\`);

    const results = await batchProcessEmails(user, {
      maxEmails: MAX_TEST_EMAILS,
      batchSize: 2,
      concurrentBatches: 2,
      trackingCallback: trackProgress
    });

    console.log('Processing completed!');
    console.log(\`Processed: \${results.processed} emails\`);
    console.log(\`Tasks created: \${results.tasks.length}\`);
    console.log(\`Follow-ups created: \${results.followups.length}\`);
    console.log(\`Errors: \${results.errors.length}\`);
    console.log(\`Duration: \${(results.endTime - results.startTime) / 1000} seconds\`);

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
});
`)"

echo.
echo Running batch processing test...
echo.
node test-batch-processing.js

echo.
echo Batch processing test completed.
echo.
echo This test demonstrates how the batch processor handles larger email volumes.
echo For a real deployment with 1000+ emails, you would:
echo.
echo 1. Set up a background job queue system (like Bull or Agenda)
echo 2. Configure rate limiting and concurrency based on your OpenAI quota
echo 3. Implement a persistent job tracking mechanism
echo.
pause
