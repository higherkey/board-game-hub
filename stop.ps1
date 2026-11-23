# Board Game Hub - Teardown Script
# Gracefully stops running Docker dependencies and local background processes

$ProjectRoot = $PSScriptRoot

Write-Host "--- 1) Stopping Docker Dependencies ---" -ForegroundColor Cyan
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Set-Location "$ProjectRoot"
    docker compose down
    Write-Host "Docker containers stopped." -ForegroundColor Green
} else {
    Write-Host "Docker is not installed or running. Skipping container teardown." -ForegroundColor Yellow
}

Write-Host "`nTeardown complete!" -ForegroundColor Green
