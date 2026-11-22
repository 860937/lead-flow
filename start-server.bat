@echo off
set "PATH=C:\nodejs\node-v20.11.1-win-x64;%PATH%"
echo =======================================================
echo Starting Lead Flow Agency Server...
echo Open http://localhost:3000 in your browser
echo Admin panel: http://localhost:3000/admin
echo =======================================================
node server/server.js
pause
