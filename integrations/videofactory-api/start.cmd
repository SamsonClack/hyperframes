@echo off
setlocal
cd /d "%~dp0..\.."

where bun >nul 2>nul
if errorlevel 1 (
  echo Bun 1.4.4 or newer is required. Install Bun, then run: bun install
  pause
  exit /b 1
)

bun run integrations\videofactory-api\start.ts
if errorlevel 1 pause
