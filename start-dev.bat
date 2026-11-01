@echo off
REM ==========================================
REM  LifeDrop Platform Launcher for Windows
REM ==========================================
echo Starting LifeDrop Platform on Windows...

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH. Please install Node.js (v18, v20, or v22) from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo [1/4] Checking backend dependencies and generating Prisma client...
cd backend
if not exist "node_modules\" (
    echo Installing backend packages...
    call npm install
)
call npx prisma generate

echo.
echo [2/4] Launching backend server in a new window (port 5001)...
start "LifeDrop Backend API (Port 5001)" cmd /k "cd /d %~dp0backend && npm run dev"

cd %~dp0

echo.
echo [3/4] Checking frontend dependencies...
if not exist "node_modules\" (
    echo Installing frontend packages...
    call npm install
)

echo.
echo [4/4] Starting frontend dev server (port 3000)...
call npm run dev

