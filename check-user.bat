@echo off
echo TaskMaster - Check User Account
echo -----------------------------
echo.

set /p email=Enter your email to check: 

echo.
echo Checking for user with email: %email%...
echo.

cd /d "%~dp0"
cd backend
node ../check-user.js %email%

echo.
pause
