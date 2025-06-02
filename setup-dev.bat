@echo off
echo Setting up TaskMaster Development Environment...

echo Installing backend dependencies...
cd backend
npm install
cd ..

echo Installing frontend dependencies...
cd frontend
npm install
cd ..

echo Development environment setup complete!
echo.
echo To start the development servers:
echo 1. Backend: cd backend && npm start
echo 2. Frontend: cd frontend && npm start
echo.
echo Or use the start-dev.bat script for both servers simultaneously.
pause