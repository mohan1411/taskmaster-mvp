@echo off
echo TaskMaster - Create Admin Account
echo -------------------------------
echo.

cd /d "%~dp0"
cd backend
node ../create-admin-fixed.js

echo.
echo Process completed. You can now login with the admin account.
echo.
pause
