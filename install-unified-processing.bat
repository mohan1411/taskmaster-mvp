@echo off
echo Updating TaskMaster with Unified Email Processing

cd /d "%~dp0"
cd backend

echo Installing any missing dependencies...
npm install openai@^4.0.0 --save

echo Updating server configuration...
node update-server.js

echo Creating test script for unified processing...
node -e "const fs=require('fs');fs.writeFileSync('test-unified-processing.js', `
// Test script for unified email processing
const mongoose = require('mongoose');
const User = require('./models/userModel');
const Email = require('./models/emailModel');
const { processUserEmails } = require('./services/unifiedEmailProcessor');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

// Main function
const testUnifiedProcessing = async () => {
  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  try {
    // Find a user
    const user = await User.findOne({ role: 'admin' });
    if (!user) {
      console.error('No admin user found');
      process.exit(1);
    }

    console.log(\`Testing unified processing for user: \${user.email}\`);

    // Process user's emails
    const results = await processUserEmails(user, 5);

    console.log('Processing completed:');
    console.log(\`- Emails processed: \${results.processed}\`);
    console.log(\`- Tasks extracted: \${results.tasks.length}\`);
    console.log(\`- Follow-ups extracted: \${results.followups.length}\`);
    console.log(\`- Errors: \${results.errors.length}\`);

    if (results.tasks.length > 0) {
      console.log('\\nExample tasks:');
      results.tasks.slice(0, 3).forEach(task => {
        console.log(\`- \${task.title} (Priority: \${task.priority})\`);
      });
    }

    if (results.followups.length > 0) {
      console.log('\\nExample follow-ups:');
      results.followups.slice(0, 3).forEach(followup => {
        console.log(\`- \${followup.title} (Contact: \${followup.contactPerson || 'Not specified'})\`);
      });
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the test
testUnifiedProcessing();
`)"

echo Creating test batch file...
echo @echo off > test-unified-processing.bat
echo cd /d "%%~dp0" >> test-unified-processing.bat
echo cd backend >> test-unified-processing.bat
echo echo Running unified email processing test... >> test-unified-processing.bat
echo node test-unified-processing.js >> test-unified-processing.bat
echo pause >> test-unified-processing.bat

echo Creating production integration batch file...
echo @echo off > integrate-unified-processing.bat
echo cd /d "%%~dp0" >> integrate-unified-processing.bat
echo echo Stopping TaskMaster server... >> integrate-unified-processing.bat
echo call stop-taskmaster.bat >> integrate-unified-processing.bat
echo echo Waiting for server to stop... >> integrate-unified-processing.bat
echo timeout /t 5 /nobreak > nul >> integrate-unified-processing.bat
echo echo Updating server.js with unified processing routes... >> integrate-unified-processing.bat
echo cd backend >> integrate-unified-processing.bat
echo node update-server.js >> integrate-unified-processing.bat
echo cd .. >> integrate-unified-processing.bat
echo echo Starting TaskMaster with unified processing... >> integrate-unified-processing.bat
echo call start-taskmaster.bat >> integrate-unified-processing.bat
echo echo Integration complete! >> integrate-unified-processing.bat
echo exit >> integrate-unified-processing.bat

echo.
echo Unified email processing has been added to TaskMaster!
echo.
echo You can test it with the following commands:
echo - test-unified-processing.bat - Test the unified processing
echo - integrate-unified-processing.bat - Integrate and restart server
echo.
echo The unified processing will automatically detect both tasks and follow-ups
echo from emails in a single operation.
echo.
pause
