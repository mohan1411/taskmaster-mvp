@echo off
echo TaskMaster Smart Onboarding Setup
echo ------------------------------
echo.
echo This script will set up a smart onboarding experience that adapts
echo to each user's email volume.
echo.

cd /d "%~dp0"

echo Creating onboarding files...
echo.
echo The following files have been added to your project:
echo.
echo 1. onboardingRecommendationService.js - Determines recommendations based on email volume
echo 2. onboardingController.js - Handles API endpoints for onboarding
echo 3. onboardingRoutes.js - Defines routes for onboarding experience
echo.
echo These files create a system that:
echo.
echo - Only shows smart processing recommendations when email volume exceeds 500 emails
echo - Suggests different approaches based on the user's actual email patterns
echo - Provides personalized messages for users with different email volumes
echo - Adapts the onboarding experience to be simpler for users with few emails
echo.
echo To add these routes to server.js, update your server.js file with:
echo.
echo const onboardingRoutes = require('./routes/onboardingRoutes');
echo app.use('/api/onboarding', onboardingRoutes);
echo.
echo ----------------------
echo Would you like to add these routes to server.js automatically? (Y/N)
set /p update_server="> "

if /i "%update_server%"=="Y" (
  echo.
  echo Creating server update script...
  
  cd backend
  node -e "const fs=require('fs');const serverPath='./server.js';let serverContent=fs.readFileSync(serverPath,'utf8');if(!serverContent.includes('onboardingRoutes')){const routeImport='const onboardingRoutes = require(\'./routes/onboardingRoutes\');';const routeUse='app.use(\'/api/onboarding\', onboardingRoutes);';serverContent=serverContent.replace('const testRoutes = require(\'./routes/testRoutes\');',`const testRoutes = require('./routes/testRoutes');\n${routeImport}`);serverContent=serverContent.replace('app.use(\'/api/test\', testRoutes);',`app.use('/api/test', testRoutes);\n${routeUse}`);fs.writeFileSync(serverPath,serverContent,'utf8');console.log('Server.js updated successfully.');}else{console.log('Routes already exist in server.js.');}"
  cd ..
  
  echo Would you like to restart the TaskMaster server to apply these changes? (Y/N)
  set /p restart="> "
  
  if /i "%restart%"=="Y" (
    echo.
    echo Stopping TaskMaster server...
    call stop-taskmaster.bat
    
    echo Waiting for server to stop...
    timeout /t 5 /nobreak > nul
    
    echo Starting TaskMaster server with smart onboarding...
    call start-taskmaster.bat
    
    echo.
    echo TaskMaster server restarted with smart onboarding enabled.
  ) else (
    echo.
    echo Remember to restart the TaskMaster server to apply these changes.
  )
) else (
  echo.
  echo Please update your server.js file manually to add the onboarding routes.
)

echo.
echo Smart onboarding setup complete!
echo.
echo With this implementation, TaskMaster will now:
echo - Show standard processing for users with <500 emails
echo - Show smart selective processing options for users with >500 emails
echo - Adapt recommendations based on each user's email patterns
echo.
pause
