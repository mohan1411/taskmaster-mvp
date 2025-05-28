@echo off
echo TaskMaster - Gmail Sync Diagnostic Test
echo ======================================
echo.
echo This utility will:
echo 1. Attempt to sync emails with detailed logging
echo 2. Show exactly where any errors occur
echo 3. Write a detailed log file for troubleshooting
echo.
echo Starting test...
echo.

cd %~dp0
node test-gmail-sync.js

echo.
echo Log file with complete diagnostics is saved at:
echo %~dp0controllers\gmail-sync-debug.log
echo.
pause
