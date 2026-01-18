
$targetDirs = @(
    "c:\Programming\board game hub\frontend\src",
    "c:\Programming\board game hub\backend\BoardGameHub.Api"
)

$extensions = @(".ts", ".html", ".scss", ".cs")

function Test-Comment {
    param($line, $ext)
    if ([string]::IsNullOrWhiteSpace($line)) { return $false }
    $l = $line.Trim()
    
    if ($ext -in @(".ts", ".js", ".cs", ".scss", ".css")) {
        return ($l.StartsWith("//") -or $l.StartsWith("/*") -or $l.StartsWith("*"))
    }
    if ($ext -eq ".html") {
        return $l.StartsWith("<!--")
    }
    return $false
}

Write-Host "# Code Readability Report`n"

$foundIssues = $false

foreach ($root in $targetDirs) {
    if (-not (Test-Path $root)) { continue }
    
    $files = Get-ChildItem -Path $root -Recurse -Include *.* | Where-Object { 
        $ext = $_.Extension.ToLower()
        $extensions -contains $ext
    }

    foreach ($file in $files) {
        # Force array to avoid char iteration on single-line files
        $lines = @(Get-Content $file.FullName)
        if ($lines.Count -eq 0) { continue }

        $consecutiveEmpty = 0
        $prevLine = $null
        $issues = @()
        
        # Read all text for multiline regex checks
        $content = [System.IO.File]::ReadAllText($file.FullName)
        
        # Check for empty CSS/SCSS blocks
        if ($file.Extension -in @(".scss", ".css")) {
            if ($content -match "(\w+[\w\-\s]*)\{\s*\}") {
                $issues += "Empty Style Block detected"
            }
        }

        # Check for double semicolons
        if ($file.Extension -in @(".ts", ".cs", ".js")) {
            if ($content -match ";;") {
                $issues += "Double semicolon ';;' detected"
            }
        }

        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            if ($line -is [string]) {
                $stripped = $line.Trim()
            }
            else {
                continue 
            }

            if ([string]::IsNullOrWhiteSpace($stripped)) {
                $consecutiveEmpty++
            }
            else {
                if ($consecutiveEmpty -ge 3) {
                    $issues += "Line $($i + 1 - $consecutiveEmpty): Excessive blank lines ($consecutiveEmpty)"
                }
                $consecutiveEmpty = 0

                if ($null -ne $prevLine -and $stripped -eq $prevLine -and (Test-Comment -line $stripped -ext $file.Extension.ToLower())) {
                    $issues += "Line $($i + 1): Duplicated comment '$($stripped.Substring(0, [Math]::Min(30, $stripped.Length)))...'"
                }
                
                # Double check per-line visual oddities
                if ($stripped.Contains(";;") -and ($file.Extension -in @(".ts", ".cs"))) {
                    $issues += "Line $($i + 1): Double semicolon ';;'"
                }
                if ($stripped -match "console\.log" -and ($file.Extension -in @(".ts"))) {
                    $issues += "Line $($i + 1): Leftover console.log"
                }

                $prevLine = $stripped
            }
        }

        if ($issues.Count -gt 0) {
            $foundIssues = $true
            Write-Host "## $($file.FullName)"
            foreach ($issue in $issues) {
                Write-Host "- $issue"
            }
            Write-Host ""
        }
    }
}

if (-not $foundIssues) {
    Write-Host "No issues found."
}
