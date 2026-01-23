
$srcDir = "c:\Programming\board game hub\frontend\src\app"
$backendDir = "c:\Programming\board game hub\backend\BoardGameHub.Api"

Write-Host "# Unused Code Scan Report`n"

# 1. Gather Angular Components
$components = Get-ChildItem -Path $srcDir -Recurse -Filter "*.ts" | 
Select-String -Pattern "selector:\s*'([^']+)'" | 
ForEach-Object { 
    $content = Get-Content $_.Path -Raw
    $classMatch = [regex]::Match($content, "export class (\w+)")
        
    if ($classMatch.Success) {
        [PSCustomObject]@{
            Selector  = $_.Matches.Groups[1].Value
            File      = $_.Path
            ClassName = $classMatch.Groups[1].Value
        }
    }
}

Write-Host "## Potential Unused Angular Components"
foreach ($comp in $components) {
    if (-not $comp.Selector) { continue }

    # Check for selector usage in HTML files
    $usageHtml = Get-ChildItem -Path $srcDir -Recurse -Filter "*.html" | Select-String -Pattern $comp.Selector
    
    # Check for Class Usage in Router (app.routes.ts or other TS files)
    # Exclude the file itself
    $usageTs = Get-ChildItem -Path $srcDir -Recurse -Filter "*.ts" | 
    Where-Object { $_.FullName -ne $comp.File } | 
    Select-String -Pattern $comp.ClassName

    if (($null -eq $usageHtml) -and ($null -eq $usageTs)) {
        Write-Host "- [ ] **$($comp.ClassName)** (selector: `$($comp.Selector)`) seems unused."
        Write-Host "      File: $($comp.File)"
    }
}

Write-Host "`n## Potential Unused Backend Models (Basic Check)"
if (Test-Path "$backendDir\Models") {
    $models = Get-ChildItem -Path "$backendDir\Models" -Recurse -Filter "*.cs"
    foreach ($modelFile in $models) {
        $content = Get-Content $modelFile.FullName
        $classNameMatch = $content | Select-String "class\s+(\w+)"
        if ($classNameMatch) {
            # Handle multiple class definitions or just take the first one
            $className = $classNameMatch.Matches.Groups[1].Value
             
            # Scan all backend files for this class name, excluding its own definition file
            $usage = Get-ChildItem -Path $backendDir -Recurse -Include "*.cs", "*.razor" | 
            Where-Object { $_.FullName -ne $modelFile.FullName } | 
            Select-String -Pattern "\b$className\b"

            if ($null -eq $usage) {
                Write-Host "- [ ] **$className** seems unused."
                Write-Host "      File: $($modelFile.FullName)"
            }
        }
    }
}
else {
    Write-Host "Backend Models directory not found at $backendDir\Models"
}
