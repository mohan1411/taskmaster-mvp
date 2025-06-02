@echo off
echo Stopping any existing TaskMaster processes...

echo Checking for processes on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    echo Stopping process ID %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Checking for processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Stopping process ID %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Waiting 3 seconds for processes to terminate...
timeout /t 3 /nobreak >nul

echo Starting fresh TaskMaster Development Environment...
echo.

echo Starting backend server...
start "TaskMaster Backend" cmd /k "cd backend && npm start"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak

echo Starting frontend development server...
start "TaskMaster Frontend" cmd /k "cd frontend && npm start"

echo.
echo Development servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause