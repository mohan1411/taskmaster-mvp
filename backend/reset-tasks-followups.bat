@echo off
echo TaskMaster - Tasks and Follow-ups Reset Utility
echo ================================================
echo.
echo This utility will:
echo 1. DELETE ALL TASKS from the database
echo 2. DELETE ALL FOLLOW-UPS from the database
echo 3. Reset the taskExtracted and needsFollowUp flags on all emails
echo.
echo WARNING: This action cannot be undone!
echo.
set /p confirm=Are you sure you want to continue? (Y/N): 

if /i "%confirm%" neq "Y" (
  echo Operation cancelled.
  exit /b
)

echo.
echo Starting reset process...
echo.

cd %~dp0
node reset-tasks-followups.js

echo.
echo Done! All tasks and follow-ups have been removed.
echo.
pause
