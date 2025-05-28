@echo off
setlocal enabledelayedexpansion
title TaskMaster Control Center
color 0A

:: Set the project root directory
cd /d "%~dp0"
set "PROJECT_ROOT=%cd%"

:MAIN_MENU
cls
echo ╔═══════════════════════════════════════════╗
echo ║           TASKMASTER CONTROL CENTER       ║
echo ╚═══════════════════════════════════════════╝
echo.
echo  [1] Server Management
echo  [2] User Management
echo  [3] Data Management
echo  [4] System Information
echo  [5] Help
echo  [6] Exit
echo.
echo ═══════════════════════════════════════════

set /p main_choice="Enter your choice (1-6): "

if "%main_choice%"=="1" goto SERVER_MENU
if "%main_choice%"=="2" goto USER_MENU
if "%main_choice%"=="3" goto DATA_MENU
if "%main_choice%"=="4" goto SYSTEM_INFO
if "%main_choice%"=="5" goto HELP_MENU
if "%main_choice%"=="6" goto EXIT
goto MAIN_MENU

:SERVER_MENU
cls
echo ╔═══════════════════════════════════════════╗
echo ║            SERVER MANAGEMENT              ║
echo ╚═══════════════════════════════════════════╝
echo.
echo  [1] Check Server Status
echo  [2] Start Server
echo  [3] Stop Server
echo  [4] Restart Server
echo  [5] Start Server (Alternative Ports)
echo  [6] Return to Main Menu
echo.
echo ═══════════════════════════════════════════

set /p server_choice="Enter your choice (1-6): "

if "%server_choice%"=="1" goto CHECK_STATUS
if "%server_choice%"=="2" goto START_SERVER
if "%server_choice%"=="3" goto STOP_SERVER
if "%server_choice%"=="4" goto RESTART_SERVER
if "%server_choice%"=="5" goto START_SERVER_ALT
if "%server_choice%"=="6" goto MAIN_MENU
goto SERVER_MENU

:CHECK_STATUS
cls
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
goto SERVER_MENU

:START_SERVER
cls
echo Starting the TaskMaster server...
echo.
if exist "%PROJECT_ROOT%\start-taskmaster.bat" (
    start cmd /k "cd /d "%PROJECT_ROOT%" && call start-taskmaster.bat"
    echo Server starting in a new window.
) else (
    echo ERROR: start-taskmaster.bat not found!
)
echo.
pause
goto SERVER_MENU

:STOP_SERVER
cls
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

if exist "%PROJECT_ROOT%\stop-taskmaster.bat" (
    echo Running stop-taskmaster.bat...
    call "%PROJECT_ROOT%\stop-taskmaster.bat"
    set "found=true"
) 

if "%found%"=="false" echo No running TaskMaster servers found to stop.

echo.
pause
goto SERVER_MENU

:RESTART_SERVER
cls
echo Restarting TaskMaster servers...
echo.
call :STOP_SERVER
timeout /t 2 /nobreak >nul
call :START_SERVER
goto SERVER_MENU

:START_SERVER_ALT
cls
echo Starting TaskMaster on alternative ports...
echo.
if exist "%PROJECT_ROOT%\start-taskmaster-alt-ports.bat" (
    start cmd /k "cd /d "%PROJECT_ROOT%" && call start-taskmaster-alt-ports.bat"
    echo Server starting in a new window with alternative ports.
) else (
    echo ERROR: start-taskmaster-alt-ports.bat not found!
)
echo.
pause
goto SERVER_MENU

:USER_MENU
cls
echo ╔═══════════════════════════════════════════╗
echo ║             USER MANAGEMENT               ║
echo ╚═══════════════════════════════════════════╝
echo.
echo  [1] List All Users
echo  [2] Create/Reset Admin Account
echo  [3] Add New User
echo  [4] Reset User Password
echo  [5] Return to Main Menu
echo.
echo ═══════════════════════════════════════════

set /p user_choice="Enter your choice (1-5): "

if "%user_choice%"=="1" goto LIST_USERS
if "%user_choice%"=="2" goto CREATE_ADMIN
if "%user_choice%"=="3" goto ADD_USER
if "%user_choice%"=="4" goto RESET_PASSWORD
if "%user_choice%"=="5" goto MAIN_MENU
goto USER_MENU

:LIST_USERS
cls
echo Listing all users in the database...
echo.
cd /d "%PROJECT_ROOT%"
call self-contained-list.bat
echo.
goto USER_MENU

:CREATE_ADMIN
cls
echo Creating/Resetting admin account...
echo.
cd /d "%PROJECT_ROOT%"
call self-contained-admin.bat
echo.
goto USER_MENU

:ADD_USER
cls
echo Adding a new user to the database...
echo.

set /p name=Enter user's name: 
set /p email=Enter user's email: 
set /p password=Enter user's password: 
set /p role=Enter user's role (user/admin) [default: user]: 

if "%role%"=="" set "role=user"

mkdir temp-tools 2>nul
cd temp-tools

echo Creating package.json...
echo {^
  "name": "taskmaster-add-user",^
  "version": "1.0.0",^
  "dependencies": {^
    "mongoose": "^6.9.0",^
    "bcryptjs": "^2.4.3",^
    "dotenv": "^16.0.3"^
  }^
} > package.json

echo Installing packages (this may take a moment)...
call npm install >nul 2>&1

echo const mongoose = require('mongoose');^
const bcrypt = require('bcryptjs');^
const fs = require('fs');^
^
// Read .env file content^
const envPath = '../backend/.env';^
const envContent = fs.readFileSync(envPath, 'utf8');^
^
// Parse .env content manually^
const envVars = {};^
envContent.split('\n').forEach(line => {^
  if (line.trim() && !line.startsWith('#')) {^
    const [key, ...valueParts] = line.split('=');^
    if (key && valueParts.length > 0) {^
      envVars[key.trim()] = valueParts.join('=').trim();^
    }^
  }^
});^
^
const uri = envVars.MONGODB_URI || 'mongodb://localhost:27017/taskmaster';^
^
// Connect to MongoDB^
mongoose.connect(uri, {^
  useNewUrlParser: true,^
  useUnifiedTopology: true,^
})^
.then(async () => {^
  console.log('MongoDB connected');^
  ^
  // Define User schema^
  const userSchema = new mongoose.Schema({^
    name: String,^
    email: String,^
    password: String,^
    role: String,^
    isEmailVerified: Boolean,^
    refreshToken: String,^
    createdAt: Date,^
    updatedAt: Date^
  });^
  ^
  // Define Settings schema^
  const settingsSchema = new mongoose.Schema({^
    user: {^
      type: mongoose.Schema.Types.ObjectId,^
      ref: 'User'^
    },^
    theme: {^
      type: String,^
      default: 'light'^
    },^
    language: {^
      type: String,^
      default: 'en'^
    },^
    emailNotifications: {^
      type: Boolean,^
      default: true^
    },^
    pushNotifications: {^
      type: Boolean,^
      default: true^
    }^
  });^
  ^
  // Create models^
  const User = mongoose.model('User', userSchema);^
  const Settings = mongoose.model('Settings', settingsSchema);^
  ^
  try {^
    // Check if user already exists^
    const userExists = await User.findOne({ email: '%email%' });^
    ^
    if (userExists) {^
      console.error('User with this email already exists!');^
      process.exit(1);^
    }^
    ^
    // Create new user^
    const hashedPassword = await bcrypt.hash('%password%', 10);^
    const newUser = new User({^
      name: '%name%',^
      email: '%email%',^
      password: hashedPassword,^
      role: '%role%',^
      isEmailVerified: true,^
      createdAt: new Date(),^
      updatedAt: new Date()^
    });^
    ^
    await newUser.save();^
    ^
    // Create settings for user^
    await new Settings({^
      user: newUser._id^
    }).save();^
    ^
    console.log('User created successfully:');^
    console.log('Name: %name%');^
    console.log('Email: %email%');^
    console.log('Role: %role%');^
    ^
    process.exit(0);^
  } catch (error) {^
    console.error('Error creating user:', error);^
    process.exit(1);^
  }^
})^
.catch(err => {^
  console.error('MongoDB connection error:', err);^
  process.exit(1);^
}); > add-user.js

node add-user.js
cd..
rmdir /s /q temp-tools >nul 2>&1
echo.
pause
goto USER_MENU

:RESET_PASSWORD
cls
echo Resetting user password...
echo.
cd /d "%PROJECT_ROOT%"
call self-contained-reset.bat
echo.
goto USER_MENU

:DATA_MENU
cls
echo ╔═══════════════════════════════════════════╗
echo ║             DATA MANAGEMENT               ║
echo ╚═══════════════════════════════════════════╝
echo.
echo  [1] Reset Email Data
echo  [2] Reset Tasks and Follow-ups
echo  [3] Reset Email Flags
echo  [4] Analyze Duplicate Follow-ups
echo  [5] Fix Duplicate Follow-ups
echo  [6] Complete System Reset
echo  [7] Return to Main Menu
echo.
echo ═══════════════════════════════════════════

set /p data_choice="Enter your choice (1-7): "

if "%data_choice%"=="1" goto RESET_EMAIL_DATA
if "%data_choice%"=="2" goto RESET_TASKS_FOLLOWUPS
if "%data_choice%"=="3" goto RESET_EMAIL_FLAGS
if "%data_choice%"=="4" goto ANALYZE_DUPLICATES
if "%data_choice%"=="5" goto FIX_DUPLICATES
if "%data_choice%"=="6" goto COMPLETE_RESET
if "%data_choice%"=="7" goto MAIN_MENU
goto DATA_MENU

:RESET_EMAIL_DATA
cls
echo Resetting email data...
echo.
if exist "%PROJECT_ROOT%\backend\reset-email-data.bat" (
    cd /d "%PROJECT_ROOT%\backend"
    call reset-email-data.bat
) else (
    echo ERROR: reset-email-data.bat not found!
)
echo.
pause
goto DATA_MENU

:RESET_TASKS_FOLLOWUPS
cls
echo Resetting tasks and follow-ups...
echo.
if exist "%PROJECT_ROOT%\backend\reset-tasks-followups.bat" (
    cd /d "%PROJECT_ROOT%\backend"
    call reset-tasks-followups.bat
) else (
    echo ERROR: reset-tasks-followups.bat not found!
)
echo.
pause
goto DATA_MENU

:RESET_EMAIL_FLAGS
cls
echo Resetting email flags...
echo.
if exist "%PROJECT_ROOT%\backend\reset-email-flags.bat" (
    cd /d "%PROJECT_ROOT%\backend"
    call reset-email-flags.bat
) else (
    echo ERROR: reset-email-flags.bat not found!
)
echo.
pause
goto DATA_MENU

:ANALYZE_DUPLICATES
cls
echo Analyzing duplicate follow-ups...
echo.
if exist "%PROJECT_ROOT%\backend\analyze-followup-duplicates.bat" (
    cd /d "%PROJECT_ROOT%\backend"
    call analyze-followup-duplicates.bat
) else (
    echo ERROR: analyze-followup-duplicates.bat not found!
)
echo.
pause
goto DATA_MENU

:FIX_DUPLICATES
cls
echo Fixing duplicate follow-ups...
echo.
if exist "%PROJECT_ROOT%\backend\fix-followup-duplicates.bat" (
    cd /d "%PROJECT_ROOT%\backend"
    call fix-followup-duplicates.bat
) else (
    echo ERROR: fix-followup-duplicates.bat not found!
)
echo.
pause
goto DATA_MENU

:COMPLETE_RESET
cls
echo WARNING: This will perform a complete system reset!
echo All data will be erased and returned to default state.
echo.
set /p confirm="Are you sure you want to continue? (y/n): "

if /i "%confirm%"=="y" (
    echo.
    echo Performing complete system reset...
    echo.
    if exist "%PROJECT_ROOT%\backend\complete-reset.bat" (
        cd /d "%PROJECT_ROOT%\backend"
        call complete-reset.bat
    ) else (
        echo ERROR: complete-reset.bat not found!
    )
) else (
    echo Reset cancelled.
)
echo.
pause
goto DATA_MENU

:SYSTEM_INFO
cls
echo ╔═══════════════════════════════════════════╗
echo ║             SYSTEM INFORMATION            ║
echo ╚═══════════════════════════════════════════╝
echo.
echo TaskMaster Project Location:
echo %PROJECT_ROOT%
echo.
echo Backend Configuration:

if exist "%PROJECT_ROOT%\backend\config\config.js" (
    type "%PROJECT_ROOT%\backend\config\config.js" | findstr /C:"mongoUri" /C:"port" /C:"env" /C:"appUrl"
) else (
    echo Config file not found.
)
echo.
echo Database Connection:
if exist "%PROJECT_ROOT%\backend\.env" (
    type "%PROJECT_ROOT%\backend\.env" | findstr /C:"MONGODB_URI" | findstr /v /C:"//mohan"
    type "%PROJECT_ROOT%\backend\.env" | findstr /C:"PORT"
) else (
    echo .env file not found.
)
echo.
echo Server Status:
for /f "tokens=1,5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":8000"') do (
    echo Backend server: RUNNING (Port 8000, PID: %%b)
    goto :frontend_check
)
echo Backend server: NOT RUNNING

:frontend_check
for /f "tokens=1,5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":3000"') do (
    echo Frontend server: RUNNING (Port 3000, PID: %%c)
    goto :status_done
)
echo Frontend server: NOT RUNNING

:status_done
echo.
pause
goto MAIN_MENU

:HELP_MENU
cls
echo ╔═══════════════════════════════════════════╗
echo ║                  HELP                     ║
echo ╚═══════════════════════════════════════════╝
echo.
echo TaskMaster Control Center provides a centralized
echo interface for managing your TaskMaster application.
echo.
echo Available options:
echo.
echo 1. SERVER MANAGEMENT
echo   - Start, stop, and restart the TaskMaster server
echo   - Check server status
echo   - Use alternative ports if needed
echo.
echo 2. USER MANAGEMENT
echo   - List all users in the database
echo   - Create or reset admin accounts
echo   - Add new users
echo   - Reset user passwords
echo.
echo 3. DATA MANAGEMENT
echo   - Reset email data
echo   - Reset tasks and follow-ups
echo   - Fix duplicate data issues
echo   - Perform complete system reset
echo.
echo 4. SYSTEM INFORMATION
echo   - View project location and configuration
echo   - Check server status
echo.
echo For more information, please refer to the TaskMaster
echo documentation or contact Mohan.
echo.
pause
goto MAIN_MENU

:EXIT
cls
echo Thank you for using TaskMaster Control Center
echo Goodbye!
timeout /t 2 >nul
exit /b 0
