@echo off
echo TaskMaster - Comprehensive Followup Fix
echo =======================================
echo.
echo This utility will:
echo 1. Create a unique database index to prevent future duplicates
echo 2. Remove all existing duplicate followups
echo 3. Keep only the most recent followup for each email
echo.
echo WARNING: This will permanently modify your database!
echo.
set /p confirm=Are you sure you want to continue? (Y/N): 

if /i "%confirm%" neq "Y" (
  echo Operation cancelled.
  exit /b
)

echo.
echo Starting comprehensive followup fix...
echo.

cd %~dp0
node fix-followup-duplicates.js

echo.
echo Fix complete! Please restart your TaskMaster application.
echo.
pause
