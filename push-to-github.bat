@echo off
echo ========================================
echo MJOS GitHub Structure Fix Push Script
echo ========================================
echo.
echo This script will fix the repository structure by:
echo 1. Force pushing the correct file structure
echo 2. README.md will be in root directory
echo 3. All project files properly organized
echo.

echo Checking Git status...
git status

echo.
echo Force pushing corrected structure to GitHub...
echo Repository: https://github.com/dawoya1/mjos
echo WARNING: This will overwrite the previous incorrect structure
echo.

git push -f origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS: Code pushed to GitHub!
    echo ========================================
    echo.
    echo Repository URL: https://github.com/dawoya1/mjos
    echo.
    echo Next steps:
    echo 1. Visit the repository on GitHub
    echo 2. Verify all files are uploaded correctly
    echo 3. Create a release tag v1.0.0
    echo 4. Update repository description and topics
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Failed to push to GitHub
    echo ========================================
    echo.
    echo Possible solutions:
    echo 1. Check internet connection
    echo 2. Verify GitHub repository exists
    echo 3. Check Git credentials
    echo 4. Try again later
    echo.
    echo Manual push command:
    echo git push -u origin main
    echo.
)

pause
