@echo off
echo ===================================
echo Starting TaskMaster MVP
echo ===================================
echo.
echo This script will:
echo 1. Start the backend server on port 8000
echo 2. Start the frontend server
echo.

echo Starting the backend server...
start cmd /k "cd backend && npm start"

echo.
echo Waiting for backend to initialize (10 seconds)...
timeout /t 10 /nobreak > nul

echo.
echo Starting the frontend server...
start cmd /k "cd frontend && npm start"

echo.
echo ===================================
echo TaskMaster is now running!
echo ===================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo You can now use the application.
echo.
echo IMPORTANT: Keep both command windows open while using the application.
echo When you're done, close both command windows to stop the servers.
echo.
