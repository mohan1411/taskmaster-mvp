@echo off
echo Restarting Development Frontend Server...
echo.

cd D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP-Development\frontend

echo Clearing React cache...
rmdir /s /q node_modules\.cache 2>nul

echo.
echo Starting fresh development server...
npm start

pause
