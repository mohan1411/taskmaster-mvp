@echo off
color 0A
echo.
echo  ██████╗ ███████╗██████╗ ██╗   ██╗ ██████╗     ███████╗██╗██╗  ██╗
echo  ██╔══██╗██╔════╝██╔══██╗██║   ██║██╔════╝     ██╔════╝██║╚██╗██╔╝
echo  ██║  ██║█████╗  ██████╔╝██║   ██║██║  ███╗    █████╗  ██║ ╚███╔╝ 
echo  ██║  ██║██╔══╝  ██╔══██╗██║   ██║██║   ██║    ██╔══╝  ██║ ██╔██╗ 
echo  ██████╔╝███████╗██████╔╝╚██████╔╝╚██████╔╝    ██║     ██║██╔╝ ██╗
echo  ╚═════╝ ╚══════╝╚═════╝  ╚═════╝  ╚═════╝     ╚═╝     ╚═╝╚═╝  ╚═╝
echo.
echo ========================================
echo   Email Processing Debug and Fix
echo ========================================
echo.

:MENU
echo Please select an option:
echo.
echo 1. 🔍 Debug Server Errors (Check why 500 errors occur)
echo 2. 🚀 Apply Debug Email Page (Large visible buttons)
echo 3. 📊 Check Backend Logs (View current server output)
echo 4. 🔧 Test API Endpoints Directly
echo 5. 🌐 Open Email Page
echo 6. 🔄 Restart Servers
echo 7. ❌ Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto DEBUG_ERRORS
if "%choice%"=="2" goto APPLY_DEBUG_PAGE
if "%choice%"=="3" goto CHECK_LOGS
if "%choice%"=="4" goto TEST_ENDPOINTS
if "%choice%"=="5" goto OPEN_PAGE
if "%choice%"=="6" goto RESTART_SERVERS
if "%choice%"=="7" goto EXIT

echo Invalid choice. Please try again.
goto MENU

:DEBUG_ERRORS
color 0E
echo.
echo ========================================
echo   DEBUGGING SERVER ERRORS
echo ========================================
echo.

echo Running comprehensive debug script...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"
node debug-email-processing.js

echo.
echo ========================================
echo   Common Causes of 500 Errors:
echo ========================================
echo.
echo 1. ❌ OpenAI API key missing or invalid
echo 2. ❌ Email controller function errors  
echo 3. ❌ Database connection issues
echo 4. ❌ Missing email models or schema issues
echo 5. ❌ Gmail API token expired
echo.
echo Check the output above to identify the issue.
echo.
pause
goto MENU

:APPLY_DEBUG_PAGE
color 0C
echo.
echo ========================================
echo   APPLYING DEBUG EMAIL PAGE
echo ========================================
echo.

echo 1. Backing up current email page...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\frontend\src\pages"
copy EmailsPage.js EmailsPage.js.backup

echo 2. Installing debug version with HUGE buttons...
copy EmailsPageDebug.js EmailsPage.js

echo 3. Restarting servers...
taskkill /F /IM node.exe >nul 2>&1

echo 4. Starting backend with error logging...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"
start "MVP-Dev Backend" cmd /k "echo Starting backend with debug... && npm start"

echo 5. Starting frontend...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\frontend"
start "MVP-Dev Frontend" cmd /k "echo Starting frontend... && npm start"

echo.
color 0A
echo ✅ DEBUG VERSION APPLIED!
echo.
echo NEW FEATURES:
echo ✓ HUGE, prominent action buttons that are impossible to miss
echo ✓ Each email in its own card with clear spacing
echo ✓ Console logging for debugging API calls
echo ✓ Better error messages and feedback
echo ✓ Visual status indicators
echo.
echo Wait 30 seconds, then visit: http://localhost:3000/emails
echo.
pause
goto MENU

:CHECK_LOGS
color 0B
echo.
echo ========================================
echo   CHECKING BACKEND LOGS
echo ========================================
echo.

echo Backend server logs should appear in the terminal window.
echo Look for these types of errors:
echo.
echo 🔴 OpenAI errors: "OpenAI API key not configured"
echo 🔴 Database errors: "MongoDB connection failed"
echo 🔴 Route errors: "Cannot POST /api/emails/:id/extract"
echo 🔴 Controller errors: "TypeError" or "ReferenceError"
echo.
echo Check the "MVP-Dev Backend" terminal window for detailed errors.
echo.
pause
goto MENU

:TEST_ENDPOINTS
color 0D
echo.
echo ========================================
echo   TESTING API ENDPOINTS
echo ========================================
echo.

echo Testing if API endpoints are accessible...
echo.
echo You can test these URLs in your browser or Postman:
echo.
echo GET http://localhost:5000/api/emails
echo POST http://localhost:5000/api/emails/[EMAIL_ID]/extract
echo POST http://localhost:5000/api/emails/[EMAIL_ID]/detect-followup
echo.
echo If these return 404, the routes aren't set up correctly.
echo If they return 500, there's a server-side error.
echo.
pause
goto MENU

:OPEN_PAGE
color 0A
echo.
echo ========================================
echo   OPENING EMAIL PAGE
echo ========================================
echo.

echo Opening email page with debug tools...
start http://localhost:3000/emails

echo.
echo 📋 DEBUG CHECKLIST:
echo.
echo 1. ✓ Are emails loading? (Should see your MongoDB/Google emails)
echo 2. ✓ Are action buttons visible? (Should see LARGE blue buttons)
echo 3. ✓ Press F12 and check Console tab for errors
echo 4. ✓ Click a button and watch for error messages
echo 5. ✓ Check Network tab for failed API requests
echo.
pause
goto MENU

:RESTART_SERVERS
color 0B
echo.
echo ========================================
echo   RESTARTING SERVERS
echo ========================================
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo Starting MVP-Development Backend...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"
start "MVP-Dev Backend" cmd /k "echo Starting MVP-Development Backend... && npm start"

echo.
echo Starting MVP-Development Frontend...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\frontend"
start "MVP-Dev Frontend" cmd /k "echo Starting MVP-Development Frontend... && npm start"

echo.
echo ✅ Servers are restarting...
echo.
echo Wait 30 seconds for both servers to be ready.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause
goto MENU

:EXIT
color 0A
echo.
echo ========================================
echo   DEBUG SUMMARY
echo ========================================
echo.
echo To fix the 500 errors, check:
echo.
echo 1. 🔑 OpenAI API key is set in backend/.env
echo 2. 📧 Email models are properly defined
echo 3. 🔄 Gmail tokens haven't expired
echo 4. 🛠️  Controller functions exist and work
echo 5. 📊 Database connection is stable
echo.
echo For button visibility:
echo ✓ Applied debug version with HUGE buttons
echo ✓ Each email now has prominent action buttons
echo ✓ Better spacing and visual feedback
echo.
echo Good luck debugging! 🚀
echo.
pause
exit /b
