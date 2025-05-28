@echo off
echo TaskMaster - Follow-up Label Fix Test
echo =====================================
echo.
echo This script will:
echo 1. Create a follow-up for an email
echo 2. Check if the email has the follow-up flag set
echo 3. Delete the follow-up
echo 4. Verify the follow-up flag is properly reset
echo.
echo Running test...
echo.

cd %~dp0
node test-followup-labels.js

echo.
pause
