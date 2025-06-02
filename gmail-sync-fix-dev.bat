@echo off
color 0A
echo.
echo  ███████╗██╗███████╗███████╗████████╗ █████╗ ███████╗██╗  ██╗
echo  ██╔════╝██║╚══███╔╝╚══███╔╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
echo  █████╗  ██║  ███╔╝   ███╔╝    ██║   ███████║███████╗█████╔╝ 
echo  ██╔══╝  ██║ ███╔╝   ███╔╝     ██║   ██╔══██║╚════██║██╔═██╗ 
echo  ██║     ██║███████╗███████╗   ██║   ██║  ██║███████║██║  ██╗
echo  ╚═╝     ╚═╝╚══════╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
echo.
echo ========================================
echo   MVP-Development Gmail Email Sync Fix
echo ========================================
echo.

:MENU
color 0A
echo Please select an option:
echo.
echo 1. 🚀 Quick Fix - Update Email Page and Restart
echo 2. 🔍 Run Email Sync Diagnostic  
echo 3. 🧪 Test Gmail API Connection
echo 4. 📊 Check Database for Emails
echo 5. 🌐 Open Email Page in Browser
echo 6. 📋 View Troubleshooting Guide
echo 7. 🔄 Reset Gmail Connection
echo 8. 🛠️ Manual Server Restart
echo 9. ❌ Exit
echo.
set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto QUICK_FIX
if "%choice%"=="2" goto DIAGNOSTIC
if "%choice%"=="3" goto TEST_API
if "%choice%"=="4" goto CHECK_DB
if "%choice%"=="5" goto OPEN_BROWSER
if "%choice%"=="6" goto TROUBLESHOOTING
if "%choice%"=="7" goto RESET_CONNECTION
if "%choice%"=="8" goto RESTART_SERVERS
if "%choice%"=="9" goto EXIT

echo Invalid choice. Please try again.
goto MENU

:QUICK_FIX
color 0C
echo.
echo ========================================
echo   QUICK FIX - MVP-Development
echo ========================================
echo.

echo Step 1: Backing up current email page...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\frontend\src\pages"
if exist EmailsPage.js (
    copy EmailsPage.js EmailsPage.js.backup
    echo ✓ Backup created: EmailsPage.js.backup
) else (
    echo ❌ EmailsPage.js not found!
    pause
    goto MENU
)

echo.
echo Step 2: Installing improved email page...
if exist EmailsPageImproved.js (
    copy EmailsPageImproved.js EmailsPage.js
    echo ✓ EmailsPageImproved.js copied to EmailsPage.js
) else (
    echo ❌ EmailsPageImproved.js not found!
    echo Please ensure the improved version was created.
    pause
    goto MENU
)

echo.
echo Step 3: Restarting development servers...
echo Stopping existing processes...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo Starting MVP-Development backend server...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"
start "MVP-Dev Backend" cmd /k "npm start"

echo Starting MVP-Development frontend server...  
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\frontend"
start "MVP-Dev Frontend" cmd /k "npm start"

echo.
color 0A
echo ✅ Quick fix applied to MVP-Development! 
echo.
echo Next steps:
echo 1. Wait 30 seconds for servers to start
echo 2. Go to http://localhost:3000/emails
echo 3. You should now see the new email interface with:
echo    - Gmail connection status
echo    - Blue "Sync Emails" button (when connected)
echo    - Email statistics cards
echo    - Email list with individual actions
echo 4. Click "Sync Emails" to fetch your emails
echo.
pause
goto MENU

:DIAGNOSTIC
color 0E
echo.
echo ========================================
echo   EMAIL SYNC DIAGNOSTIC - MVP-Development
echo ========================================
echo.

echo Running email sync diagnostic for MVP-Development...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"
node diagnose-email-sync.js

echo.
pause
goto MENU

:TEST_API
color 0B
echo.
echo ========================================
echo   GMAIL API CONNECTION TEST
echo ========================================
echo.

echo Testing Gmail API connection in MVP-Development...
echo.
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"

echo Checking OAuth configuration...
node -e "
const config = require('./config/config');
console.log('=== OAuth Config ===');
console.log('Google Client ID:', config.googleClientId || 'MISSING');
console.log('Google Client Secret:', config.googleClientSecret ? 'SET' : 'MISSING'); 
console.log('Callback URL:', config.googleCallbackUrl);
console.log('Environment:', process.env.NODE_ENV);
"

echo.
pause
goto MENU

:CHECK_DB
color 0D
echo.
echo ========================================
echo   DATABASE EMAIL CHECK - MVP-Development
echo ========================================
echo.

echo Checking for emails in MVP-Development database...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"
node diagnose-email-sync.js

echo.
pause
goto MENU

:OPEN_BROWSER
color 0A
echo.
echo ========================================
echo   OPENING EMAIL PAGE - MVP-Development
echo ========================================
echo.

echo Opening MVP-Development email page...
start http://localhost:3000/emails

echo.
echo If the page doesn't load:
echo 1. Make sure both MVP-Development servers are running
echo 2. Check if you can access http://localhost:3000
echo 3. Check browser console for errors (F12)
echo.
echo Expected to see:
echo ✓ Gmail connection interface
echo ✓ Blue "Sync Emails" floating button (when connected)
echo ✓ Email statistics cards
echo ✓ Email list with sender, subject, and actions
echo.
pause
goto MENU

:TROUBLESHOOTING
color 0F
echo.
echo ========================================
echo   TROUBLESHOOTING GUIDE - MVP-Development
echo ========================================
echo.

echo PROBLEM: No emails showing after clicking "Sync Emails"
echo SOLUTIONS: 
echo   1. Check if Gmail account has recent emails
echo   2. Verify OAuth connection is not expired
echo   3. Check browser console (F12) for errors
echo   4. Try disconnecting and reconnecting Gmail
echo.

echo PROBLEM: "Failed to sync emails" error
echo SOLUTIONS:
echo   1. Check if Gmail token expired - reconnect Gmail
echo   2. Verify Google Cloud Console has correct redirect URI
echo   3. Ensure Gmail API is enabled in Google Console
echo   4. Check backend server logs for detailed errors
echo.

echo PROBLEM: No "Sync Emails" button visible
echo SOLUTIONS:
echo   1. Apply Quick Fix (option 1) to update email page
echo   2. Ensure Gmail connection shows "Connected" status
echo   3. Refresh browser page (Ctrl+F5)
echo.

echo PROBLEM: OAuth/Google connection issues
echo SOLUTIONS:
echo   1. Verify redirect URI: http://localhost:3000/auth/gmail/callback
echo   2. Check Google Console test users are added
echo   3. Try different Gmail account
echo   4. Clear browser cache and cookies
echo.

echo PROBLEM: Development servers not starting
echo SOLUTIONS:
echo   1. Check if ports 3000 and 5000 are available
echo   2. Run: npm install in both backend and frontend folders
echo   3. Check for Node.js version compatibility
echo.

echo.
pause
goto MENU

:RESET_CONNECTION
color 0C
echo.
echo ========================================
echo   RESET GMAIL CONNECTION - MVP-Development
echo ========================================
echo.

echo Manual Gmail Connection Reset Steps:
echo.
echo 1. Open http://localhost:3000/emails
echo 2. If connected, click "Disconnect Gmail" button
echo 3. Click "Connect Gmail" to start fresh OAuth flow
echo 4. Complete Google authorization with your account
echo 5. After redirect, you should see "Connected" status
echo 6. Click the blue "Sync Emails" button to fetch emails
echo.
echo If OAuth fails:
echo 1. Check Google Cloud Console OAuth consent screen
echo 2. Verify your email is in test users list
echo 3. Clear browser cache completely (Ctrl+Shift+Delete)
echo 4. Try incognito/private browsing mode
echo.
echo Would you like to open the email page now? (y/n)
set /p openPage=""
if /i "%openPage%"=="y" start http://localhost:3000/emails

pause
goto MENU

:RESTART_SERVERS
color 0B
echo.
echo ========================================
echo   MANUAL SERVER RESTART - MVP-Development
echo ========================================
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo Starting MVP-Development Backend Server...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"
start "MVP-Dev Backend" cmd /k "echo Starting MVP-Development Backend... && npm start"

echo.
echo Starting MVP-Development Frontend Server...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\frontend"
start "MVP-Dev Frontend" cmd /k "echo Starting MVP-Development Frontend... && npm start"

echo.
echo ✅ Servers are starting up...
echo.
echo Wait about 30 seconds, then:
echo 1. Backend should be available at: http://localhost:5000
echo 2. Frontend should be available at: http://localhost:3000
echo 3. Test email page at: http://localhost:3000/emails
echo.
pause
goto MENU

:EXIT
color 0A
echo.
echo Thank you for using the MVP-Development Email Sync Fix tool!
echo.
echo Key URLs for MVP-Development:
echo 📧 Email Page: http://localhost:3000/emails
echo 🖥️  Dashboard: http://localhost:3000/dashboard
echo 🔧 Backend API: http://localhost:5000
echo.
echo If you're still having issues:
echo 1. Check browser console for errors (F12)
echo 2. Review server terminal logs for errors
echo 3. Verify Gmail account has recent emails
echo 4. Try different browser or incognito mode
echo.
pause
exit /b

:ERROR
color 0C
echo.
echo ❌ An error occurred. Please check:
echo 1. MVP-Development backend server is running on port 5000
echo 2. MVP-Development frontend server is running on port 3000  
echo 3. MongoDB connection is working
echo 4. All environment variables are set in backend/.env
echo.
pause
goto MENU
