# Board Game Hub - DEV (Hot Reload) Startup Script
# Runs the application using dotnet run and npm start (With Hot Reload)

$ProjectRoot = $PSScriptRoot
$BackendDir = "$ProjectRoot\backend"
$FrontendDir = "$ProjectRoot\frontend"

Write-Host "--- 0) Verifying Database Availability ---" -ForegroundColor Cyan
$pgListening = Test-NetConnection -ComputerName "localhost" -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($pgListening) {
    Write-Host "PostgreSQL is already reachable on port 5432 (local/native or container)!" -ForegroundColor Green
} else {
    Write-Host "PostgreSQL port 5432 not responding. Checking Docker..." -ForegroundColor Yellow
    $dockerProcess = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue
    if (-not $dockerProcess) {
        if (Test-Path "C:\Program Files\Docker\Docker\Docker Desktop.exe") {
            Write-Host "Docker Desktop is not running. Launching it now..." -ForegroundColor Yellow
            Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
            Write-Host "Waiting for Docker Engine to initialize..." -ForegroundColor Yellow
        } else {
            Write-Warning "Docker Desktop is not installed and no local PostgreSQL service is listening on port 5432."
            Write-Warning "Ensure PostgreSQL is running locally or connection strings in appsettings are configured."
        }
    }

    # Wait for 'docker info' to succeed if docker command exists
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        $dockerTimeout = 60 # seconds
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

        if ($LASTEXITCODE -eq 0) {
            Write-Host "--- 1) Launching Database Dependencies ---" -ForegroundColor Cyan
            Set-Location "$ProjectRoot"
            docker compose up -d postgres pgadmin
            Write-Host "Waiting for database to be fully ready..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        }
    }
}

Write-Host "Waiting for database to be fully ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "--- 1.5) Applying Database Migrations ---" -ForegroundColor Cyan
& ".\backend\migrate-db.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Migrations failed! Aborting startup."
    Read-Host "Press Enter to exit..."
    exit 1
}

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
