@echo off
for /f "tokens=5" %%a in ('netstat -aon ^| find ":" ^| find "8000"') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":" ^| find "5173"') do taskkill /f /pid %%a 2>nul
echo Ports cleared.
