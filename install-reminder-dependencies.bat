@echo off
echo Installing backend dependencies...
cd backend
npm install node-cron nodemailer --save

echo.
echo Installing frontend dependencies...
cd ../frontend
npm install date-fns @mui/x-date-pickers @emotion/react @emotion/styled --save

echo.
echo Dependencies installed successfully!
echo.
echo You can now start the application.
