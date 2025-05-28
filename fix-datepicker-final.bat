@echo off
echo Creating a complete fix for the DatePicker issue...

cd frontend

echo Installing the correct version of @mui/x-date-pickers...
call npm install @mui/x-date-pickers@5.0.0-beta.0 --save

echo Clearing the React cache to ensure fresh build...
call npm cache clean --force
rmdir /s /q node_modules\.cache

echo You can now start the app with 'npm start'
echo The DatePicker fix should be applied!
