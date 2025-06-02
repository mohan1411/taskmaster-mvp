@echo off
echo TaskMaster Development Environment Verification
echo ===============================================

echo Checking directory structure...
if exist "backend" (
    echo ✓ Backend directory exists
) else (
    echo ✗ Backend directory missing
)

if exist "frontend" (
    echo ✓ Frontend directory exists
) else (
    echo ✗ Frontend directory missing
)

echo.
echo Checking environment files...
if exist "backend\.env" (
    echo ✓ Backend .env file exists
) else (
    echo ✗ Backend .env file missing
)

if exist "frontend\.env" (
    echo ✓ Frontend .env file exists
) else (
    echo ✗ Frontend .env file missing
)

if exist "frontend\.env.local" (
    echo ✓ Frontend .env.local file exists
) else (
    echo ✗ Frontend .env.local file missing
)

echo.
echo Checking package files...
if exist "backend\package.json" (
    echo ✓ Backend package.json exists
) else (
    echo ✗ Backend package.json missing
)

if exist "frontend\package.json" (
    echo ✓ Frontend package.json exists
) else (
    echo ✗ Frontend package.json missing
)

echo.
echo Environment Configuration Summary:
echo - Backend Port: 5000
echo - Frontend Port: 3000 (with proxy to backend:5000)
echo - Database: MongoDB Atlas (production database)
echo - Domain: Development environment for fizztask.com
echo.
echo Next steps:
echo 1. Run setup-dev.bat to install dependencies
echo 2. Run start-dev.bat to start both servers
echo.
pause