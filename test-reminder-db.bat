@echo off
echo ================================
echo Testing Follow-up Reminder Settings API
echo ================================

echo.
echo Running database connectivity test...
node test-reminder-settings-db.js

echo.
echo Database test completed. Check output above for results.
echo.

pause
