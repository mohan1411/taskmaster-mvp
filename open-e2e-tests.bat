@echo off
setlocal enabledelayedexpansion
title TaskMaster E2E Test Runner (UI)

cd /d "%~dp0"

echo Checking if TaskMaster server is running...
for /f "tokens=1,5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":3000"') do (
    echo Frontend server is already running on port 3000 (PID: %%b)
    set "frontend_running=true"
)

if not defined frontend_running (
    echo Starting TaskMaster server...
    start cmd /k "cd /d "%~dp0" && call start-taskmaster.bat"
    echo Waiting for server to start (15 seconds)...
    timeout /t 15 /nobreak > nul
)

echo Opening Cypress Test Runner...
npx cypress open

exit /b
