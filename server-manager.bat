@echo off
echo TaskMaster - Server Manager
echo --------------------------
echo.

cd /d "%~dp0"

:MENU
cls
echo TaskMaster Server Management:
echo 1. Check server status
echo 2. Start server
echo 3. Stop server
echo 4. Restart server
echo 5. Return to main menu
echo 6. Exit
echo.

set /p option="Enter option (1-6): "

if "%option%"=="1" goto CHECK_STATUS
if "%option%"=="2" goto START_SERVER
if "%option%"=="3" goto STOP_SERVER
if "%option%"=="4" goto RESTART_SERVER
if "%option%"=="5" goto RETURN_MAIN
if "%option%"=="6" goto EXIT
goto MENU

:CHECK_STATUS
echo.
echo Checking for running TaskMaster servers...
echo.

set "found=false"
for /f "tokens=1,5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":8000"') do (
    echo TaskMaster backend server is running on port 8000 (PID: %%b)
    set "found=true"
    set "backend_pid=%%b"
)

for /f "tokens=1,5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":3000"') do (
    echo TaskMaster frontend server is running on port 3000 (PID: %%c)
    set "found=true"
    set "frontend_pid=%%c"
)

if "%found%"=="false" echo No TaskMaster servers appear to be running.

echo.
pause
goto MENU

:START_SERVER
echo.
echo Starting the TaskMaster server...
start cmd /k "start-taskmaster.bat"
echo Server starting in a new window.
echo Wait for the server to start completely before proceeding.
echo.
pause
goto MENU

:STOP_SERVER
echo.
echo Stopping TaskMaster servers...
echo.

set "found=false"
for /f "tokens=1,5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":8000"') do (
    echo Stopping backend server (PID: %%b)...
    taskkill /F /PID %%b
    set "found=true"
)

for /f "tokens=1,5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":3000"') do (
    echo Stopping frontend server (PID: %%c)...
    taskkill /F /PID %%c
    set "found=true"
)

if exist "stop-taskmaster.bat" (
    echo Running stop-taskmaster.bat...
    call stop-taskmaster.bat
    set "found=true"
)

if "%found%"=="false" echo No running TaskMaster servers found to stop.

echo.
pause
goto MENU

:RESTART_SERVER
echo.
echo Restarting TaskMaster servers...
echo.

call :STOP_SERVER
timeout /t 2 /nobreak >nul
call :START_SERVER
goto MENU

:RETURN_MAIN
cd /d "%~dp0"
call taskmaster-helper.bat
exit /b

:EXIT
exit /b 0
