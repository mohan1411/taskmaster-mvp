@echo off
echo TaskMaster - Reset Tasks Only
echo ==============================
echo.
echo This utility will:
echo 1. DELETE ALL TASKS from the database
echo 2. Reset the taskExtracted flag on all emails
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
node selective-reset.js --tasks --reset-flags

echo.
echo Done! All tasks have been removed and email flags reset.
echo.
pause
