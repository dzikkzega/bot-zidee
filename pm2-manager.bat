@echo off
title ZideeBot PM2 Manager

:menu
cls
echo =======================================
echo        ZideeBot PM2 Manager
echo =======================================
echo.
echo 1. Start Bot
echo 2. Stop Bot
echo 3. Restart Bot
echo 4. View Status
echo 5. View Logs (Live)
echo 6. View Logs (File)
echo 7. Monitor Dashboard
echo 8. Delete Bot Process
echo 9. Exit
echo.
set /p choice="Choose an option (1-9): "

if "%choice%"=="1" goto start_bot
if "%choice%"=="2" goto stop_bot
if "%choice%"=="3" goto restart_bot
if "%choice%"=="4" goto status_bot
if "%choice%"=="5" goto logs_live
if "%choice%"=="6" goto logs_file
if "%choice%"=="7" goto monitor
if "%choice%"=="8" goto delete_bot
if "%choice%"=="9" goto exit

echo Invalid choice. Please try again.
pause
goto menu

:start_bot
echo Starting ZideeBot...
npm run pm2:start
pause
goto menu

:stop_bot
echo Stopping ZideeBot...
npm run pm2:stop
pause
goto menu

:restart_bot
echo Restarting ZideeBot...
npm run pm2:restart
pause
goto menu

:status_bot
echo ZideeBot Status:
npm run pm2:status
pause
goto menu

:logs_live
echo Live Logs (Press Ctrl+C to exit):
npm run pm2:logs
pause
goto menu

:logs_file
echo Opening log files...
if exist "logs\combined.log" (
    notepad logs\combined.log
) else (
    echo No log file found yet.
)
pause
goto menu

:monitor
echo Opening PM2 Monitor Dashboard...
npm run pm2:monit
pause
goto menu

:delete_bot
echo Deleting ZideeBot process...
npm run pm2:delete
pause
goto menu

:exit
echo Goodbye!
exit