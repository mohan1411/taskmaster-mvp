@echo off
title FizzTask Development Server

echo =================================================================
echo FizzTask Development Environment
echo =================================================================
echo.
echo Starting FizzTask development servers...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if backend dependencies are installed
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

REM Check if environment files exist
if not exist "backend\.env" (
    echo.
    echo Warning: backend\.env file not found!
    echo Please copy backend\.env.example to backend\.env and configure it.
    echo.
    pause
)

if not exist "frontend\.env.local" (
    echo.
    echo Note: frontend\.env.local not found. Using defaults.
    echo For custom configuration, copy frontend\.env.example to frontend\.env.local
    echo.
)

echo Starting backend server on port 8000...
start "FizzTask Backend" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo Starting frontend server on port 3000...
start "FizzTask Frontend" cmd /k "cd frontend && npm start"

echo.
echo =================================================================
echo FizzTask servers are starting up!
echo =================================================================
echo.
echo Backend API: http://localhost:8000
echo Frontend App: http://localhost:3000
echo.
echo Both servers will open in separate command windows.
echo Close those windows to stop the servers.
echo.
echo Press any key to close this window...
pause >nul
