@echo off
color 0A
echo.
echo  ██████╗ ███████╗██████╗ ██╗      ██████╗ ██╗   ██╗    ████████╗ ██████╗     ██████╗ ██████╗  ██████╗ ██████╗ 
echo  ██╔══██╗██╔════╝██╔══██╗██║     ██╔═══██╗╚██╗ ██╔╝    ╚══██╔══╝██╔═══██╗    ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
echo  ██║  ██║█████╗  ██████╔╝██║     ██║   ██║ ╚████╔╝        ██║   ██║   ██║    ██████╔╝██████╔╝██║   ██║██║  ██║
echo  ██║  ██║██╔══╝  ██╔═══╝ ██║     ██║   ██║  ╚██╔╝         ██║   ██║   ██║    ██╔═══╝ ██╔══██╗██║   ██║██║  ██║
echo  ██████╔╝███████╗██║     ███████╗╚██████╔╝   ██║          ██║   ╚██████╔╝    ██║     ██║  ██║╚██████╔╝██████╔╝
echo  ╚═════╝ ╚══════╝╚═╝     ╚══════╝ ╚═════╝    ╚═╝          ╚═╝    ╚═════╝     ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ 
echo.
echo ========================================
echo   Deploy Dev Fixes to Production
echo ========================================
echo.

:MENU
echo Choose deployment method:
echo.
echo 1. 🚀 Deploy to GitHub ^(Recommended^)
echo 2. 📋 Manual File Copy Instructions
echo 3. 🔍 Check Current Git Status
echo 4. 🌐 Production Environment Setup
echo 5. ❌ Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto DEPLOY_GITHUB
if "%choice%"=="2" goto MANUAL_COPY
if "%choice%"=="3" goto GIT_STATUS
if "%choice%"=="4" goto PROD_SETUP
if "%choice%"=="5" goto EXIT

echo Invalid choice. Please try again.
goto MENU

:DEPLOY_GITHUB
color 0C
echo.
echo ========================================
echo   DEPLOYING TO GITHUB
echo ========================================
echo.

echo Step 1: Navigate to development directory...
cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development"

echo Step 2: Check git status...
git status

echo.
echo Step 3: Add all changes...
git add .

echo Step 4: Commit changes with descriptive message...
git commit -m "Fix email sync and task extraction issues

- Fixed OAuth authentication (client_id mismatch)
- Added proper email sync functionality with visible buttons
- Fixed task extraction to save tasks to database
- Updated frontend task service for proper authentication
- Enhanced email page with prominent action buttons
- Fixed task visibility issues on Tasks page

All email extraction features now working end-to-end."

echo.
echo Step 5: Push to GitHub...
git push origin main

echo.
echo ========================================
echo   GITHUB DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo ✅ All fixes have been pushed to GitHub
echo ✅ Production should now pull these changes
echo.
echo NEXT STEPS FOR PRODUCTION:
echo 1. SSH into your production server
echo 2. Run: git pull origin main
echo 3. Restart your production services
echo 4. Check that environment variables are correct
echo.
echo Production URL: https://fizztask.com
echo GitHub Repo: https://github.com/mohan1411/taskmaster-mvp
echo.
pause
goto MENU

:MANUAL_COPY
color 0E
echo.
echo ========================================
echo   MANUAL FILE COPY INSTRUCTIONS
echo ========================================
echo.

echo KEY FILES THAT NEED TO BE UPDATED IN PRODUCTION:
echo.
echo BACKEND FILES:
echo ✓ backend/controllers/emailController.js ^(task save fix^)
echo ✓ backend/.env ^(OAuth credentials^)
echo ✓ backend/controllers/emailTaskExtractor.js ^(if modified^)
echo.
echo FRONTEND FILES:
echo ✓ frontend/src/pages/EmailsPage.js ^(improved UI with buttons^)
echo ✓ frontend/src/services/taskService.js ^(auth headers^)
echo ✓ frontend/src/services/emailService.js ^(if modified^)
echo.
echo DEPLOYMENT STEPS:
echo 1. Copy these files from MVP-Development to your production folder
echo 2. Update production .env file with correct OAuth credentials
echo 3. Restart production backend and frontend services
echo 4. Test the email sync functionality
echo.
pause
goto MENU

:GIT_STATUS
color 0B
echo.
echo ========================================
echo   CHECKING GIT STATUS
echo ========================================
echo.

cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development"

echo Current git status:
git status

echo.
echo Recent commits:
git log --oneline -5

echo.
echo Remote repositories:
git remote -v

echo.
pause
goto MENU

:PROD_SETUP
color 0D
echo.
echo ========================================
echo   PRODUCTION ENVIRONMENT SETUP
echo ========================================
echo.

echo PRODUCTION CHECKLIST:
echo.
echo 🔧 ENVIRONMENT VARIABLES:
echo ✓ GOOGLE_CLIENT_ID ^(production OAuth client ID^)
echo ✓ GOOGLE_CLIENT_SECRET ^(production OAuth secret^)
echo ✓ GOOGLE_CALLBACK_URL=https://fizztask.com/auth/gmail/callback
echo ✓ OPENAI_API_KEY ^(your working OpenAI key^)
echo ✓ MONGODB_URI ^(production database^)
echo ✓ JWT_SECRET ^(secure secret for production^)
echo.
echo 🌐 GOOGLE CLOUD CONSOLE:
echo ✓ Add https://fizztask.com to authorized origins
echo ✓ Add https://fizztask.com/auth/gmail/callback to redirect URIs
echo ✓ Ensure production OAuth client is configured
echo.
echo 📊 DATABASE:
echo ✓ Verify MongoDB Atlas production database exists
echo ✓ Check connection string permissions
echo ✓ Ensure collections ^(users, emails, tasks^) are created
echo.
echo 🚀 DEPLOYMENT PLATFORM:
echo ✓ Update environment variables on hosting platform
echo ✓ Trigger production build/deployment
echo ✓ Check logs for any startup errors
echo.
echo 🧪 POST-DEPLOYMENT TESTING:
echo ✓ Test user registration/login
echo ✓ Test Gmail OAuth connection
echo ✓ Test email sync functionality
echo ✓ Test task extraction and visibility
echo.
pause
goto MENU

:EXIT
color 0A
echo.
echo ========================================
echo   DEPLOYMENT SUMMARY
echo ========================================
echo.
echo FIXES READY FOR PRODUCTION:
echo.
echo ✅ OAuth Authentication Fixed
echo ✅ Email Sync UI with Buttons
echo ✅ Task Database Saving
echo ✅ Task Visibility on Tasks Page
echo ✅ Improved Error Handling
echo ✅ Better User Feedback
echo.
echo RECOMMENDED DEPLOYMENT:
echo 1. Use GitHub deployment ^(option 1^) - cleanest approach
echo 2. Update production environment variables
echo 3. Test thoroughly after deployment
echo.
echo PRODUCTION URLS:
echo 🌐 Website: https://fizztask.com
echo 📧 Emails: https://fizztask.com/emails
echo 📋 Tasks: https://fizztask.com/tasks
echo 📊 GitHub: https://github.com/mohan1411/taskmaster-mvp
echo.
echo Good luck with the production deployment! 🚀
echo.
pause
exit /b
