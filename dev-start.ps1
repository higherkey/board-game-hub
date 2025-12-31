# Board Game Hub - Development Startup Script

$ProjectRoot = "C:\Programming\board game hub"
$BackendDir = "$ProjectRoot\backend"
$FrontendDir = "$ProjectRoot\frontend"
$BackendUrl = "http://localhost:5109/api/games" # Using games endpoint as health check

Write-Host "--- 1) Launching Docker Dependencies ---" -ForegroundColor Cyan
Set-Location "$ProjectRoot"
docker compose up -d postgres pgadmin

Write-Host "--- 2) Opening Antigravity ---" -ForegroundColor Cyan
Start-Process "C:\Users\iceic\AppData\Local\Programs\Antigravity\Antigravity.exe"

Write-Host "--- 3) Opening Chrome ---" -ForegroundColor Cyan
Start-Process "chrome.exe"

Write-Host "--- 4) Opening File Explorer ---" -ForegroundColor Cyan
Invoke-Item "$ProjectRoot"

Write-Host "--- 5) Lauching Backend ---" -ForegroundColor Cyan
$BackendScript = @"
cd '$BackendDir'
dotnet run --project BoardGameHub.Api
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$BackendScript"

Write-Host "Waiting for Backend to be healthy..." -ForegroundColor Yellow
$timeout = 60 # seconds
$elapsed = 0
while ($elapsed -lt $timeout) {
    try {
        $response = Invoke-WebRequest -Uri $BackendUrl -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "Backend is UP!" -ForegroundColor Green
            break
        }
    }
    catch {
        # Still waiting
    }
    Start-Sleep -Seconds 2
    $elapsed += 2
    Write-Host "." -NoNewline
}

if ($elapsed -ge $timeout) {
    Write-Warning "Backend health check timed out. Proceeding with frontend anyway..."
}

Write-Host "--- 6) Launching Frontend ---" -ForegroundColor Cyan
$FrontendScript = @"
cd '$FrontendDir'
npm start
"@
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$FrontendScript"

Write-Host "`nAll services triggered! Happy coding!" -ForegroundColor Green
