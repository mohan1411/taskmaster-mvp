@echo off
echo ===================================
echo OpenAI Configuration Fix Script
echo ===================================
echo.
echo This script will fix the deprecated OpenAI Configuration usage
echo pattern throughout the backend codebase.
echo.
cd backend
node fix-openai-configuration.js
echo.
echo ===================================
echo Fixed OpenAI Configuration issues!
echo ===================================
echo.
echo Now starting the backend server...
npm start
