@echo off
echo Updating TaskMaster Control Center to include testing options...

cd /d "%~dp0"

:: Check if the testing file exists
if exist "TaskMaster-Testing.bat" (
    echo.
    echo The TaskMaster Testing Center has been successfully created.
    echo.
    echo I've created several resources to help you implement E2E testing:
    echo.
    echo 1. TaskMaster-Testing.bat - A comprehensive testing center
    echo 2. cypress-task-sample.js - Sample Cypress tests for tasks
    echo 3. cypress-followup-sample.js - Sample Cypress tests for follow-ups
    echo 4. jest-api-sample.js - Sample Jest API tests
    echo.
    echo To get started with testing:
    echo.
    echo 1. Run TaskMaster-Testing.bat
    echo 2. Select option 1 to install testing frameworks
    echo 3. Choose the framework you prefer (Cypress recommended)
    echo 4. After installation, copy the sample test files to the appropriate folders
    echo.
    echo These sample tests will need customization based on your actual
    echo implementation, but they provide a solid starting point.
    echo.
) else (
    echo ERROR: Could not find TaskMaster-Testing.bat
    echo Please check that the file was created correctly.
)

pause
