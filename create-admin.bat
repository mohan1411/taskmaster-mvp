@echo off
echo TaskMaster - Create Admin Account
echo -------------------------------
echo.

cd /d "%~dp0"
node create-admin.js

echo.
echo Process completed. You can now login with the admin account.
echo.
pause
