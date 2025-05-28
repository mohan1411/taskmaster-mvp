@echo off
echo TaskMaster Debug Test - Field Mismatches
echo --------------------------------------
echo.

cd /d "%~dp0"
cd backend

echo Installing any missing dependencies...
npm install openai@^4.0.0 --save >nul 2>&1

echo Creating debug script...
node -e "const fs=require('fs');fs.writeFileSync('debug-models.js', `
// Debug script to investigate model structures
const mongoose = require('mongoose');
const Task = require('./models/taskModel');
const Followup = require('./models/followupModel');
const Email = require('./models/emailModel');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB connected');

  // Get schema information
  console.log('\\n==== TASK MODEL SCHEMA ====');
  const taskSchemaInfo = Object.keys(Task.schema.paths);
  console.log(taskSchemaInfo);

  console.log('\\n==== FOLLOWUP MODEL SCHEMA ====');
  const followupSchemaInfo = Object.keys(Followup.schema.paths);
  console.log(followupSchemaInfo);

  // Get any validation requirements
  console.log('\\n==== TASK MODEL REQUIRED FIELDS ====');
  const taskRequiredFields = [];
  for (const [key, value] of Object.entries(Task.schema.paths)) {
    if (value.isRequired) {
      taskRequiredFields.push(key);
    }
  }
  console.log(taskRequiredFields);

  console.log('\\n==== FOLLOWUP MODEL REQUIRED FIELDS ====');
  const followupRequiredFields = [];
  for (const [key, value] of Object.entries(Followup.schema.paths)) {
    if (value.isRequired) {
      followupRequiredFields.push(key);
    }
  }
  console.log(followupRequiredFields);

  // Try to create a sample task
  console.log('\\n==== TESTING TASK CREATION ====');
  try {
    const sampleTask = new Task({
      title: 'Debug Test Task',
      user: mongoose.Types.ObjectId(), // Just a placeholder ID
      description: 'This is a debug test',
      priority: 'medium',
      status: 'pending',
      emailSource: 'debug-test'
    });
    console.log('Sample task created successfully');
    console.log(sampleTask);
  } catch (error) {
    console.error('Error creating task:', error);
  }

  // Disconnect from MongoDB
  await mongoose.connection.close();
  console.log('\\nDatabase connection closed');
});
`)"

echo Running schema debug script...
node debug-models.js

echo.
echo For tasks to extract correctly, they need to match your Task model schema.
echo The debug output above shows your model schema and required fields.
echo.
echo The unified processor has been updated to correctly map fields to your schema.
echo.
echo You should re-run the test cycle to verify that tasks are now extracted:
echo %~dp0test-cycle.bat
echo.
pause
