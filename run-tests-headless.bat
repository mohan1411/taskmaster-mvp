@echo off
echo Running TaskMaster E2E Tests (Headless Mode)
echo.

cd /d "%~dp0"

echo Checking if TaskMaster server is running...
netstat -ano | findstr "LISTENING" | findstr ":3000" > nul
if %errorlevel% neq 0 (
    echo TaskMaster server is not running. Starting now...
    start cmd /k "cd /d "%~dp0" && start-taskmaster.bat"
    echo Waiting 15 seconds for server to start...
    timeout /t 15 > nul
) else (
    echo TaskMaster server is already running.
)

echo.
echo Running Cypress tests in headless mode...
echo.
npx cypress run

echo.
echo Tests completed.
echo.
pause
