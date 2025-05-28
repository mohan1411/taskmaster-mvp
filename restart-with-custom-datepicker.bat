@echo off
echo =============================================
echo CUSTOM DATEPICKER FIX FOR TASKMASTER MVP
echo =============================================
echo.
echo This script will:
echo 1. Remove @mui/x-date-pickers from dependencies
echo 2. Clean npm cache and reinstall dependencies
echo 3. Restart the application
echo.

echo Step 1: Removing @mui/x-date-pickers...
cd frontend
call npm uninstall @mui/x-date-pickers

echo.
echo Step 2: Cleaning npm cache...
call npm cache clean --force
if exist "node_modules\.cache" rmdir /s /q node_modules\.cache

echo.
echo Step 3: Installing clean dependencies...
call npm install

echo.
echo =============================================
echo FIX COMPLETE! You can now run: npm start
echo =============================================
echo The fix was applied by replacing all DatePicker 
echo components with custom implementations that do 
echo not rely on the problematic @mui/x-date-pickers
echo library.
echo.
echo Press any key to start the application...
pause > nul

echo Starting the application...
call npm start
