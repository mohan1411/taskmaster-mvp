@echo off
echo TaskMaster - Complete Gmail Integration Reset
echo ================================================
echo.
echo This utility will:
echo 1. Show ALL current Gmail and email data
echo 2. Delete ALL emails from the database
echo 3. Delete ALL followups
echo 4. Completely disconnect Gmail integration
echo.
echo WARNING: This is a COMPLETE RESET and cannot be undone!
echo.
set /p confirm=Are you sure you want to continue? (Y/N): 

if /i "%confirm%" neq "Y" (
  echo Operation cancelled.
  exit /b
)

echo.
echo Starting complete reset process...
echo.

cd %~dp0
node complete-reset.js

echo.
echo Done! Please restart the application and connect your new Gmail account.
echo.
pause
