@echo off
echo ===================================
echo EMERGENCY SERVER FIX
echo ===================================
echo.
echo This script will modify the server to temporarily disable AI features
echo so that it can start without OpenAI errors.
echo.
echo Press any key to continue or Ctrl+C to abort...
pause > nul

cd backend
node emergency-fix.js

echo.
echo ===================================
echo Starting server...
echo ===================================
npm start
