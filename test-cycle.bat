@echo off
echo TaskMaster Test Cycle
echo -------------------
echo.
echo This script will:
echo  1. Reset the database (delete tasks and follow-ups)
echo  2. Run the unified email processing test
echo.
echo This allows you to verify that the unified processor is working correctly.
echo.
set /p confirm=Are you sure you want to continue? (Y/N): 

if /i not "%confirm%"=="Y" (
    echo Operation cancelled.
    goto :end
)

echo.
echo Step 1: Resetting database...
echo.

cd /d "%~dp0"
call reset-database.bat

echo.
echo Step 2: Running unified email processing test...
echo.

call test-unified-processing.bat

echo.
echo Test cycle complete!
echo.
echo Now you can log into TaskMaster and verify that both tasks
echo and follow-ups were extracted from your emails.
echo.

:end
pause
