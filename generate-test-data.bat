@echo off
echo TaskMaster Test Data Generator
echo ---------------------------
echo.
echo This script will generate synthetic emails to test the system with 1000+ emails.
echo This lets you test how the system handles large volumes without waiting for
echo real email processing.
echo.

cd /d "%~dp0"
cd backend

echo Installing required test dependencies...
call npm install @faker-js/faker --save-dev

echo.
echo Finding users in database...

node -e "const mongoose = require('mongoose'); const User = require('./models/userModel'); require('dotenv').config(); mongoose.connect(process.env.MONGODB_URI).then(async () => { console.log('Connected to MongoDB'); const users = await User.find({}); console.log('Users found: ' + users.length); users.forEach((user, index) => { console.log((index + 1) + '. ' + user.name + ' (' + user.email + ') - ' + user._id); }); mongoose.connection.close(); }).catch(err => { console.error('Error:', err); });"

echo.
set /p user_id="Enter user ID from the list above: "

echo.
echo How many synthetic emails would you like to generate?
echo 1. Small test (500 emails)
echo 2. Medium test (1500 emails)
echo 3. Large test (5000 emails)
echo 4. Custom amount
echo.
set /p size_choice="Enter your choice (1-4): "

set email_count=1500
if "%size_choice%"=="1" set email_count=500
if "%size_choice%"=="2" set email_count=1500
if "%size_choice%"=="3" set email_count=5000
if "%size_choice%"=="4" (
  set /p email_count="Enter custom email count: "
)

echo.
echo Generating %email_count% synthetic emails...
echo This may take a while for large amounts...
echo.

node test-data-generator.js %user_id% %email_count%

echo.
echo Test data generation complete!
echo.
echo You can now:
echo 1. Log into the TaskMaster application
echo 2. Check if the smart processing recommendation appears
echo 3. Test different processing approaches
echo.
echo Note: To reset the test data, you can run:
echo   - reset-database.bat (to clear all tasks and follow-ups)
echo   - Or delete specific emails with MongoDB commands
echo.
pause
