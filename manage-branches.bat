@echo off
echo ================================
echo Git Branch Management Tool
echo ================================

echo.
echo Current branches:
echo ================
git branch -a

echo.
echo Commands:
echo =========
echo 1. Delete local branch:     git branch -d branch-name
echo 2. Force delete local:      git branch -D branch-name  
echo 3. Delete remote branch:    git push origin --delete branch-name
echo 4. List all branches:       git branch -a
echo.

echo Examples:
echo =========
echo git branch -d feature/old-feature
echo git push origin --delete feature/old-feature
echo.

pause
