@echo off
echo ========================================
echo   TaskMaster Layout Fixes Deployment
echo ========================================

echo.
echo This script will deploy layout fixes to production
echo.
echo Files to be updated:
echo - frontend/src/pages/SettingsPage.js
echo - frontend/src/pages/FollowUpsPage.js  
echo - frontend/src/styles/GlobalPages.css
echo.

set /p confirm="Continue with deployment? (y/n): "
if /i "%confirm%" neq "y" (
    echo Deployment cancelled.
    pause
    exit /b
)

echo.
echo Starting deployment...

echo.
echo 1. Adding changes to git...
git add frontend/src/pages/SettingsPage.js
git add frontend/src/pages/FollowUpsPage.js
git add frontend/src/styles/GlobalPages.css
git add LAYOUT_FIX_SUMMARY.md

echo.
echo 2. Committing changes...
git commit -m "Fix: Layout issues in production - standardize page containers and improve CSS compatibility

- Updated SettingsPage.js to use .page-container layout pattern
- Updated FollowUpsPage.js to use .page-container layout pattern  
- Improved GlobalPages.css for better cross-environment compatibility
- Changed from fixed to relative positioning
- Added fallback styles for production environments
- Added extra padding to prevent content cut-off

Fixes content being cut off in production on settings and follow-ups pages."

echo.
echo 3. Pushing to production...
git push origin main

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Wait for production deployment to complete
echo 2. Test all pages at fizztask.com:
echo    - Settings page (/settings)
echo    - Follow-ups page (/follow-ups) 
echo    - Tasks page (/tasks)
echo    - Emails page (/emails)
echo 3. Verify mobile responsiveness
echo 4. Check browser console for any errors
echo.
echo If issues occur, use git revert to rollback.
echo.

pause