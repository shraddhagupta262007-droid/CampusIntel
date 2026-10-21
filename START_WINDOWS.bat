@echo off
setlocal
cd /d "%~dp0"
echo ==============================================
echo   CampusIntel - Placement Intelligence
echo ==============================================
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install the LTS version from https://nodejs.org/ and reopen this file.
  pause
  exit /b 1
)
if not exist ".env" (
  echo Missing .env file. Copy .env.example to .env and add your Supabase URL and key first.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Installing dependencies. This is needed only on the first run...
  call npm install
  if errorlevel 1 (echo Dependency installation failed.& pause & exit /b 1)
)
call npm run dev
pause
