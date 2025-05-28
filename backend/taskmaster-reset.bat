@echo off
setlocal enabledelayedexpansion

:menu
cls
echo TaskMaster - Data Reset Menu
echo ===========================
echo.
echo 1. Reset ALL (Tasks, Follow-ups, and Email flags)
echo 2. Reset Tasks only
echo 3. Reset Follow-ups only
echo 4. Reset Email flags only (keep Tasks and Follow-ups)
echo 5. Help and information
echo 0. Exit
echo.
set /p choice=Enter your choice (0-5): 

if "%choice%"=="1" goto reset_all
if "%choice%"=="2" goto reset_tasks
if "%choice%"=="3" goto reset_followups
if "%choice%"=="4" goto reset_flags
if "%choice%"=="5" goto help
if "%choice%"=="0" goto exit

echo Invalid choice, please try again.
timeout /t 2 >nul
goto menu

:reset_all
cls
echo TaskMaster - Reset ALL Data
echo ===========================
echo.
echo WARNING: This will DELETE ALL TASKS and FOLLOW-UPS from the database
echo and reset all email flags.
echo.
echo This action cannot be undone!
echo.
set /p confirm=Are you sure you want to continue? (Y/N): 

if /i "%confirm%" neq "Y" (
  echo Operation cancelled.
  timeout /t 2 >nul
  goto menu
)

echo.
echo Starting reset process...
echo.

cd %~dp0
node reset-tasks-followups.js

echo.
echo Done! All data has been reset.
echo.
pause
goto menu

:reset_tasks
cls
echo TaskMaster - Reset Tasks Only
echo ============================
echo.
echo WARNING: This will DELETE ALL TASKS from the database
echo and reset the taskExtracted flag on all emails.
echo.
echo This action cannot be undone!
echo.
set /p confirm=Are you sure you want to continue? (Y/N): 

if /i "%confirm%" neq "Y" (
  echo Operation cancelled.
  timeout /t 2 >nul
  goto menu
)

echo.
echo Starting reset process...
echo.

cd %~dp0
node selective-reset.js --tasks --reset-flags

echo.
echo Done! All tasks have been removed and email flags reset.
echo.
pause
goto menu

:reset_followups
cls
echo TaskMaster - Reset Follow-ups Only
echo ================================
echo.
echo WARNING: This will DELETE ALL FOLLOW-UPS from the database
echo and reset the needsFollowUp flag on all emails.
echo.
echo This action cannot be undone!
echo.
set /p confirm=Are you sure you want to continue? (Y/N): 

if /i "%confirm%" neq "Y" (
  echo Operation cancelled.
  timeout /t 2 >nul
  goto menu
)

echo.
echo Starting reset process...
echo.

cd %~dp0
node selective-reset.js --followups --reset-flags

echo.
echo Done! All follow-ups have been removed and email flags reset.
echo.
pause
goto menu

:reset_flags
cls
echo TaskMaster - Reset Email Flags Only
echo =================================
echo.
echo This will reset ALL email flags (taskExtracted and needsFollowUp)
echo but will NOT delete any tasks or follow-ups.
echo.
echo This is useful if you need to re-extract tasks or recreate follow-ups.
echo.
set /p confirm=Are you sure you want to continue? (Y/N): 

if /i "%confirm%" neq "Y" (
  echo Operation cancelled.
  timeout /t 2 >nul
  goto menu
)

echo.
echo Starting reset process...
echo.

cd %~dp0
node selective-reset.js --reset-flags

echo.
echo Done! All email flags have been reset.
echo.
pause
goto menu

:help
cls
echo TaskMaster - Reset Tool Help
echo ==========================
echo.
echo This tool allows you to selectively reset different types of data
echo in your TaskMaster database.
echo.
echo OPTIONS:
echo.
echo 1. Reset ALL - Deletes all tasks and follow-ups, and resets all email flags
echo    Use this for a complete clean slate.
echo.
echo 2. Reset Tasks only - Deletes all tasks and resets the taskExtracted flag
echo    Use this if you want to re-extract tasks from emails.
echo.
echo 3. Reset Follow-ups only - Deletes all follow-ups and resets needsFollowUp flag
echo    Use this if you want to recreate follow-ups.
echo.
echo 4. Reset Email flags only - Only resets email flags without deleting data
echo    Use this if emails incorrectly show as already processed.
echo.
echo ADVANCED OPTIONS:
echo.
echo For more advanced options, you can run the selective-reset.js script
echo directly with command-line arguments. Run the following for more info:
echo.
echo   node selective-reset.js --help
echo.
pause
goto menu

:exit
echo Exiting...
exit /b 0
