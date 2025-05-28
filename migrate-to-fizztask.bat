@echo off
echo =================================================================
echo FizzTask Domain Migration Script
echo =================================================================
echo.
echo This script will update your TaskMaster project to FizzTask 
echo and configure it for the fizztask.com domain.
echo.
echo What this script does:
echo - Updates all TaskMaster references to FizzTask
echo - Updates API port from 5000 to 8000
echo - Creates production environment files
echo - Updates package.json scripts
echo - Creates deployment guide
echo.
set /p confirm="Do you want to proceed? (y/n): "
if /i "%confirm%" NEQ "y" (
    echo Migration cancelled.
    pause
    exit /b
)

echo.
echo Starting migration...
node fizztask-domain-migration.js

echo.
echo =================================================================
echo MIGRATION COMPLETE!
echo =================================================================
echo.
echo Next steps:
echo 1. Review the created .env.production files
echo 2. Update your Google OAuth settings for fizztask.com
echo 3. Set up MongoDB Atlas for production
echo 4. Follow the FIZZTASK_DEPLOYMENT_GUIDE.md
echo.
echo Files created:
echo - backend/.env.production
echo - frontend/.env.production  
echo - FIZZTASK_DEPLOYMENT_GUIDE.md
echo.
pause
