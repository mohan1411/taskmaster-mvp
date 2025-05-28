@echo off
echo TaskMaster User Login Diagnostic
echo -----------------------------
echo.
echo This script will diagnose login issues with the test user
echo and provide options to fix them.
echo.

cd /d "%~dp0"
cd backend

echo Running diagnostic...
node diagnose-user-login.js test@example.com password123 diagnose

echo.
echo Would you like to fix the test user password? (Y/N)
set /p fix_choice="> "

if /i "%fix_choice%"=="Y" (
  echo.
  echo Fixing user password...
  node diagnose-user-login.js test@example.com password123 fix
  
  echo.
  echo Password has been fixed. You should now be able to log in with:
  echo Email: test@example.com
  echo Password: password123
) else (
  echo.
  echo No changes made to user password.
)

echo.
echo Would you like to create a new admin user instead? (Y/N)
set /p admin_choice="> "

if /i "%admin_choice%"=="Y" (
  echo.
  echo Creating admin user...
  
  echo.
  set /p admin_email="Enter admin email: "
  set /p admin_password="Enter admin password: "
  
  echo // Create admin user > create-admin-direct.js
  echo const mongoose = require('mongoose'); >> create-admin-direct.js
  echo const User = require('./models/userModel'); >> create-admin-direct.js
  echo const Settings = require('./models/settingsModel'); >> create-admin-direct.js
  echo const bcrypt = require('bcryptjs'); >> create-admin-direct.js
  echo require('dotenv').config(); >> create-admin-direct.js
  echo. >> create-admin-direct.js
  echo async function createAdmin() { >> create-admin-direct.js
  echo   try { >> create-admin-direct.js
  echo     await mongoose.connect(process.env.MONGODB_URI); >> create-admin-direct.js
  echo     console.log('Connected to MongoDB'); >> create-admin-direct.js
  echo. >> create-admin-direct.js
  echo     const adminEmail = '%admin_email%'; >> create-admin-direct.js
  echo     const adminPassword = '%admin_password%'; >> create-admin-direct.js
  echo. >> create-admin-direct.js
  echo     const existingAdmin = await User.findOne({ email: adminEmail }); >> create-admin-direct.js
  echo. >> create-admin-direct.js
  echo     if (existingAdmin) { >> create-admin-direct.js
  echo       console.log(`Admin already exists: ${existingAdmin.email}`); >> create-admin-direct.js
  echo       const salt = await bcrypt.genSalt(10); >> create-admin-direct.js
  echo       const hashedPassword = await bcrypt.hash(adminPassword, salt); >> create-admin-direct.js
  echo       await User.updateOne({ _id: existingAdmin._id }, { $set: { password: hashedPassword, role: 'admin' } }); >> create-admin-direct.js
  echo       console.log('Admin password updated'); >> create-admin-direct.js
  echo       mongoose.connection.close(); >> create-admin-direct.js
  echo       return; >> create-admin-direct.js
  echo     } >> create-admin-direct.js
  echo. >> create-admin-direct.js
  echo     const salt = await bcrypt.genSalt(10); >> create-admin-direct.js
  echo     const hashedPassword = await bcrypt.hash(adminPassword, salt); >> create-admin-direct.js
  echo. >> create-admin-direct.js
  echo     const newAdmin = new User({ >> create-admin-direct.js
  echo       name: 'Administrator', >> create-admin-direct.js
  echo       email: adminEmail, >> create-admin-direct.js
  echo       password: hashedPassword, >> create-admin-direct.js
  echo       role: 'admin', >> create-admin-direct.js
  echo       isEmailVerified: true, >> create-admin-direct.js
  echo     }); >> create-admin-direct.js
  echo. >> create-admin-direct.js
  echo     const savedAdmin = await newAdmin.save(); >> create-admin-direct.js
  echo     console.log(`Admin created: ${savedAdmin.email}`); >> create-admin-direct.js
  echo. >> create-admin-direct.js
  echo     const settings = new Settings({ >> create-admin-direct.js
  echo       user: savedAdmin._id, >> create-admin-direct.js
  echo     }); >> create-admin-direct.js
  echo     await settings.save(); >> create-admin-direct.js
  echo. >> create-admin-direct.js
  echo     console.log('Admin settings created'); >> create-admin-direct.js
  echo     mongoose.connection.close(); >> create-admin-direct.js
  echo. >> create-admin-direct.js
  echo   } catch (error) { >> create-admin-direct.js
  echo     console.error('Error creating admin:', error); >> create-admin-direct.js
  echo   } >> create-admin-direct.js
  echo } >> create-admin-direct.js
  echo. >> create-admin-direct.js
  echo createAdmin(); >> create-admin-direct.js
  
  node create-admin-direct.js
  
  echo.
  echo Admin user created/updated. You can log in with:
  echo Email: %admin_email%
  echo Password: %admin_password%
)

echo.
echo Diagnostic complete!
echo.
pause
