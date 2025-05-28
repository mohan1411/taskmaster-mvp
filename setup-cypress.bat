@echo off
echo Setting up TaskMaster E2E Testing Environment
echo.

cd /d "%~dp0"

echo Checking if Cypress is installed...
npx cypress -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Cypress...
    npm install cypress --save-dev
    if %errorlevel% neq 0 (
        echo Error installing Cypress. Please check your npm installation.
        goto :error
    )
) else (
    echo Cypress is already installed.
)

echo.
echo Creating necessary folders...
mkdir cypress\e2e 2>nul
mkdir cypress\support 2>nul
mkdir cypress\fixtures 2>nul

echo.
echo Setup complete!
echo.
echo You can now run the tests using:
echo  - run-tests-headless.bat (Automated tests)
echo  - open-test-runner.bat (Interactive test runner)
echo.
echo Would you like to open the Cypress Test Runner now? (Y/N)
set /p open_now="> "
if /i "%open_now%"=="Y" (
    echo.
    echo Opening Cypress Test Runner...
    npx cypress open
)

goto :end

:error
echo.
echo Error during setup. Please check the messages above.
pause
exit /b 1

:end
echo.
echo Setup completed successfully.
pause
exit /b 0
