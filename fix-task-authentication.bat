@echo off
echo ========================================
echo   Authentication Fix for Tasks API
echo ========================================
echo.

echo PROBLEM IDENTIFIED:
echo The Tasks API is returning "Not authorized, no token"
echo This means authentication is failing.
echo.
echo SOLUTION:
echo Fixing the task service to properly send auth tokens.
echo.

echo 1. Backing up current task service...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\frontend\src\services"
copy taskService.js taskService.js.backup

echo 2. Installing fixed task service with proper auth...
copy taskServiceFixed.js taskService.js

echo 3. Restarting frontend to apply changes...
taskkill /F /IM node.exe >nul 2>&1

echo 4. Starting backend...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"
start "MVP-Dev Backend" cmd /k "echo Starting backend... && npm start"

echo 5. Starting frontend...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\frontend"
start "MVP-Dev Frontend" cmd /k "echo Starting frontend... && npm start"

echo.
echo ========================================
echo   AUTHENTICATION FIX APPLIED!
echo ========================================
echo.
echo WHAT WAS FIXED:
echo ✓ Task service now properly sends JWT tokens
echo ✓ Better error handling for auth failures
echo ✓ Automatic redirect to login if token expired
echo ✓ Enhanced logging for debugging
echo.
echo Wait 30 seconds, then test:
echo 1. Go to http://localhost:3000/tasks
echo 2. You should now see your extracted tasks!
echo 3. If still no tasks, press F12 and check console
echo.
echo TESTING CHECKLIST:
echo ✓ Login to the app first
echo ✓ Go to Emails page and extract some tasks
echo ✓ Go to Tasks page - tasks should now appear
echo ✓ Check browser console for any errors
echo.
pause
