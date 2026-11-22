@echo off
setlocal
set "PATH=%LOCALAPPDATA%\MinGit\cmd;C:\Users\Suganthmuthu\AppData\Local\Microsoft\WinGet\Packages\GitHub.cli_Microsoft.Winget.Source_8wekyb3d8bbwe\bin;C:\nodejs\node-v20.11.1-win-x64;%PATH%"

echo =======================================================
echo        Push Lead Flow to GitHub (860937/lead-flow)
echo =======================================================
echo.

git remote remove origin 2>nul
git remote add origin https://github.com/860937/lead-flow.git
git branch -M main

echo Checking GitHub login status...
gh auth status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Please log in to your GitHub account (860937):
    echo (A browser window will open to authenticate)
    gh auth login -w -p https
)

echo.
echo Configuring Git credentials...
gh auth setup-git

echo.
echo Pushing project to https://github.com/860937/lead-flow.git ...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =======================================================
    echo  SUCCESS! Your code is now live on GitHub:
    echo  https://github.com/860937/lead-flow
    echo =======================================================
) else (
    echo.
    echo [Notice] Push encountered an issue. Please verify your permissions.
)

pause
