@echo off
echo TaskMaster Database Reset Tool
echo ----------------------------
echo.
echo This script will:
echo  1. Delete all tasks from the database
echo  2. Delete all follow-ups from the database
echo  3. Reset email 'processed' flags to false
echo.
echo This will give you a clean slate to test the unified email processing.
echo.
set /p confirm=Are you sure you want to continue? (Y/N): 

if /i not "%confirm%"=="Y" (
    echo Operation cancelled.
    goto :end
)

echo.
echo Connecting to database and clearing data...
echo.

cd /d "%~dp0"
cd backend
node clear-database.js

echo.
echo Database reset complete.
echo.
echo You can now run the test-unified-processing.bat script to test the
echo unified email processing with fresh data.
echo.

:end
pause
