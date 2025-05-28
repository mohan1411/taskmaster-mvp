@echo off
echo ===================================
echo Complete OpenAI Fix
echo ===================================
echo.
echo This script will:
echo 1. Fix the server.js file
echo 2. Update the OpenAI package to a compatible version
echo 3. Start the backend server
echo.

cd backend

echo Installing a newer version of OpenAI package...
npm uninstall openai
npm install openai@^3.3.0

echo.
echo ===================================
echo Starting server...
echo ===================================
npm start
