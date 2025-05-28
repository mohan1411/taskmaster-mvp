@echo off
echo TaskMaster - List All Users
echo -------------------------
echo.

cd /d "%~dp0"
cd backend
node ../list-users.js

echo.
pause
