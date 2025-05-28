@echo off
echo =================================================================
echo FizzTask GitHub Setup and Deployment Guide
echo =================================================================
echo.
echo This script will help you:
echo 1. Set up GitHub repository
echo 2. Push your code to GitHub
echo 3. Prepare for fizztask.com deployment
echo.
echo Prerequisites:
echo - Git installed on your computer
echo - GitHub account (free)
echo.
set /p confirm="Ready to proceed? (y/n): "
if /i "%confirm%" NEQ "y" (
    echo Setup cancelled.
    pause
    exit /b
)

echo.
echo =================================================================
echo Step 1: Checking Git Installation
echo =================================================================
git --version
if errorlevel 1 (
    echo.
    echo ERROR: Git is not installed!
    echo Please download and install Git from: https://git-scm.com/
    echo After installing Git, run this script again.
    pause
    exit /b 1
)

echo.
echo Git is installed! ✅
echo.

echo =================================================================
echo Step 2: Setting up .gitignore
echo =================================================================

REM Create/update .gitignore file
(
echo # Dependencies
echo node_modules/
echo npm-debug.log*
echo yarn-debug.log*
echo yarn-error.log*
echo.
echo # Environment variables
echo .env
echo .env.local
echo .env.development.local
echo .env.test.local
echo .env.production.local
echo backend/.env
echo frontend/.env.local
echo.
echo # Build outputs
echo /build
echo /dist
echo frontend/build/
echo.
echo # Runtime data
echo pids
echo *.pid
echo *.seed
echo *.pid.lock
echo.
echo # Coverage directory used by tools like istanbul
echo coverage/
echo.
echo # Uploads
echo backend/uploads/
echo.
echo # Logs
echo logs
echo *.log
echo.
echo # IDE files
echo .vscode/
echo .idea/
echo *.swp
echo *.swo
echo *~
echo.
echo # OS generated files
echo .DS_Store
echo .DS_Store?
echo ._*
echo .Spotlight-V100
echo .Trashes
echo ehthumbs.db
echo Thumbs.db
echo.
echo # Temporary files
echo temp/
echo tmp/
) > .gitignore

echo .gitignore file created! ✅

echo.
echo =================================================================
echo Step 3: Initialize Git Repository
echo =================================================================

REM Check if already a git repository
if exist ".git" (
    echo Git repository already exists! ✅
) else (
    echo Initializing Git repository...
    git init
    echo Git repository initialized! ✅
)

echo.
echo =================================================================
echo Step 4: Configure Git (if needed)
echo =================================================================

REM Check if git is configured
git config user.name >nul 2>&1
if errorlevel 1 (
    echo.
    echo Git is not configured. Let's set it up:
    set /p git_name="Enter your name: "
    set /p git_email="Enter your email: "
    git config --global user.name "%git_name%"
    git config --global user.email "%git_email%"
    echo Git configured! ✅
) else (
    echo Git is already configured! ✅
    echo Name: 
    git config user.name
    echo Email: 
    git config user.email
)

echo.
echo =================================================================
echo Step 5: Adding Files to Git
echo =================================================================

echo Adding all files to git...
git add .
echo Files added! ✅

echo.
echo =================================================================
echo Step 6: Creating Initial Commit
echo =================================================================

git commit -m "Initial FizzTask commit - ready for fizztask.com deployment"
echo Initial commit created! ✅

echo.
echo =================================================================
echo SETUP COMPLETE!
echo =================================================================
echo.
echo Your FizzTask code is now ready for GitHub!
echo.
echo NEXT STEPS:
echo 1. Go to https://github.com
echo 2. Create a new repository called "fizztask"
echo 3. Copy the GitHub repository URL
echo 4. Run: git remote add origin [YOUR_GITHUB_URL]
echo 5. Run: git push -u origin main
echo.
echo Then we can deploy to fizztask.com!
echo.
echo Example commands after creating GitHub repo:
echo git remote add origin https://github.com/yourusername/fizztask.git
echo git push -u origin main
echo.
pause
