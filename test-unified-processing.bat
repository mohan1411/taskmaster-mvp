@echo off
cd /d "%~dp0"
cd backend
echo Running unified email processing test...
node test-unified-processing.js
pause
