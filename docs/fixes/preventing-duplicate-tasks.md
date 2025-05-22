# Preventing Duplicate Tasks in TaskMaster

## Issue
TaskMaster was allowing duplicate tasks to be created when extracting tasks from the same email multiple times. This occurred because:

1. There was no check to see if tasks had already been extracted from an email
2. The email's `taskExtracted` flag was set, but not checked during subsequent extraction attempts
3. The task creation process didn't verify if tasks already existed for the email

## Solution
The fix implements multiple checks to prevent duplicate task creation:

1. **Check at Email Level**: Before extracting tasks, check if the email already has `taskExtracted` flag set
2. **Check for Existing Tasks**: Query the database to find any tasks already associated with the email
3. **Return Existing Tasks**: Return the existing tasks instead of creating duplicates
4. **Mark Email as Processed**: Update the email record to set `taskExtracted` flag after successful extraction

## Changes Made

### 1. Updated `extractTasksFromEmail` in `emailController.js`
Added code to check if tasks have already been extracted from the email:
```javascript
// Check if tasks have already been extracted from this email
if (email.taskExtracted) {
  console.log('Tasks have already been extracted from this email');
  
  // Get existing tasks for this email
  const Task = mongoose.model('Task');
  const existingTasks = await Task.find({ 
    user: req.user._id,
    emailSource: email.messageId
  });
  
  if (existingTasks.length > 0) {
    console.log(`Found ${existingTasks.length} existing tasks for this email`);
    return res.json({
      message: 'Tasks have already been extracted from this email',
      extractedTasks: existingTasks,
      emailId: email.messageId,
      alreadyExtracted: true
    });
  }
}
```

### 2. Updated `saveExtractedTasks` in `taskController.js`
Added code to check for existing tasks before saving new ones:
```javascript
// Check if this is a re-extraction (tasks already exist for this email)
if (emailId) {
  const existingTasks = await Task.find({
    user: req.user._id,
    emailSource: emailId
  });
  
  if (existingTasks.length > 0) {
    console.log(`Found ${existingTasks.length} existing tasks for email ${emailId}`);
    
    // Return existing tasks without creating duplicates
    return res.json({
      message: `${existingTasks.length} tasks already exist for this email`,
      tasks: existingTasks,
      alreadyExtracted: true
    });
  }
}
```

### 3. Added Code to Mark Email as Processed
Added code to update the email record after tasks are saved:
```javascript
// If tasks were extracted from an email, mark the email as processed
if (emailId) {
  const Email = mongoose.model('Email');
  await Email.findOneAndUpdate(
    { messageId: emailId, user: req.user._id },
    { taskExtracted: true }
  );
}
```

### 4. Added Mongoose Requirement
Added mongoose to both controller files to enable model lookups:
```javascript
const mongoose = require('mongoose');
```

## How It Works Now

1. **First Extraction Attempt**:
   - User clicks to extract tasks from an email
   - System extracts tasks using AI
   - Tasks are saved to the database
   - Email is marked with `taskExtracted: true`

2. **Subsequent Extraction Attempts**:
   - User clicks to extract tasks from the same email
   - System checks the email's `taskExtracted` flag
   - System finds existing tasks for this email
   - System returns existing tasks instead of creating duplicates
   - User sees the previously extracted tasks with a message indicating they were already extracted

## Frontend Considerations

The frontend should now handle the `alreadyExtracted: true` flag in the API response, potentially showing a notification to the user that tasks have already been extracted from this email. This prevents confusion and maintains data integrity.

## Additional Improvements (Future Work)

1. **Task Deduplication**: Implement more sophisticated deduplication based on task content, not just email source
2. **Override Option**: Add an option to re-extract tasks and override existing ones if needed
3. **Task Versioning**: Keep track of multiple extraction attempts as different versions of tasks
4. **Email Change Detection**: Detect if an email has been updated since the last extraction (for forwarded or replied messages)

## Testing

To test this fix:
1. Find an email in TaskMaster
2. Extract tasks from it once - this should create tasks normally
3. Try to extract tasks from the same email again - this should now return the existing tasks without creating duplicates
4. Verify that the `taskExtracted` flag is set on the email in the database
