
$root = $PSScriptRoot

# 1. Build Frontend
Write-Host "Building Angular Frontend..."
Set-Location "$root\frontend"
cmd /c npm run build

# 2. Copy artifacts to Backend
Write-Host "Deploying to Backend wwwroot..."
$distPath = "$root\frontend\dist\frontend\browser"
$wwwroot = "$root\backend\BoardGameHub.Api\wwwroot"

if (Test-Path $wwwroot) {
    Remove-Item $wwwroot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $wwwroot | Out-Null
Copy-Item "$distPath\*" -Destination $wwwroot -Recurse

# 3. Start Backend
Write-Host "Starting Backend..."
$backendPath = "$root\backend\BoardGameHub.Api"
Start-Process dotnet -ArgumentList "run --project `"$backendPath`" --urls=http://localhost:5109" -NoNewWindow

# 4. Start Tunnel
Write-Host "Starting Cloudflare Tunnel..."
Start-Sleep -Seconds 5
cloudflared tunnel --url http://localhost:5109
