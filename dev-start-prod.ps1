# Board Game Hub - PROD (Docker) Startup Script
# Runs the application as Docker containers (No Hot Reload)

$ProjectRoot = "C:\Programming\board game hub"
$BackendDir = "$ProjectRoot\backend"
$FrontendDir = "$ProjectRoot\frontend"

Write-Host "--- 1) Launching Database Dependencies ---" -ForegroundColor Cyan
Set-Location "$ProjectRoot"
docker compose up -d postgres pgadmin

Write-Host "--- 2) Launching Backend Container Build & Run ---" -ForegroundColor Cyan
$BackendScript = @"
cd '$BackendDir'
Write-Host 'Building Backend Docker Image...' -ForegroundColor Cyan
docker build -t bgh-backend .
if (`$LASTEXITCODE -eq 0) {
    Write-Host 'Starting Backend Container...' -ForegroundColor Green
    docker rm -f boardgamehub-backend-debug 2> `$null
    # Note: Using boardgamehub_default (sanitized name)
    docker run --name boardgamehub-backend-debug --network boardgamehub_default -p 5109:8080 -e "ConnectionStrings__DefaultConnection=Host=boardgamehub-postgres;Database=BoardGameHub;Username=postgres;Password=password" -e "Jwt__Key=YourSuperSecretKeyGoesHereForLocalDev" bgh-backend
} else {
    Write-Error 'Backend Build Failed!'
    Read-Host 'Press Enter to exit...'
}
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$BackendScript"

Write-Host "--- 3) Launching Frontend Container Build & Run ---" -ForegroundColor Cyan
$FrontendScript = @"
cd '$FrontendDir'
Write-Host 'Building Frontend Docker Image...' -ForegroundColor Cyan
docker build -t bgh-frontend .
if (`$LASTEXITCODE -eq 0) {
    Write-Host 'Starting Frontend Container...' -ForegroundColor Green
    docker rm -f boardgamehub-frontend-debug 2> `$null
    docker run --name boardgamehub-frontend-debug -p 4200:8080 bgh-frontend
} else {
    Write-Error 'Frontend Build Failed!'
    Read-Host 'Press Enter to exit...'
}
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$FrontendScript"

Write-Host "`nPROD Environment Launching in separate windows..." -ForegroundColor Green
