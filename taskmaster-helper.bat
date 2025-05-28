@echo off
echo TaskMaster - Management Helper
echo -----------------------------
echo.
echo This tool helps you manage TaskMaster servers and user accounts.
echo.

:MENU
cls
echo Choose an option:
echo 1. Server Management (Start/Stop/Restart/Status)
echo 2. Create/Reset Admin account
echo 3. List all users
echo 4. Reset a user's password
echo 5. Exit
echo.

set /p option="Enter option (1-5): "

if "%option%"=="1" goto SERVER_MANAGEMENT
if "%option%"=="2" goto CREATE_ADMIN
if "%option%"=="3" goto LIST_USERS
if "%option%"=="4" goto RESET_PASSWORD
if "%option%"=="5" goto EXIT
goto MENU

:SERVER_MANAGEMENT
echo.
cd /d "%~dp0"
call server-manager.bat
goto MENU

:CREATE_ADMIN
echo.
cd /d "%~dp0"
echo Creating admin user using direct database access...
call self-contained-admin.bat
echo.
goto MENU

:LIST_USERS
echo.
cd /d "%~dp0"
echo Listing all users in the database...
call self-contained-list.bat
echo.
goto MENU

:RESET_PASSWORD
echo.
cd /d "%~dp0"
echo Resetting user password...
call self-contained-reset.bat
echo.
goto MENU

:EXIT
echo.
echo Goodbye!
echo.
exit /b 0
