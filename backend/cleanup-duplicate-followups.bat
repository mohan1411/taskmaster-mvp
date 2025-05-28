@echo off
echo TaskMaster - Duplicate Follow-ups Cleanup Utility
echo ================================================
echo.
echo This utility will:
echo 1. Scan the database for duplicate follow-ups (multiple follow-ups for the same email)
echo 2. Keep the most recent follow-up for each email and remove duplicates
echo 3. Output a report of what was cleaned up
echo.
echo WARNING: This will permanently remove duplicate follow-ups!
echo.
set /p confirm=Are you sure you want to continue? (Y/N): 

if /i "%confirm%" neq "Y" (
  echo Operation cancelled.
  exit /b
)

echo.
echo Starting cleanup process...
echo.

cd %~dp0
node cleanup-duplicate-followups.js

echo.
echo Done! Duplicate follow-ups have been cleaned up.
echo.
pause
