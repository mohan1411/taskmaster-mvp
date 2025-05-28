@echo off
echo TaskMaster - MongoDB Followup Model Update
echo =========================================
echo.
echo This utility will:
echo 1. Create a backup of your current followupModel.js
echo 2. Install the new followupModel.js with unique index constraint
echo.
echo WARNING: This will modify your database model!
echo.
set /p confirm=Are you sure you want to continue? (Y/N): 

if /i "%confirm%" neq "Y" (
  echo Operation cancelled.
  exit /b
)

echo.
echo Updating followupModel.js...
echo.

cd %~dp0
copy models\followupModel.js models\followupModel.js.bak
copy models\followupModel.js.new models\followupModel.js

echo.
echo Update complete! Please restart your TaskMaster application.
echo.
pause
