@echo off
echo Killing any lingering ports...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":" ^| find "8000"') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":" ^| find "5173"') do taskkill /f /pid %%a 2>nul

echo Starting Backend...
start cmd /k "cd backend && uvicorn.exe app.main:app --reload --port 8000 --host 127.0.0.1"

echo Starting Frontend...
start powershell.exe -ExecutionPolicy Bypass -Command "cd frontend; npm.cmd run dev"

echo Servers launched in separate windows!
exit
