@echo off
echo TaskMaster Test User Creator
echo -------------------------
echo.
echo This script will create a new test user for TaskMaster testing.
echo.

cd /d "%~dp0"
cd backend

echo Creating test user...
node create-test-user.js

echo.
echo Test user creation complete!
echo.
echo You can now:
echo 1. Log into TaskMaster with the test user credentials
echo 2. Generate test emails for this user
echo 3. Test the smart processing features
echo.
pause
