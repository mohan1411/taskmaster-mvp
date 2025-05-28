@echo off
echo TaskMaster Test Data Generator (Fixed)
echo ----------------------------------
echo.
echo This script will generate synthetic emails to test the system
echo with 1000+ emails.
echo.

cd /d "%~dp0"
cd backend

echo Installing required test dependencies...
call npm install @faker-js/faker --save-dev

echo.
echo Finding users in database...

node -e "const mongoose = require('mongoose'); const User = require('./models/userModel'); require('dotenv').config(); mongoose.connect(process.env.MONGODB_URI).then(async () => { console.log('Connected to MongoDB'); const users = await User.find({}); console.log('Users found: ' + users.length); console.log('Copy the FULL ObjectId below:'); users.forEach((user, index) => { console.log((index + 1) + '. ' + user.name + ' (' + user.email + ') - ID: ' + user._id); }); mongoose.connection.close(); }).catch(err => { console.error('Error:', err); });"

echo.
echo Please COPY and PASTE the FULL ObjectId from above (don't just type a number)
set /p user_id="Enter the full user ID: "

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
echo Generating %email_count% synthetic emails for user ID: %user_id%
echo This may take a while for large amounts...
echo.

node fixed-test-data-generator.js "%user_id%" %email_count%

echo.
echo Test data generation complete!
echo.
echo You can now:
echo 1. Log into TaskMaster with the user
echo 2. Check if the smart processing recommendation appears
echo 3. Test different processing approaches
echo.
pause
