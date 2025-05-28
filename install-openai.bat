@echo off
echo Updating TaskMaster with Unified Email Processing

cd /d "%~dp0"
cd backend

echo Installing any missing dependencies...
npm install openai@^4.0.0 --save

echo Task and follow-up integration complete!
pause
