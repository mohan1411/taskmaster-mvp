@echo off
echo ========================================
echo   Large Action Buttons Fix - MVP-Development
echo ========================================
echo.

echo 1. Backing up current email page...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\frontend\src\pages"
copy EmailsPage.js EmailsPage.js.backup

echo 2. Replacing with version that has large, prominent action buttons...
copy EmailsPageWithLargeButtons.js EmailsPage.js

echo 3. Restarting frontend server...
taskkill /F /IM node.exe >nul 2>&1

echo 4. Starting backend...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\backend"
start "MVP-Dev Backend" cmd /k "npm start"

echo 5. Starting frontend...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\frontend"
start "MVP-Dev Frontend" cmd /k "npm start"

echo.
echo ========================================
echo   MAJOR UI IMPROVEMENT APPLIED!
echo ========================================
echo.
echo NEW FEATURES:
echo ✓ Large, prominent "Extract Tasks" and "Detect Follow-up" BUTTONS
echo ✓ Better email layout with clear sender and subject
echo ✓ Visual feedback - buttons change appearance when actions completed
echo ✓ Loading indicators on buttons during processing
echo ✓ Color-coded status (green for success, orange for follow-up)
echo ✓ Much easier to see and click action buttons
echo.
echo Wait 30 seconds, then visit:
echo http://localhost:3000/emails
echo.
echo You should now see LARGE buttons for:
echo 🟦 "Extract Tasks" - Blue outlined button
echo 🟦 "Detect Follow-up" - Blue outlined button
echo.
echo After clicking:
echo 🟢 "Tasks Extracted" - Green filled button
echo 🟠 "Follow-up Set" - Orange filled button
echo.
pause
