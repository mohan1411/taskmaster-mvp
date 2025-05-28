@echo off
echo TaskMaster - Advanced Followup Duplication Analyzer
echo ==================================================
echo.
echo This tool will:
echo 1. Analyze your database for duplicate follow-ups
echo 2. Provide detailed information about when and how duplicates were created
echo 3. Log all findings to a file for further investigation
echo.
echo Running analysis...
echo.

cd %~dp0
node analyze-followup-duplicates.js

echo.
echo Analysis complete! Results have been saved to 'followup-debug.log'
echo.
pause
