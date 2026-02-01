@echo off
title ZideeBot PM2 Setup

echo =======================================
echo       ZideeBot PM2 Setup
echo =======================================
echo.

echo Installing project dependencies...
npm install

echo.
echo Installing PM2 globally...
npm install -g pm2

echo.
echo Setting up PM2 startup (optional for Windows service)...
echo Note: This requires administrator privileges
pm2 startup

echo.
echo Setup completed!
echo.
echo You can now use:
echo   run-bot.bat           - Start bot with PM2
echo   pm2-manager.bat       - PM2 management interface
echo.
echo Or use npm scripts:
echo   npm run pm2:start     - Start bot
echo   npm run pm2:stop      - Stop bot
echo   npm run pm2:restart   - Restart bot
echo   npm run pm2:logs      - View logs
echo   npm run pm2:status    - Check status
echo.

pause