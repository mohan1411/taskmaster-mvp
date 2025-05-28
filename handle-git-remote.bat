@echo off
echo =================================================================
echo FizzTask - Handle Existing Git Remote
echo =================================================================
echo.

echo Current Git remote configuration:
git remote -v
echo.

echo =================================================================
echo Choose your option:
echo =================================================================
echo.
echo Option 1: Use your existing repository (recommended)
echo   - Keep using your current GitHub repo
echo   - Just push FizzTask updates there
echo.
echo Option 2: Change to new fizztask repository
echo   - Remove current remote
echo   - Add new fizztask repository
echo.
echo Option 3: Add fizztask as additional remote
echo   - Keep existing remote as 'origin'
echo   - Add fizztask repo as 'fizztask'
echo.

set /p choice="Which option do you prefer? (1/2/3): "

if "%choice%"=="1" (
    echo.
    echo =================================================================
    echo Option 1: Using Existing Repository
    echo =================================================================
    echo.
    echo Adding and committing FizzTask changes...
    git add .
    git commit -m "FizzTask domain migration complete - ready for fizztask.com deployment"
    echo.
    echo Pushing to your existing repository...
    git push origin main
    if errorlevel 1 git push origin master
    echo.
    echo SUCCESS! FizzTask updates pushed to your existing repository.
    echo You can now deploy from this repository to fizztask.com
    
) else if "%choice%"=="2" (
    echo.
    echo =================================================================
    echo Option 2: Changing to New Repository
    echo =================================================================
    echo.
    set /p new_repo="Enter your new fizztask repository URL: "
    echo.
    echo Removing current remote...
    git remote remove origin
    echo Adding new fizztask repository...
    git remote add origin %new_repo%
    echo.
    echo Adding and committing changes...
    git add .
    git commit -m "FizzTask domain migration complete - ready for fizztask.com deployment"
    echo.
    echo Pushing to fizztask repository...
    git push -u origin main
    if errorlevel 1 git push -u origin master
    echo.
    echo SUCCESS! Code moved to fizztask repository.
    
) else if "%choice%"=="3" (
    echo.
    echo =================================================================
    echo Option 3: Adding Additional Remote
    echo =================================================================
    echo.
    set /p fizz_repo="Enter your fizztask repository URL: "
    echo.
    echo Adding fizztask as additional remote...
    git remote add fizztask %fizz_repo%
    echo.
    echo Adding and committing changes...
    git add .
    git commit -m "FizzTask domain migration complete - ready for fizztask.com deployment"
    echo.
    echo Pushing to existing repository...
    git push origin main
    if errorlevel 1 git push origin master
    echo.
    echo Pushing to fizztask repository...
    git push fizztask main
    if errorlevel 1 git push fizztask master
    echo.
    echo SUCCESS! Code pushed to both repositories.
    
) else (
    echo Invalid choice. Please run the script again.
)

echo.
echo =================================================================
echo Current remote configuration:
git remote -v
echo =================================================================
echo.
pause
