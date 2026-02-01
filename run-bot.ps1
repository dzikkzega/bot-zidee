# Script untuk menjalankan bot dengan PM2
Write-Host "Starting ZideeBot with PM2..." -ForegroundColor Green
Set-Location $PSScriptRoot

Write-Host "Checking if PM2 is installed..." -ForegroundColor Yellow
try {
    $pm2Check = npm list -g pm2 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Installing PM2 globally..." -ForegroundColor Yellow
        npm install -g pm2
    }
} catch {
    Write-Host "Installing PM2 globally..." -ForegroundColor Yellow
    npm install -g pm2
}

Write-Host "Starting bot with PM2..." -ForegroundColor Green
npm run pm2:start

Write-Host ""
Write-Host "Bot started! Use the following commands to manage:" -ForegroundColor Cyan
Write-Host "  npm run pm2:status   - Check bot status" -ForegroundColor White
Write-Host "  npm run pm2:logs     - View bot logs" -ForegroundColor White
Write-Host "  npm run pm2:restart  - Restart bot" -ForegroundColor White
Write-Host "  npm run pm2:stop     - Stop bot" -ForegroundColor White
Write-Host ""
Write-Host "Opening PM2 monitoring in 2 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
npm run pm2:monit

Read-Host "Press Enter to exit"
