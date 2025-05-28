@echo off
echo ================================
echo Testing Task Delete Functionality
echo ================================

echo.
echo Starting TaskMaster application for testing...
echo.

echo Starting backend server...
start /B "TaskMaster Backend" npm run server

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting frontend...
start /B "TaskMaster Frontend" cd frontend && npm start

echo Waiting for frontend to start...
timeout /t 10 /nobreak > nul

echo.
echo Opening browser for testing...
start http://localhost:3000

echo.
echo Test Instructions:
echo 1. Login to the application
echo 2. Navigate to Tasks page
echo 3. Try to delete a task using the three-dot menu
echo 4. Verify:
echo    - Only one delete dialog appears
echo    - The correct task title is shown (not "undefined")
echo    - Task deletion works without errors
echo    - Success notification appears
echo.
echo Check the browser console and terminal for debug logs.
echo Look for:
echo - "DELETE TASK: Request for task..." in backend logs
echo - "Deleting task:" in frontend console
echo - "Delete result:" in frontend console
echo.

pause
