@echo off
echo Starting ZideeBot with PM2...
cd /d "%~dp0"

echo Checking if PM2 is installed...
npm list -g pm2 >nul 2>&1
if errorlevel 1 (
    echo Installing PM2 globally...
    npm install -g pm2
)

echo Starting bot with PM2...
npm run pm2:start

echo Bot started! Use the following commands to manage:
echo   npm run pm2:status   - Check bot status
echo   npm run pm2:logs     - View bot logs
echo   npm run pm2:restart  - Restart bot
echo   npm run pm2:stop     - Stop bot
echo.
echo Opening PM2 monitoring...
timeout /t 2 /nobreak >nul
npm run pm2:monit

pause
