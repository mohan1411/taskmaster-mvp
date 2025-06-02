@echo off
echo ========================================
echo   Quick Email Sync Fix - MVP-Development
echo ========================================
echo.

echo 1. Backing up current email page...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\frontend\src\pages"
copy EmailsPage.js EmailsPage.js.backup

echo 2. Replacing with improved version...
copy EmailsPageImproved.js EmailsPage.js

echo 3. Restarting servers...
taskkill /F /IM node.exe >nul 2>&1

echo 4. Starting backend...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"
start "MVP-Dev Backend" cmd /k "npm start"

echo 5. Starting frontend...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\frontend"
start "MVP-Dev Frontend" cmd /k "npm start"

echo.
echo ========================================
echo   Fix Applied Successfully!
echo ========================================
echo.
echo Wait 30 seconds, then visit:
echo http://localhost:3000/emails
echo.
echo You should now see:
echo ✓ Gmail connection interface
echo ✓ Blue "Sync Emails" button (when connected)  
echo ✓ Email statistics cards
echo ✓ List of emails with actions
echo.
echo Click "Sync Emails" to fetch your Gmail messages!
echo.
pause
