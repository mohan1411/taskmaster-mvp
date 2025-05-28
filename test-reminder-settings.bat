@echo off
echo ================================
echo Testing Follow-up Reminder Settings
echo ================================

echo.
echo Starting TaskMaster server...
start /B "TaskMaster Backend" npm run server

echo Waiting for server to start...
timeout /t 5 /nobreak > nul

echo.
echo Starting TaskMaster frontend...
start /B "TaskMaster Frontend" cd frontend && npm start

echo.
echo Waiting for frontend to start...
timeout /t 10 /nobreak > nul

echo.
echo Opening browser for testing...
start http://localhost:3000

echo.
echo Test Instructions:
echo 1. Login to the application
echo 2. Navigate to Follow-ups section
echo 3. Create or open a follow-up
echo 4. Click on "Configure" in the Reminder Settings section
echo 5. Try different settings:
echo    - Toggle reminder enabled/disabled
echo    - Add/remove reminder schedules
echo    - Change notification types
echo    - Toggle priority-based timing
echo 6. Click "Save Settings"
echo 7. Verify the settings are saved and persist after refresh
echo.
echo Check the browser console and terminal for any errors.
echo.

pause
