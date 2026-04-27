# Manual Database Migration Script
# Run this from the repository root or the backend folder

Write-Host "Starting Database Migration..." -ForegroundColor Cyan

# Check for dotnet-ef tool
if (!(Get-Command dotnet-ef -ErrorAction SilentlyContinue)) {
    Write-Host "Error: 'dotnet-ef' tool not found. Please install it using:" -ForegroundColor Red
    Write-Host "dotnet tool install --global dotnet-ef" -ForegroundColor Yellow
    exit 1
}

# Apply migrations
dotnet ef database update --project backend/BoardGameHub.Api

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database Migration Successful!" -ForegroundColor Green
} else {
    Write-Host "Database Migration Failed." -ForegroundColor Red
}
