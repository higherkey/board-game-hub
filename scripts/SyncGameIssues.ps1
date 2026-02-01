param (
    [string]$DbContextPath = "backend/BoardGameHub.Api/Data/AppDbContext.cs"
)

# Ensure github cli is available
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "GitHub CLI (gh) is not installed or not in PATH."
    exit 1
}

if (-not (Test-Path $DbContextPath)) {
    Write-Error "DbContext file not found at $DbContextPath"
    exit 1
}

Write-Host "Reading Game Definitions from $DbContextPath..."
$Content = Get-Content -Path $DbContextPath -Raw

# Regex to capture Name and Status. 
# Uses Singleline mode ((?s)) so '.' matches newlines.
# We look for: Name = "Some Name" ... Status = GameStatus.SomeStatus
# This relies on the convention that Name appears before Status in the object initializer.
$Regex = '(?s)Name\s*=\s*"(?<name>[^"]+)".*?Status\s*=\s*GameStatus\.(?<status>\w+)'
$Matches = [Regex]::Matches($Content, $Regex)

Write-Host "Found $($Matches.Count) game definitions."

# Fetch existing issues to avoid duplicates
Write-Host "Fetching existing GitHub issues..."
$ExistingIssuesJson = gh issue list --limit 1000 --json title --state all
$ExistingIssues = $ExistingIssuesJson | ConvertFrom-Json
$ExistingTitles = $ExistingIssues.title

foreach ($Match in $Matches) {
    $Name = $Match.Groups["name"].Value
    $Status = $Match.Groups["status"].Value
    
    # Map Status to Issue Prefix
    $Prefix = switch ($Status) {
        "InDevelopment" { "Complete" }
        "Backlog"       { "Work on" }
        "Testing"       { "Finish" }
        Default         { "Work on" }
    }

    $ExpectedTitle = "$Prefix $Name"
    
    if ($ExistingTitles -contains $ExpectedTitle) {
        Write-Host "Skipping '$Name' ($Status) - Issue '$ExpectedTitle' already exists."
        continue
    }

    Write-Host "Creating issue for '$Name' ($Status)..."
    
    $Body = @"
**Status:** $Status

**Context**
This game was detected in `AppDbContext.cs` with status **$Status**.

**Requirements**
- [ ] Design/Verify game mechanics.
- [ ] Implement/Update core game logic (Backend).
- [ ] Implement/Update game components (Frontend).
"@

    # Create the issue
    gh issue create --title "$ExpectedTitle" --body "$Body" --label "automation"
}

Write-Host "Sync Complete."
