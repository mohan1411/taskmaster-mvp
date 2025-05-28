
@echo off
echo Installing backend dependencies...

cd D:\Projects\AI\BusinessIdeas\SmallBusiness\TaskMaster\MVP\backend

echo Installing express, cors, helmet, and morgan...
call npm install express cors helmet morgan --save

echo Installing nodemailer and node-cron...
call npm install nodemailer node-cron --save

echo Installing other dependencies...
call npm install jsonwebtoken mongoose dotenv

echo.
echo Dependencies installation complete.
echo.
echo You can now try running the server with:
echo npm run dev
