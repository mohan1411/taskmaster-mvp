@echo off
color 0A
echo.
echo  ████████╗ █████╗ ███████╗██╗  ██╗    ███████╗ █████╗ ██╗   ██╗███████╗
echo  ╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝    ██╔════╝██╔══██╗██║   ██║██╔════╝
echo     ██║   ███████║███████╗█████╔╝     ███████╗███████║██║   ██║█████╗  
echo     ██║   ██╔══██║╚════██║██╔═██╗     ╚════██║██╔══██║╚██╗ ██╔╝██╔══╝  
echo     ██║   ██║  ██║███████║██║  ██╗    ███████║██║  ██║ ╚████╔╝ ███████╗
echo     ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝
echo.
echo ========================================
echo   Fix Task Database Save Issue
echo ========================================
echo.

echo PROBLEM IDENTIFIED:
echo Task extraction works but tasks are NOT saved to database!
echo.
echo ROOT CAUSE:
echo The extractTasksFromEmail function returns task data to frontend
echo but never creates Task documents in MongoDB.
echo.
echo SOLUTION:
echo Modify the email controller to actually save tasks to database.
echo.

echo 1. Backing up current email controller...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend\controllers"
copy emailController.js emailController.js.backup

echo 2. Applying database save fix...

REM Read the fixed function and patch it into the original file
echo Patching extractTasksFromEmail function to save tasks to database...

REM Create a temp file with the fixed function
(
echo // @desc    Extract tasks from email
echo // @route   POST /api/emails/:id/extract  
echo // @access  Private
echo const extractTasksFromEmail = async ^(req, res^) =^> {
echo   console.log^('Starting task extraction process on backend for email ID:', req.params.id^);
echo   
echo   try {
echo     // Find the email
echo     const email = await Email.findOne^({
echo       _id: req.params.id,
echo       user: req.user._id
echo     }^);
echo.
echo     if ^(!email^) {
echo       console.log^('Email not found with ID:', req.params.id^);
echo       return res.status^(404^).json^({ message: 'Email not found' }^);
echo     }
echo     
echo     console.log^('Email found:', email._id, email.subject^);
echo     
echo     // Check if tasks have already been extracted from this email
echo     if ^(email.taskExtracted^) {
echo       console.log^('Tasks have already been extracted from this email'^);
echo       
echo       // Get existing tasks for this email
echo       const Task = mongoose.model^('Task'^);
echo       const existingTasks = await Task.find^({ 
echo         user: req.user._id,
echo         emailSource: email.messageId
echo       }^);
echo       
echo       if ^(existingTasks.length ^> 0^) {
echo         console.log^(`Found ${existingTasks.length} existing tasks for this email`^);
echo         return res.json^({
echo           message: 'Tasks have already been extracted from this email',
echo           extractedTasks: existingTasks,
echo           emailId: email.messageId,
echo           alreadyExtracted: true
echo         }^);
echo       }
echo     }
echo     
echo     // Get email content...
echo     const settings = await Settings.findOne^({ user: req.user._id }^);
echo     if ^(!settings ^|^| !settings.integrations.google.connected^) {
echo       return res.status^(400^).json^({ message: 'Google integration not connected' }^);
echo     }
echo     
echo     // Get Gmail content ^(existing code^)...
echo     // ... ^(content extraction code stays the same^) ...
echo     
echo     // Call extraction function
echo     const result = await extractTasksHelper^(emailForExtraction^);
echo     
echo     if ^(result.success ^&^& result.extractedTasks ^&^& result.extractedTasks.length ^> 0^) {
echo       // *** FIX: Actually save tasks to database ***
echo       const Task = mongoose.model^('Task'^);
echo       const savedTasks = [];
echo       
echo       for ^(const taskData of result.extractedTasks^) {
echo         try {
echo           // Create task in database
echo           const newTask = await Task.create^({
echo             title: taskData.title,
echo             description: taskData.description ^|^| `Task extracted from email: ${email.subject}`,
echo             user: req.user._id,
echo             status: 'pending',
echo             priority: taskData.priority ^|^| 'medium',
echo             category: taskData.category ^|^| 'Email',
echo             emailSource: email.messageId,
echo             emailId: email.messageId,
echo             dueDate: taskData.dueDate ? new Date^(taskData.dueDate^) : null,
echo             createdAt: new Date^(^),
echo             updatedAt: new Date^(^)
echo           }^);
echo           
echo           console.log^('✅ Task saved to database:', newTask._id, newTask.title^);
echo           savedTasks.push^(newTask^);
echo           
echo         } catch ^(taskCreateError^) {
echo           console.error^('❌ Error creating task:', taskCreateError^);
echo         }
echo       }
echo       
echo       // Mark email as processed
echo       email.taskExtracted = true;
echo       await email.save^(^);
echo       
echo       console.log^(`✅ Successfully saved ${savedTasks.length} tasks to database`^);
echo       
echo       return res.json^({
echo         message: `Successfully extracted and saved ${savedTasks.length} tasks`,
echo         extractedTasks: savedTasks,
echo         emailId: email.messageId,
echo         alreadyExtracted: false
echo       }^);
echo     } else {
echo       return res.status^(500^).json^({ 
echo         message: 'Failed to extract tasks', 
echo         error: result.error 
echo       }^);
echo     }
echo   } catch ^(error^) {
echo     console.error^('Task extraction error:', error^);
echo     res.status^(500^).json^({ 
echo       message: 'Server error during task extraction', 
echo       error: error.message 
echo     }^);
echo   }
echo };
) > extractTasksFixed.txt

echo 3. Creating manual patch instructions...
echo.
echo ⚠️  MANUAL PATCHING REQUIRED ⚠️
echo.
echo The fix is ready but needs manual application.
echo.
echo STEPS TO APPLY THE FIX:
echo.
echo 1. Open this file in your code editor:
echo    D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend\controllers\emailController.js
echo.
echo 2. Find the function "extractTasksFromEmail" ^(around line 400^)
echo.
echo 3. Look for this section in the function:
echo    if ^(result.success^) {
echo      // Mark email as processed
echo      email.taskExtracted = true;
echo      await email.save^(^);
echo      
echo      // Return the extracted tasks
echo      return res.json^({
echo        extractedTasks: result.extractedTasks,
echo        emailId: email.messageId,
echo        alreadyExtracted: false
echo      }^);
echo    }
echo.
echo 4. REPLACE that section with this code:
echo.

type extractTasksFixed.txt

echo.
echo 5. Save the file and restart your backend server
echo.
echo 6. Test by extracting tasks from an email
echo.
echo 7. Check MongoDB Atlas - you should now see tasks in the database!
echo.

echo Starting backend server after manual fix...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"
start "MVP-Dev Backend" cmd /k "echo Backend starting... && npm start"

echo.
echo ========================================
echo   TASK SAVE FIX SUMMARY
echo ========================================
echo.
echo WHAT THIS FIXES:
echo ✓ Tasks will now be saved to MongoDB database
echo ✓ Each extracted task becomes a Task document
echo ✓ Tasks will appear on the Tasks page
echo ✓ Proper linking between emails and tasks
echo.
echo AFTER APPLYING THE MANUAL FIX:
echo ✓ Extract tasks from an email
echo ✓ Go to Tasks page - tasks should appear!
echo ✓ Check MongoDB Atlas - tasks collection will have documents
echo.
pause
