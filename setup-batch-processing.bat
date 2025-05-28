@echo off
echo TaskMaster Batch Processing Setup
echo -----------------------------
echo.
echo This script will set up batch processing for handling large volumes of emails.
echo This is essential for users with 1000+ emails to process efficiently.
echo.

cd /d "%~dp0"

echo Installing required dependencies...
cd backend
npm install async@3.2.4 --save

echo.
echo Batch processing files have been added to your project:
echo.
echo 1. batchEmailProcessor.js - Service for processing emails in batches 
echo 2. batchProcessingController.js - Controller for batch processing API
echo 3. Updated unified email routes to include batch processing endpoints
echo.
echo These changes allow TaskMaster to efficiently process large volumes of emails
echo with proper rate limiting, concurrency control, and progress tracking.
echo.
echo New API Endpoints:
echo - POST /api/unified-email/batch-process - Start batch processing
echo - GET /api/unified-email/job/:jobId - Check job status
echo - GET /api/unified-email/stats - Get email processing stats
echo.
echo Usage Recommendations:
echo - Set batchSize to 10-20 emails per batch
echo - Set concurrentBatches to 2-3 for optimal performance
echo - Set maxEmails to limit the number of emails processed in a single run
echo.
echo Example API request:
echo {
echo   "batchSize": 10,
echo   "concurrentBatches": 2, 
echo   "maxEmails": 1000
echo }
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
  
  echo Starting TaskMaster server with batch processing...
  call start-taskmaster.bat
  
  echo.
  echo TaskMaster server restarted with batch processing enabled.
) else (
  echo.
  echo Remember to restart the TaskMaster server to apply these changes.
)

echo.
echo Batch processing setup complete!
echo.
pause
