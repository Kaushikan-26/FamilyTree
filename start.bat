@echo off
REM ---------------------------------------------------------------
REM  Family Tree Manager - one-click launcher (Windows)
REM  Opens the backend and frontend in two separate, persistent
REM  windows. Keep BOTH windows open while using the app.
REM ---------------------------------------------------------------

echo Starting Family Tree Manager...
echo.

REM Backend (Express + MongoDB) on http://localhost:5000
start "Family Tree - BACKEND (keep open)" cmd /k "cd /d %~dp0server && npm run dev"

REM Give the backend a moment to boot before the frontend
timeout /t 3 /nobreak >nul

REM Frontend (Vite) on http://localhost:5173
start "Family Tree - FRONTEND (keep open)" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Two windows opened:
echo   1) BACKEND  - wait for "Server running on http://localhost:5000"
echo   2) FRONTEND - then open http://localhost:5173 in your browser
echo.
echo Keep both windows open. Close them to stop the app.
pause
