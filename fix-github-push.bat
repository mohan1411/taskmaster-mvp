@echo off
echo ================================
echo GitHub Push Fix Helper
echo ================================

echo.
echo This will help resolve the "fetch first" error
echo.

echo Step 1: Pulling remote changes...
git pull origin main --allow-unrelated-histories

echo.
echo Step 2: Checking status...
git status

echo.
echo If you see merge conflicts:
echo 1. Open the conflicted files in your editor
echo 2. Remove the conflict markers ^<^<^<^<^<^<^<, =======, ^>^>^>^>^>^>^>
echo 3. Keep the content you want
echo 4. Run: git add .
echo 5. Run: git commit -m "Resolve merge conflicts"
echo.

echo Step 3: Pushing to GitHub...
git push -u origin main

echo.
echo Done! Your repository should now be synced with GitHub.
echo.

pause
