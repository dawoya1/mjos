@echo off
echo ========================================
echo MJOS GitHub Push Script
echo ========================================
echo.

echo Checking Git status...
git status

echo.
echo Pushing to GitHub repository...
echo Repository: https://github.com/dawoya1/mjos
echo.

git push -u origin main

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
