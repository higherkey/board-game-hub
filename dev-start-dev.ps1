# Board Game Hub - DEV (Hot Reload) Startup Script
# Runs the application using dotnet run and npm start (With Hot Reload)

$ProjectRoot = "C:\Programming\board game hub"
$BackendDir = "$ProjectRoot\backend"
$FrontendDir = "$ProjectRoot\frontend"

Write-Host "--- 1) Launching Database Dependencies ---" -ForegroundColor Cyan
Set-Location "$ProjectRoot"
docker compose up -d postgres pgadmin

Write-Host "--- 2) Launching Backend (Hot Reload) ---" -ForegroundColor Cyan
$BackendScript = @"
cd '$BackendDir'
Write-Host 'Starting .NET Backend...' -ForegroundColor Cyan
dotnet run --project BoardGameHub.Api
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$BackendScript"

Write-Host "Waiting for Backend to warn up..." -ForegroundColor Yellow
# Short wait just to stagger them, not blocking strictly
Start-Sleep -Seconds 2

Write-Host "--- 3) Launching Frontend (Hot Reload) ---" -ForegroundColor Cyan
$FrontendScript = @"
cd '$FrontendDir'
Write-Host 'Starting Angular Development Server...' -ForegroundColor Cyan
npm start
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$FrontendScript"

Write-Host "`nDEV Environment Launching! Check the new windows for logs." -ForegroundColor Green
