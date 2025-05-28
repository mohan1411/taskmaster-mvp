@echo off
echo ===================================
echo COMPREHENSIVE OPENAI FIX
echo ===================================
echo.
echo This script will:
echo 1. Install the OpenAI package directly
echo 2. Start the backend server with all AI features
echo.

cd backend

echo Ensuring OpenAI package is installed...
call npm install openai@3.3.0 --save

echo.
echo Confirming OpenAI package installation...
node -e "try { require('openai'); console.log('OpenAI package is installed correctly.'); } catch(e) { console.error('Error:', e.message); process.exit(1); }"

if %ERRORLEVEL% NEQ 0 (
  echo Failed to install OpenAI package. Will use mock implementation.
  echo You can still use the application, but AI features will use a backup implementation.
) else (
  echo OpenAI package successfully installed!
)

echo.
echo ===================================
echo Starting server...
echo ===================================
npm start
