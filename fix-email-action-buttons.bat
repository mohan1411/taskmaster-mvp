@echo off
echo ========================================
echo   Email Action Buttons Fix - MVP-Development
echo ========================================
echo.

echo 1. Backing up current email page...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\frontend\src\pages"
copy EmailsPage.js EmailsPage.js.backup

echo 2. Replacing with version that always shows action buttons...
copy EmailsPageWithButtons.js EmailsPage.js

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
echo   Fix Applied Successfully!
echo ========================================
echo.
echo Changes made:
echo ✓ Action buttons now ALWAYS visible for each email
echo ✓ Added tooltips to explain what each button does
echo ✓ Added loading spinners when processing
echo ✓ Better visual feedback with colored buttons
echo ✓ Success/error messages for each action
echo.
echo Wait 30 seconds, then visit:
echo http://localhost:3000/emails
echo.
echo You should now see:
echo ✓ Extract Tasks button (TaskAlt icon) for every email
echo ✓ Follow-up Detection button (ReplyAll icon) for every email
echo ✓ Buttons change color when action is completed
echo ✓ Loading spinner when processing
echo ✓ Tooltips when hovering over buttons
echo.
pause
