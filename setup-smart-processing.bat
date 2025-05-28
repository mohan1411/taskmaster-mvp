@echo off
echo TaskMaster Smart Processing Setup
echo ------------------------------
echo.
echo This script will set up smart processing options for selective email extraction.
echo This is ideal for new users with 1000+ historical emails.
echo.

cd /d "%~dp0"

echo Installing required dependencies...
cd backend
npm install async@3.2.4 --save

echo.
echo Smart processing files have been added to your project:
echo.
echo 1. smartEmailProcessor.js - Service for selective email processing 
echo 2. smartProcessingController.js - Controller for smart processing API
echo 3. Updated unified email routes to include smart processing endpoints
echo.
echo These changes provide a more user-friendly approach to handling large
echo email volumes by only processing the most relevant emails.
echo.
echo New API Endpoints:
echo - POST /api/unified-email/smart-process - Process emails with filters
echo - GET /api/unified-email/recommendations - Get processing suggestions
echo.
echo Smart Processing Features:
echo.
echo 1. Time-based filtering:
echo   - Process only emails from the last 30 days
echo   - Specify custom date ranges
echo.
echo 2. Sender-based filtering:
echo   - Process emails only from important contacts
echo   - Exclude certain senders
echo.
echo 3. Content-based filtering:
echo   - Process emails containing specific keywords
echo   - Exclude emails with certain terms
echo.
echo This approach is recommended for new users with large email histories,
echo as it lets them focus on the most relevant and actionable emails.
echo.
echo ----------------------
echo Would you like to restart the TaskMaster server to apply these changes? (Y/N)
set /p restart="> "

if /i "%restart%"=="Y" (
  echo.
  echo Stopping TaskMaster server...
  cd ..
  call stop-taskmaster.bat
  
  echo Waiting for server to stop...
  timeout /t 5 /nobreak > nul
  
  echo Starting TaskMaster server with smart processing...
  call start-taskmaster.bat
  
  echo.
  echo TaskMaster server restarted with smart processing enabled.
) else (
  echo.
  echo Remember to restart the TaskMaster server to apply these changes.
)

echo.
echo Smart processing setup complete!
echo.
pause
