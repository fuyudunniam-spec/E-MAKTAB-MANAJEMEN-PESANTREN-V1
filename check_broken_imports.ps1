$files = Get-ChildItem -Path "src" -Recurse -Include *.tsx, *.ts, *.jsx, *.js

Write-Host "Checking for broken imports..."

foreach ($file in $files) {
    $content = Get-Content $file.FullName
    $fileName = $file.FullName.Substring($PWD.Path.Length + 1)
    
    # Check for imports to deleted/moved root components
    if ($content -match "from ['`"].*components/Layout['`"]") {
        Write-Host "BROKEN (Old Layout): $fileName"
    }
    if ($content -match "from ['`"].*components/ErrorBoundary['`"]") {
        Write-Host "BROKEN (Old ErrorBoundary): $fileName"
    }
    if ($content -match "from ['`"].*components/ProfileLayout['`"]") {
        Write-Host "BROKEN (Old ProfileLayout): $fileName"
    }
    
    # Check for bad relative imports in dashboard/keuangan
    if ($fileName -like "src\components\dashboard\keuangan\*") {
        if ($content -match "from ['`"]\.\./\.\./services") {
            Write-Host "BROKEN (Relative Service): $fileName"
        }
        if ($content -match "from ['`"]\.\./\.\./utils") {
            Write-Host "BROKEN (Relative Utils): $fileName"
        }
    }
}

Write-Host "Check complete."