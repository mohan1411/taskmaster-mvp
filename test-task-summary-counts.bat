@echo off
echo ================================
echo Testing Task Summary Count Fix
echo ================================

echo.
echo Starting TaskMaster for task count testing...
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
echo =================
echo 1. Login to the application
echo 2. Navigate to Tasks page
echo 3. Note the Task Summary counts (Total Tasks, Active Tasks, etc.)
echo 4. Delete a task using the three-dot menu
echo 5. Verify:
echo    - Task is deleted successfully
echo    - Total Tasks count decreases by 1 immediately (without page refresh)
echo    - Active Tasks count updates if applicable
echo    - All other counts update correctly
echo 6. Create a new task
echo 7. Verify:
echo    - Total Tasks count increases by 1 immediately
echo    - Active Tasks count increases by 1
echo 8. Change task status (e.g., mark as completed)
echo 9. Verify:
echo    - Active Tasks count decreases
echo    - Completed count increases
echo    - Total Tasks remains the same
echo.
echo Debug Information:
echo ==================
echo Check browser console for logs:
echo - "TASK SERVICE: Filters received:" - shows frontend filters
echo - "GET TASKS: Query params:" - shows backend request
echo - "GET TASKS: Final query:" - shows database query
echo - "Fetched tasks: X Total: Y" - shows result counts
echo.
echo Check backend terminal for logs:
echo - "GET TASKS: Found X tasks, total: Y" - shows backend response
echo - "DELETE TASK: Successfully deleted task" - confirms deletion
echo.

pause
