$rootComponents = Get-ChildItem -Path "src/components" -File
$componentDirs = Get-ChildItem -Path "src/components" -Directory
$moduleDirs = Get-ChildItem -Path "src/modules" -Directory

# Function to check duplicates in a list of directories
function Check-Duplicates ($file, $dirs, $basePathName) {
    foreach ($dir in $dirs) {
        # Recurse into subdirectories for modules
        if ($basePathName -eq "src/modules") {
            $potentialMatches = Get-ChildItem -Path $dir.FullName -Recurse -Filter $file.Name -File
            foreach ($match in $potentialMatches) {
                 Compare-Files $file $match
            }
        } else {
            $potentialMatchPath = Join-Path $dir.FullName $file.Name
            if (Test-Path $potentialMatchPath) {
                $match = Get-Item $potentialMatchPath
                Compare-Files $file $match
            }
        }
    }
}

function Compare-Files ($file1, $file2) {
    $content1 = Get-Content $file1.FullName -Raw
    $content2 = Get-Content $file2.FullName -Raw
    
    if ($content1 -and $content2) {
        $content1 = $content1 -replace "`r`n", "`n"
        $content2 = $content2 -replace "`r`n", "`n"
        
        if ($content1.Trim() -eq $content2.Trim()) {
            Write-Host "DUPLICATE: $($file1.Name) found in $($file2.FullName)"
        } else {
             # Write-Host "DIFF: $($file1.Name) found in $($file2.FullName) but content differs"
        }
    }
}

foreach ($file in $rootComponents) {
    Check-Duplicates $file $componentDirs "src/components"
    # Check-Duplicates $file $moduleDirs "src/modules" # modules might have same name but different context, so be careful
}