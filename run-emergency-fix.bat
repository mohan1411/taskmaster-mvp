@echo off
echo ============================================
echo EMERGENCY DATEPICKER FIX FOR TASKMASTER MVP
echo ============================================
echo This script will:
echo 1. Apply the emergency DatePicker fix
echo 2. Install the correct version of dependencies
echo 3. Clear caches to ensure a clean start

echo:
echo Step 1: Applying the emergency fix...
node fix-datepicker-emergency.js

echo:
echo Step 2: Installing dependencies...
cd frontend
call npm install

echo:
echo Step 3: Clearing React cache...
call npm cache clean --force
if exist "node_modules\.cache" rmdir /s /q node_modules\.cache

echo:
echo ============================================
echo FIX COMPLETE! You can now run: npm start
echo ============================================
echo If you still encounter issues, check 
echo DATEPICKER_FIX_INSTRUCTIONS.md
echo for additional options and troubleshooting.

pause
