@echo off
echo TaskMaster - Email Follow-up Flag Reset Tool
echo ============================================
echo.
echo This utility will:
echo 1. Find all emails that have follow-ups
echo 2. Set their needsFollowUp flag to true
echo 3. Find all emails without follow-ups
echo 4. Set their needsFollowUp flag to false
echo.
echo This will ensure that follow-up labels display correctly in the email list.
echo.
echo WARNING: This will directly modify your database values!
echo.
set /p confirm=Are you sure you want to continue? (Y/N): 

if /i "%confirm%" neq "Y" (
  echo Operation cancelled.
  exit /b
)

echo.
echo Starting email flag reset...
echo.

cd %~dp0
node reset-email-flags.js

echo.
echo Done! Please restart your application to see the changes.
echo.
pause
