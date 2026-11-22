@echo off
set "PATH=C:\nodejs\node-v20.11.1-win-x64;%PATH%"
echo =======================================================
echo Running Lead Flow API & Integration Test Suite...
echo =======================================================
node test-flow.js
pause
