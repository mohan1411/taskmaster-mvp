@echo off
echo ===================================
echo OpenAI Fix and Server Start
echo ===================================
echo.
echo This script will start the TaskMaster backend server
echo with the fixed OpenAI integration.
echo.

cd backend
echo Installing dependencies...
npm install

echo.
echo ===================================
echo Starting server...
echo ===================================
npm start
