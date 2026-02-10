# Board Game Hub - DEV (Hot Reload) Startup Script
# Runs the application using dotnet run and npm start (With Hot Reload)

$ProjectRoot = "C:\Programming\board game hub"
$BackendDir = "$ProjectRoot\backend"
$FrontendDir = "$ProjectRoot\frontend"

Write-Host "--- 0) Verifying Docker Requirement ---" -ForegroundColor Cyan
$dockerProcess = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
if (-not $dockerProcess) {
    Write-Host "Docker Desktop is not running. Launching it now..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Host "Waiting for Docker Engine to initialize..." -ForegroundColor Yellow
}

# Wait for 'docker info' to succeed (Daemon is responsive)
$dockerTimeout = 120 # seconds
$dockerElapsed = 0
while ($dockerElapsed -lt $dockerTimeout) {
    docker info > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker Engine is UP and Ready!" -ForegroundColor Green
        break
    }
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
    $dockerElapsed += 2
}

if ($dockerElapsed -ge $dockerTimeout) {
    Write-Error "Docker failed to initialize within $dockerTimeout seconds. Please check Docker Desktop manually."
    exit 1
}

Write-Host "--- 1) Launching Database Dependencies ---" -ForegroundColor Cyan
Set-Location "$ProjectRoot"
docker compose up -d postgres pgadmin

Write-Host "--- 2) Launching Backend (Hot Reload) ---" -ForegroundColor Cyan
$BackendScript = @"
cd '$BackendDir'
Write-Host 'Starting .NET Backend...' -ForegroundColor Cyan
dotnet watch run --project BoardGameHub.Api
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
