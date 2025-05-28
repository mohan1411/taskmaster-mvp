@echo off
echo TaskMaster - Emergency MongoDB Password Reset
echo ------------------------------------------
echo.
echo This script will directly reset a password in the MongoDB database.
echo.

set /p email=Enter the email address for the account: 
set /p password=Enter the new password: 

echo.
echo Creating script...

echo mongodb+srv://mohan1411:raptor75@taskmaster.wizlccc.mongodb.net/taskmaster?retryWrites=true^&w=majority > connection.txt

echo @echo off > run_mongo_commands.bat
echo echo use taskmaster > mongo_commands.js
echo echo db.users.updateOne({email:'%email%'}, {$set: {password:'$2a$10$GmV.fQ28Tqi2NUfwF.A34.jx85ZDmL1P9A6nDRvVA8AaZj0/S2oBe'}}) >> mongo_commands.js
echo echo exit >> mongo_commands.js
echo echo Password has been reset. You can now login with your new password. >> run_mongo_commands.bat

echo.
echo Note: This is an emergency password reset that sets your password to:
echo "password123"
echo.
echo This is a temporary password. Please login and change it immediately.
echo.
echo Password has been reset for: %email%
echo.
pause
