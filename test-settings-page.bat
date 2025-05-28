@echo off
echo ================================
echo TaskMaster Settings Page Test
echo ================================

echo.
echo Starting TaskMaster application...
echo.

echo Starting backend server...
start /B "TaskMaster Backend" npm run server

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting frontend...
start /B "TaskMaster Frontend" cd frontend && npm start

echo Waiting for frontend to start...
timeout /t 10 /nobreak > nul

echo.
echo Opening browser for settings testing...
start http://localhost:3000/settings

echo.
echo Settings Testing Guide:
echo =======================
echo.
echo 1. PROFILE SETTINGS TAB
echo    - Update your name and email
echo    - Test password change functionality
echo    - Verify avatar display
echo.
echo 2. EMAIL INTEGRATION TAB
echo    - Check Google connection status
echo    - Test Google account connection (opens auth dialog)
echo    - Configure email sync settings
echo    - Set task extraction preferences
echo.
echo 3. NOTIFICATIONS TAB
echo    - Enable/disable browser notifications
echo    - Configure email notification frequency
echo    - Test notification types
echo    - Set quiet hours
echo.
echo 4. TASK EXTRACTION TAB
echo    - Configure AI extraction settings
echo    - Set extraction sensitivity
echo    - Configure follow-up detection
echo    - Test privacy settings
echo.
echo 5. INTERFACE TAB
echo    - Try different themes
echo    - Configure dashboard widgets
echo    - Set language and timezone
echo    - Test accessibility options
echo.
echo What to Test:
echo =============
echo - All settings save properly
echo - UI updates immediately after changes
echo - Settings persist after page refresh
echo - Error handling for invalid inputs
echo - Loading states work correctly
echo - Success/error notifications appear
echo.
echo Debug Information:
echo ==================
echo Check browser console for:
echo - API request/response logs
echo - Settings load/save operations
echo - Error messages
echo.
echo Check backend terminal for:
echo - Settings API endpoints being called
echo - Database operations
echo - Error logs
echo.

pause
