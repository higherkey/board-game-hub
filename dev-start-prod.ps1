# Board Game Hub - PROD (Docker) Startup Script
# Runs the application as Docker containers (No Hot Reload)

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

Write-Host "Waiting for database to be fully ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "--- 1.5) Generating and Applying EF Migration Bundle ---" -ForegroundColor Cyan
# This mirrors our GitHub Actions CI/CD deployment step
dotnet ef migrations bundle --project backend/BoardGameHub.Api/BoardGameHub.Api.csproj --startup-project backend/BoardGameHub.Api/BoardGameHub.Api.csproj --self-contained --output efbundle.exe --force
if ($LASTEXITCODE -ne 0) {
    Write-Error "Migration bundle generation failed! Aborting startup."
    Read-Host "Press Enter to exit..."
    exit 1
}

Write-Host "Applying bundled migrations to local database..." -ForegroundColor Yellow
.\efbundle.exe --connection "Host=localhost;Database=BoardGameHub;Username=postgres;Password=password"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Applying migrations failed! Aborting startup."
    Read-Host "Press Enter to exit..."
    exit 1
}

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
