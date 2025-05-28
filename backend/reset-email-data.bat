@echo off
echo TaskMaster Email Data Reset Utility
echo ======================================
echo.
echo This utility will:
echo 1. Disconnect your current Gmail integration
echo 2. Delete all email data from the database
echo 3. Reset the system to connect a new Gmail account
echo.
echo WARNING: This action cannot be undone!
echo.
set /p confirm=Are you sure you want to continue? (Y/N): 

if /i "%confirm%" neq "Y" (
  echo Operation cancelled.
  exit /b
)

echo.
echo Starting email data reset process...
echo.

cd %~dp0
node reset-email-data.js

echo.
echo Done! Please restart the application and connect your new Gmail account.
echo.
pause
