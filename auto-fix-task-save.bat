@echo off
echo ========================================
echo   Automatic Task Database Save Fix
echo ========================================
echo.

echo PROBLEM: Tasks extracted but not saved to database
echo SOLUTION: Patch emailController.js to save tasks
echo.

echo 1. Applying automatic fix...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"
node apply-task-save-fix.js

echo.
echo 2. Restarting backend server...
taskkill /F /IM node.exe >nul 2>&1

echo 3. Starting patched backend...
start "MVP-Dev Backend" cmd /k "echo Backend with task save fix starting... && npm start"

echo.
echo ========================================
echo   FIX APPLIED!
echo ========================================
echo.
echo WHAT WAS FIXED:
echo ✓ Task extraction now SAVES tasks to MongoDB database
echo ✓ Each extracted task becomes a Task document
echo ✓ Tasks will appear on the Tasks page
echo ✓ Proper emailSource linking
echo.
echo TESTING:
echo 1. Wait 30 seconds for backend to restart
echo 2. Go to http://localhost:3000/emails
echo 3. Click "Extract Tasks" on any email
echo 4. Go to http://localhost:3000/tasks
echo 5. You should now see the extracted tasks!
echo.
echo DATABASE CHECK:
echo Go to MongoDB Atlas ^> fizztask database ^> tasks collection
echo You should now see task documents with your extracted tasks!
echo.
pause
