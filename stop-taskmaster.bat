@echo off
echo ===================================
echo Stopping TaskMaster Processes
echo ===================================
echo.

echo Looking for processes using port 8000 (backend)...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') DO (
  echo Found process with PID: %%P
  echo Stopping process...
  taskkill /F /PID %%P
  echo Process stopped.
)

echo.
echo Looking for processes using port 3000 (frontend)...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') DO (
  echo Found process with PID: %%P
  echo Stopping process...
  taskkill /F /PID %%P
  echo Process stopped.
)

echo.
echo ===================================
echo All TaskMaster processes stopped.
echo ===================================
echo.
echo Now you can run start-taskmaster.bat to start the servers again.
echo.
pause
