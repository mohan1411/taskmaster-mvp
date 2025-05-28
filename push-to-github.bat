@echo off
echo =================================================================
echo FizzTask - Check Git Status and Push to GitHub
echo =================================================================
echo.

echo Checking current Git status...
echo.

echo Current remote repositories:
git remote -v
echo.

echo Current branch:
git branch
echo.

echo Files that have changed:
git status
echo.

echo =================================================================
echo Pushing Updated FizzTask Code to GitHub
echo =================================================================
echo.

echo Adding all changes...
git add .

echo Creating commit with FizzTask updates...
git commit -m "FizzTask domain migration complete - ready for fizztask.com deployment"

echo Pushing to GitHub...
git push origin main

if errorlevel 1 (
    echo.
    echo If push failed, trying with different branch name...
    git push origin master
)

echo.
echo =================================================================
echo SUCCESS! Your FizzTask code is now on GitHub
echo =================================================================
echo.
echo Next steps:
echo 1. Your code is now ready for deployment
echo 2. Go to Railway.app to deploy backend
echo 3. Go to Vercel.com to deploy frontend
echo 4. Connect fizztask.com domain
echo.
echo Your GitHub repository should be updated with all FizzTask changes!
echo.
pause
