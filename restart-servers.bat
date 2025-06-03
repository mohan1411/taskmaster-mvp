@echo off
echo Restarting Development servers to apply CORS fix...
echo.

echo Stopping any running Node.js processes...
taskkill /F /IM node.exe 2>nul

echo.
echo Starting backend server...
cd backend
start cmd /k "npm start"

echo.
echo Starting frontend server...
cd ..\frontend
start cmd /k "npm start"

echo.
echo Servers are restarting. Please wait a moment for them to fully start.
echo The CORS issue should now be fixed.
echo.
pause
