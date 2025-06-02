// Automatic fix for emailController.js task database saving
const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, 'controllers', 'emailController.js');

console.log('🔧 Fixing task database save issue...');

try {
  // Read the current controller file
  let controllerContent = fs.readFileSync(controllerPath, 'utf8');
  
  // Find the section that needs to be replaced
  const oldPattern = /if \(result\.success\) \{[\s\S]*?return res\.json\(\{[\s\S]*?alreadyExtracted: false[\s\S]*?\}\);[\s\S]*?\}/;
  
  const newCode = `if (result.success && result.extractedTasks && result.extractedTasks.length > 0) {
        // *** FIX: Actually save tasks to database ***
        const Task = mongoose.model('Task');
        const savedTasks = [];
        
        for (const taskData of result.extractedTasks) {
          try {
            // Create task in database
            const newTask = await Task.create({
              title: taskData.title,
              description: taskData.description || \`Task extracted from email: \${email.subject}\`,
              user: req.user._id,
              status: 'pending',
              priority: taskData.priority || 'medium',
              category: taskData.category || 'Email',
              emailSource: email.messageId,
              emailId: email.messageId,
              dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            
            console.log('✅ Task saved to database:', newTask._id, newTask.title);
            savedTasks.push(newTask);
            
          } catch (taskCreateError) {
            console.error('❌ Error creating task in database:', taskCreateError);
            // Continue with other tasks even if one fails
          }
        }
        
        // Mark email as processed
        email.taskExtracted = true;
        await email.save();
        
        console.log(\`✅ Successfully saved \${savedTasks.length} tasks to database\`);
        
        // Return the saved tasks
        return res.json({
          message: \`Successfully extracted and saved \${savedTasks.length} tasks\`,
          extractedTasks: savedTasks,
          emailId: email.messageId,
          alreadyExtracted: false
        });
      }`;
  
  // Replace the old code with new code
  if (oldPattern.test(controllerContent)) {
    controllerContent = controllerContent.replace(oldPattern, newCode);
    
    // Write the fixed content back
    fs.writeFileSync(controllerPath, controllerContent);
    
    console.log('✅ Successfully applied database save fix!');
    console.log('✅ Tasks will now be saved to MongoDB when extracted');
    console.log('🔄 Please restart your backend server for changes to take effect');
  } else {
    console.log('❌ Could not find the pattern to replace');
    console.log('💡 Manual fix may be required');
  }
  
} catch (error) {
  console.error('❌ Error applying fix:', error.message);
  console.log('💡 Please apply the fix manually');
}
