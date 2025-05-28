@echo off
echo TaskMaster Password Reset Tool
echo -----------------------------
echo.

set /p email=Enter your email: 
set /p password=Enter new password: 

echo.
echo Resetting password for %email%...
echo.

cd /d "%~dp0"
cd backend
node ../reset-password-fixed.js %email% %password%

echo.
echo Password reset completed. You can now login with your new password.
echo.
pause
