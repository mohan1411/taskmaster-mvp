@echo off
title Stop FizzTask Servers

echo =================================================================
echo Stopping FizzTask Development Servers
echo =================================================================
echo.

echo Stopping Node.js processes...

REM Kill all node processes (this will stop both frontend and backend)
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

REM Also try to kill any PM2 processes if running
pm2 stop all >nul 2>&1

echo.
echo All FizzTask development servers have been stopped.
echo.
pause
