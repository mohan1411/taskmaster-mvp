@echo off
echo Restarting TaskMaster Development Environment after API fix...

echo Stopping React development server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Stopping backend server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Waiting 3 seconds for processes to terminate...
timeout /t 3 /nobreak >nul

echo Starting backend server...
start "TaskMaster Backend" cmd /k "cd backend && npm start"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak

echo Starting React development server...
start "TaskMaster Frontend" cmd /k "cd frontend && npm start"

echo.
echo Development servers are restarting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo The Follow-ups page should now work correctly!
echo.
pause