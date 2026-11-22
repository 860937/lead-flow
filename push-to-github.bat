@echo off
set "PATH=%LOCALAPPDATA%\MinGit\cmd;C:\nodejs\node-v20.11.1-win-x64;%PATH%"
echo =======================================================
echo Push Lead Flow to GitHub
echo =======================================================
echo.
set /p REPO_URL="Enter your GitHub repository URL (e.g. https://github.com/yourname/lead-flow.git): "
if "%REPO_URL%"=="" (
    echo No URL provided. Aborting.
    pause
    exit /b 1
)

git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
echo.
echo Pushing to GitHub main branch...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =======================================================
    echo Successfully pushed to GitHub!
    echo =======================================================
) else (
    echo.
    echo [Notice] Push failed. Make sure:
    echo 1. The GitHub repository exists and is empty.
    echo 2. You are logged into GitHub or entered your Personal Access Token.
)

pause
