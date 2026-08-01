@echo off
cd /d "%~dp0"
start "Sandip Office Server" /min cmd /c "node --experimental-sqlite server.mjs"
timeout /t 2 /nobreak >nul
start "Sandip Beldare Office System" "http://localhost:4173"
