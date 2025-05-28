@echo off
echo ===================================
echo Starting TaskMaster MVP (Alternative Ports)
echo ===================================
echo.
echo This script will:
echo 1. Start the backend server on port 8002
echo 2. Start the frontend server on port 3001
echo.

echo First, updating the configuration files...

echo Updating backend port...
echo PORT=8002 > backend\.env.port

echo Updating frontend API URL...
echo REACT_APP_API_URL=http://localhost:8002 > frontend\.env.local.temp
type frontend\.env.local >> frontend\.env.local.temp
move /Y frontend\.env.local.temp frontend\.env.local
echo Frontend configuration updated.

echo.
echo Starting the backend server on port 8002...
start cmd /k "cd backend && set PORT=8002 && npm start"

echo.
echo Waiting for backend to initialize (10 seconds)...
timeout /t 10 /nobreak > nul

echo.
echo Starting the frontend server on port 3001...
start cmd /k "cd frontend && set PORT=3001 && npm start"

echo.
echo ===================================
echo TaskMaster is now running on alternative ports!
echo ===================================
echo Backend: http://localhost:8002
echo Frontend: http://localhost:3001
echo.
echo You can now use the application at http://localhost:3001
echo.
echo IMPORTANT: Keep both command windows open while using the application.
echo When you're done, close both command windows to stop the servers.
echo.
