@echo off
color 0A
echo.
echo  ████████╗ █████╗ ███████╗██╗  ██╗    ██████╗ ███████╗██████╗ ██╗   ██╗ ██████╗ 
echo  ╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝    ██╔══██╗██╔════╝██╔══██╗██║   ██║██╔════╝ 
echo     ██║   ███████║███████╗█████╔╝     ██║  ██║█████╗  ██████╔╝██║   ██║██║  ███╗
echo     ██║   ██╔══██║╚════██║██╔═██╗     ██║  ██║██╔══╝  ██╔══██╗██║   ██║██║   ██║
echo     ██║   ██║  ██║███████║██║  ██╗    ██████╔╝███████╗██████╔╝╚██████╔╝╚██████╔╝
echo     ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝    ╚═════╝ ╚══════╝╚═════╝  ╚═════╝  ╚═════╝ 
echo.
echo ========================================
echo   Task Visibility Debug Tool
echo ========================================
echo.

:MENU
echo Please select a debug option:
echo.
echo 1. 🔍 Check Database for Tasks
echo 2. 📧 Debug Task Extraction Process  
echo 3. 🔄 Check Task API Endpoints
echo 4. 📋 Test Frontend Task Loading
echo 5. 🚀 Create Test Task Manually
echo 6. 🧹 Clear Browser Cache and Restart
echo 7. ❌ Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto CHECK_DATABASE
if "%choice%"=="2" goto DEBUG_EXTRACTION
if "%choice%"=="3" goto CHECK_API
if "%choice%"=="4" goto TEST_FRONTEND
if "%choice%"=="5" goto CREATE_TEST_TASK
if "%choice%"=="6" goto CLEAR_CACHE
if "%choice%"=="7" goto EXIT

echo Invalid choice. Please try again.
goto MENU

:CHECK_DATABASE
color 0E
echo.
echo ========================================
echo   CHECKING DATABASE FOR TASKS
echo ========================================
echo.

echo Running task database debug...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"
node debug-tasks.js

echo.
echo Running task extraction debug...
node debug-task-extraction.js

echo.
echo 📊 ANALYSIS:
echo If you see "Total tasks: 0" - no tasks were created
echo If you see tasks but they're not on frontend - API/frontend issue
echo If you see extraction errors - task creation is failing
echo.
pause
goto MENU

:DEBUG_EXTRACTION
color 0D
echo.
echo ========================================
echo   DEBUG TASK EXTRACTION PROCESS
echo ========================================
echo.

echo Checking if task extraction creates actual tasks...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"

echo Testing task creation manually...
node -e "
const mongoose = require('mongoose');
const config = require('./config/config');

const testTaskCreation = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to database');
    
    // Try to load Task model
    const Task = require('./models/taskModel');
    console.log('Task model loaded');
    
    // Find a user ID to test with
    const Email = require('./models/emailModel');
    const sampleEmail = await Email.findOne();
    
    if (sampleEmail) {
      console.log('Creating test task...');
      const testTask = await Task.create({
        title: 'Test Task from Debug',
        description: 'This is a test task created by debug script',
        user: sampleEmail.user,
        status: 'pending',
        priority: 'medium',
        emailSource: sampleEmail.messageId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      console.log('✅ Test task created successfully:', testTask._id);
      console.log('Title:', testTask.title);
      console.log('User:', testTask.user);
    } else {
      console.log('❌ No emails found to test with');
    }
    
  } catch (error) {
    console.error('❌ Task creation failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

testTaskCreation();
"

echo.
echo Now check if this test task appears on your Tasks page!
echo If it doesn't, the issue is in the frontend API calls.
echo.
pause
goto MENU

:CHECK_API
color 0B
echo.
echo ========================================
echo   CHECKING TASK API ENDPOINTS
echo ========================================
echo.

echo Testing task API endpoints...
echo.
echo You can test these URLs manually:
echo.
echo GET http://localhost:5000/api/tasks
echo   - Should return list of all tasks
echo.
echo GET http://localhost:5000/api/tasks?status=all
echo   - Should return tasks with any status
echo.
echo Open one of these URLs in your browser to see if tasks exist.
echo.
echo Starting browser to test API...
start http://localhost:5000/api/tasks

echo.
echo 📋 WHAT TO LOOK FOR:
echo ✓ JSON response with array of tasks
echo ✓ Tasks should have title, description, user, status
echo ✓ Look for tasks with emailSource field
echo.
echo If you see empty array ^([^]^) - no tasks in database
echo If you see tasks here but not on frontend - frontend issue
echo.
pause
goto MENU

:TEST_FRONTEND
color 0C
echo.
echo ========================================
echo   TESTING FRONTEND TASK LOADING
echo ========================================
echo.

echo Opening Tasks page with debug console...
start http://localhost:3000/tasks

echo.
echo 🔧 DEBUG INSTRUCTIONS:
echo.
echo 1. Press F12 to open Developer Tools
echo 2. Go to Console tab
echo 3. Look for these messages:
echo    - "Fetched tasks: X Total: Y"
echo    - Any error messages in red
echo.
echo 4. Go to Network tab
echo 5. Refresh the page (Ctrl+R)
echo 6. Look for API call to "/api/tasks"
echo 7. Click on it to see the response
echo.
echo 📊 COMMON ISSUES:
echo ❌ 404 Error: API endpoint not found
echo ❌ 401 Error: Authentication issue
echo ❌ Empty response: No tasks in database
echo ❌ Filtering issue: Tasks exist but filtered out
echo.
pause
goto MENU

:CREATE_TEST_TASK
color 0A
echo.
echo ========================================
echo   CREATING TEST TASK MANUALLY
echo ========================================
echo.

echo Creating a test task to verify the system works...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"

node -e "
const mongoose = require('mongoose');
const config = require('./config/config');

const createTestTask = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✓ Connected to database');
    
    const Task = require('./models/taskModel');
    const User = require('./models/userModel');
    
    // Find a user to assign task to
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No users found. Please register a user first.');
      return;
    }
    
    console.log('✓ Found user:', user.email);
    
    // Create test task
    const testTask = await Task.create({
      title: 'TEST: Email Extraction Task',
      description: 'This task was created to test if tasks appear on the Tasks page',
      user: user._id,
      status: 'pending',
      priority: 'high',
      category: 'email',
      emailSource: 'debug-test-email',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Test task created successfully!');
    console.log('   Task ID:', testTask._id);
    console.log('   Title:', testTask.title);
    console.log('   User:', testTask.user);
    console.log('   Status:', testTask.status);
    
    console.log('\n🎯 Now go to http://localhost:3000/tasks');
    console.log('   You should see this test task in the list!');
    
  } catch (error) {
    console.error('❌ Failed to create test task:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createTestTask();
"

echo.
echo ✅ Test task created!
echo.
echo Now opening Tasks page to check if it appears...
timeout /t 3 /nobreak >nul
start http://localhost:3000/tasks

echo.
echo 📋 If you see the test task, the system works!
echo 📋 If you don't see it, there's a frontend loading issue.
echo.
pause
goto MENU

:CLEAR_CACHE
color 0F
echo.
echo ========================================
echo   CLEARING CACHE AND RESTARTING
echo ========================================
echo.

echo Stopping all servers...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo 🧹 BROWSER CACHE CLEARING INSTRUCTIONS:
echo.
echo 1. Close all browser windows
echo 2. Open browser
echo 3. Press Ctrl+Shift+Delete
echo 4. Select "All time" as time range
echo 5. Check: Cookies, Cached images, Local storage
echo 6. Click "Clear data"
echo.
echo Starting servers with fresh cache...

cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"
start "MVP-Dev Backend" cmd /k "echo Starting backend... && npm start"

cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\frontend"
start "MVP-Dev Frontend" cmd /k "echo Starting frontend... && npm start"

echo.
echo ✅ Servers restarting with fresh environment!
echo.
echo Wait 30 seconds, then test:
echo http://localhost:3000/tasks
echo.
pause
goto MENU

:EXIT
color 0A
echo.
echo ========================================
echo   TASK VISIBILITY DEBUG SUMMARY
echo ========================================
echo.
echo COMMON CAUSES OF MISSING TASKS:
echo.
echo 1. 🗄️  Tasks not saved to database
echo    - Check task creation code
echo    - Verify Task model is correct
echo.
echo 2. 🔗 API endpoints not working
echo    - Test http://localhost:5000/api/tasks
echo    - Check for 404 or 500 errors
echo.
echo 3. 🎯 Frontend filtering issues
echo    - Tasks exist but filtered out
echo    - Check status/priority filters
echo.
echo 4. 👤 User authentication issues  
echo    - Tasks exist for different user
echo    - Check user ID matching
echo.
echo 5. 🔄 Caching issues
echo    - Clear browser cache
echo    - Restart servers
echo.
echo Next step: Run options 1, 2, and 5 to diagnose!
echo.
pause
exit /b
