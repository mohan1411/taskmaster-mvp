@echo off
echo ========================================
echo   Deploy to Vercel + Railway
echo ========================================
echo.

echo Deploying fixes to production...
echo Frontend: Vercel ^(auto-deploy^)
echo Backend: Railway ^(auto-deploy^)
echo.

cd /d "D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development"

echo 1. Adding all changes...
git add .

echo 2. Committing with deployment message...
git commit -m "🚀 PRODUCTION DEPLOY: Fix email sync and task extraction

✅ Fixed OAuth authentication (client_id mismatch)
✅ Added prominent email sync buttons and UI
✅ Fixed task extraction to save tasks to database  
✅ Enhanced task visibility on Tasks page
✅ Improved error handling and authentication
✅ Ready for production deployment

Vercel + Railway auto-deployment ready."

echo 3. Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo   DEPLOYMENT INITIATED!
echo ========================================
echo.
echo ✅ Changes pushed to GitHub
echo ⏳ Vercel deploying frontend...
echo ⏳ Railway deploying backend...
echo.
echo 📊 Monitor deployment:
echo Frontend: https://vercel.com/dashboard
echo Backend: https://railway.app/dashboard  
echo.
echo 🧪 Test after deployment:
echo 1. https://fizztask.com ^(main site^)
echo 2. https://fizztask.com/emails ^(email sync^)
echo 3. https://fizztask.com/tasks ^(task visibility^)
echo.
echo Expected deployment time: 2-5 minutes
echo.
pause
