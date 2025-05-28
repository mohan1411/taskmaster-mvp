@echo off
echo TaskMaster - Email Status Checker
echo ================================
echo.
echo This tool allows you to:
echo 1. Check the status of a specific email
echo 2. Verify if its needsFollowUp flag is set correctly
echo 3. Fix the status if needed
echo.

cd %~dp0
node check-email-status.js
