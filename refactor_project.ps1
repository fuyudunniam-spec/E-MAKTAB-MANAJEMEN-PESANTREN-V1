# Script to refactor imports and clean up duplicates
# Run this from the project root using: ./refactor_project.ps1

$scriptPath = $PSScriptRoot
$srcPath = Join-Path $scriptPath "src"

Write-Host "🚀 Starting Project Refactoring..." -ForegroundColor Cyan
Write-Host "📂 Working directory: $srcPath" -ForegroundColor Gray

if (-not (Test-Path $srcPath)) {
    Write-Error "Directory 'src' not found in $scriptPath. Please run this script from the project root."
    exit
}

# 1. Convert Relative Imports to Aliases (@/)
Write-Host "`n📦 Scanning for relative imports to convert..." -ForegroundColor Yellow
$rootFolders = @("components", "modules", "services", "utils", "hooks", "types", "contexts", "lib", "assets")
$files = Get-ChildItem -Path $srcPath -Include *.ts, *.tsx -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $modified = $false

    foreach ($folder in $rootFolders) {
        # Pattern 1: from "../../components/..." -> from "@/components/..."
        # Matches quotes, one or more ../, then the folder name followed by slash
        if ($content -match "from\s+['`\""](\.\./)+$folder/") {
            $content = $content -replace "from\s+['`""](\.\./)+$folder/", "from `'@/$folder/"
            $content = $content -replace "from\s+['`""](\.\./)+$folder/", "from ""@/$folder/"
            $modified = $true
        }
        
        # Pattern 2: import ... from "../components/X" (no trailing slash, direct file import)
        if ($content -match "from\s+['`\""](\.\./)+$folder['`\""]") {
             # This is harder to regex replace cleanly without lookaheads/behinds which PS regex supports but can be tricky
             # Simplified approach: Replace specific patterns
             $content = $content -replace "from '(\.\./)+$folder", "from '@/$folder"
             $content = $content -replace "from ""(\.\./)+$folder", "from ""@/$folder"
             $modified = $true
        }
    }

    if ($modified -and $content -ne $originalContent) {
        Write-Host "  Fixed imports in: $($file.Name)" -ForegroundColor Gray
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
    }
}

# 2. Cleanup ProfileLayout
Write-Host "`n🗑️  Cleaning up ProfileLayout..." -ForegroundColor Yellow
$duplicateProfile = Join-Path $srcPath "components\ProfileLayout.tsx"
if (Test-Path $duplicateProfile) {
    Remove-Item $duplicateProfile -Force
    Write-Host "  Deleted duplicate: src/components/ProfileLayout.tsx" -ForegroundColor Green
} else {
    Write-Host "  Duplicate ProfileLayout.tsx not found (already clean)." -ForegroundColor Gray
}

# 3. Inventaris Cleanup (Modern vs Old)
Write-Host "`n🛠️  Cleaning up Inventaris components..." -ForegroundColor Yellow
$inventarisPath = Join-Path $srcPath "components\inventaris"
$pairs = @(
    @{ Old = "InventoryTable.tsx"; Modern = "ModernInventoryTable.tsx" }
    @{ Old = "AlertsPanel.tsx"; Modern = "ModernAlertsPanel.tsx" }
    @{ Old = "TransactionTable.tsx"; Modern = "ModernTransactionTable.tsx" }
)

foreach ($pair in $pairs) {
    $oldFile = Join-Path $inventarisPath $pair.Old
    
    if (Test-Path $oldFile) {
        # Check if actually used before deleting (Safety Check)
        $fileNameNoExt = [System.IO.Path]::GetFileNameWithoutExtension($pair.Old)
        # Search for "from './InventoryTable'" or "from '@/components/inventaris/InventoryTable'"
        $pattern = "InventoryTable|AlertsPanel|TransactionTable" 
        # Note: This is a loose check. For safety, we rely on the user having run the import fix first.
        
        Write-Host "  Checking usage of $($pair.Old)..." -NoNewline
        $usages = Get-ChildItem -Path $srcPath -Include *.tsx, *.ts -Recurse | Select-String -Pattern "from .*$fileNameNoExt" -SimpleMatch
        
        if ($usages) {
            Write-Host " FOUND USAGE!" -ForegroundColor Red
            $usages | ForEach-Object { Write-Host "     - $($_.Filename)" -ForegroundColor Gray }
            Write-Host "     Skipping deletion. Please update these files to use $($pair.Modern) first."
        } else {
            Remove-Item $oldFile -Force
            Write-Host " DELETED (Safe)" -ForegroundColor Green
        }
    }
}

Write-Host "`n✨ Refactoring Complete!" -ForegroundColor Cyan
exit