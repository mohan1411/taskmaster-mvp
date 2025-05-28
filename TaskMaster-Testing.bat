@echo off
setlocal enabledelayedexpansion
title TaskMaster Testing Center
color 0B

:: Set the project root directory
cd /d "%~dp0"
set "PROJECT_ROOT=%cd%"

:MAIN_MENU
cls
echo ===========================================================
echo               TASKMASTER TESTING CENTER                  
echo ===========================================================
echo.
echo  [1] Install Testing Frameworks
echo  [2] Run End-to-End Tests
echo  [3] Run API Tests Only
echo  [4] Run UI Tests Only
echo  [5] Generate Test Reports
echo  [6] Return to TaskMaster Control
echo  [7] Exit
echo.
echo ===========================================================

set /p test_choice="Enter your choice (1-7): "

if "%test_choice%"=="1" goto INSTALL_FRAMEWORKS
if "%test_choice%"=="2" goto RUN_E2E
if "%test_choice%"=="3" goto RUN_API
if "%test_choice%"=="4" goto RUN_UI
if "%test_choice%"=="5" goto GENERATE_REPORTS
if "%test_choice%"=="6" goto RETURN_CONTROL
if "%test_choice%"=="7" goto EXIT
goto MAIN_MENU

:INSTALL_FRAMEWORKS
cls
echo Installing testing frameworks...
echo.
echo Select testing framework to install:
echo  [1] Cypress (Recommended for E2E testing)
echo  [2] Playwright (Alternative E2E framework)
echo  [3] Jest + Supertest (API testing)
echo  [4] Install All Frameworks
echo  [5] Back to main menu
echo.

set /p framework_choice="Enter your choice (1-5): "

if "%framework_choice%"=="1" (
    echo Installing Cypress...
    cd /d "%PROJECT_ROOT%"
    call npm install cypress --save-dev
    echo Creating initial Cypress test structure...
    call npx cypress open
)
if "%framework_choice%"=="2" (
    echo Installing Playwright...
    cd /d "%PROJECT_ROOT%"
    call npm install -D @playwright/test
    call npx playwright install
    echo Creating sample Playwright tests...
    mkdir tests\e2e 2>nul
)
if "%framework_choice%"=="3" (
    echo Installing Jest and Supertest...
    cd /d "%PROJECT_ROOT%"
    call npm install --save-dev jest supertest
    echo Creating sample API tests...
    mkdir tests\api 2>nul
)
if "%framework_choice%"=="4" (
    echo Installing all testing frameworks...
    cd /d "%PROJECT_ROOT%"
    call npm install --save-dev cypress @playwright/test jest supertest
    call npx playwright install
    echo Creating test directories...
    call npx cypress open
    mkdir tests\api 2>nul
    mkdir tests\e2e 2>nul
)
if "%framework_choice%"=="5" goto MAIN_MENU

echo.
echo Installation complete.
pause
goto MAIN_MENU

:RUN_E2E
cls
echo Running end-to-end tests...
echo.
echo Select E2E test framework:
echo  [1] Cypress
echo  [2] Playwright
echo  [3] Back to main menu
echo.

set /p e2e_choice="Enter your choice (1-3): "

if "%e2e_choice%"=="1" (
    cd /d "%PROJECT_ROOT%"
    echo Starting TaskMaster server for testing...
    start cmd /k "cd /d "%PROJECT_ROOT%" && call start-taskmaster.bat"
    timeout /t 10 /nobreak >nul
    echo Running Cypress tests...
    call npx cypress run
)
if "%e2e_choice%"=="2" (
    cd /d "%PROJECT_ROOT%"
    echo Starting TaskMaster server for testing...
    start cmd /k "cd /d "%PROJECT_ROOT%" && call start-taskmaster.bat"
    timeout /t 10 /nobreak >nul
    echo Running Playwright tests...
    call npx playwright test
)
if "%e2e_choice%"=="3" goto MAIN_MENU

echo.
echo Testing complete.
pause
goto MAIN_MENU

:RUN_API
cls
echo Running API tests...
echo.
cd /d "%PROJECT_ROOT%"
echo Starting TaskMaster backend server only...
start cmd /k "cd /d "%PROJECT_ROOT%\backend" && call npm start"
timeout /t 5 /nobreak >nul
echo Running API tests with Jest...
call npm test -- --testPathPattern=tests/api

echo.
echo API testing complete.
pause
goto MAIN_MENU

:RUN_UI
cls
echo Running UI component tests...
echo.
cd /d "%PROJECT_ROOT%"
echo Running React component tests...
cd frontend
call npm test

echo.
echo UI testing complete.
pause
goto MAIN_MENU

:GENERATE_REPORTS
cls
echo Generating test reports...
echo.
echo Select report type:
echo  [1] Cypress reports
echo  [2] Playwright reports
echo  [3] Jest coverage reports
echo  [4] Combined reports
echo  [5] Back to main menu
echo.

set /p report_choice="Enter your choice (1-5): "

if "%report_choice%"=="1" (
    cd /d "%PROJECT_ROOT%"
    echo Generating Cypress reports...
    echo Note: Make sure you have cypress-mochawesome-reporter installed
    call npx cypress run --reporter mochawesome
    start cypress\reports\html\index.html
)
if "%report_choice%"=="2" (
    cd /d "%PROJECT_ROOT%"
    echo Opening Playwright HTML report...
    call npx playwright show-report
)
if "%report_choice%"=="3" (
    cd /d "%PROJECT_ROOT%"
    echo Generating Jest coverage report...
    call npm test -- --coverage
    start coverage\lcov-report\index.html
)
if "%report_choice%"=="4" (
    cd /d "%PROJECT_ROOT%"
    echo Generating all reports...
    echo This functionality requires additional setup.
    echo Please install a combined reporting tool first.
)
if "%report_choice%"=="5" goto MAIN_MENU

echo.
echo Report generation complete.
pause
goto MAIN_MENU

:RETURN_CONTROL
cd /d "%PROJECT_ROOT%"
call TaskMaster-Control-ASCII.bat
exit /b

:EXIT
exit /b 0
