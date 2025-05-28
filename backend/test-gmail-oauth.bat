@echo off
echo TaskMaster - Gmail OAuth Connection Test
echo ======================================
echo.
echo This utility will:
echo 1. Verify your OAuth configuration
echo 2. Generate an authentication URL for testing
echo.
echo Running test...
echo.

cd %~dp0
node test-gmail-oauth.js

echo.
pause
