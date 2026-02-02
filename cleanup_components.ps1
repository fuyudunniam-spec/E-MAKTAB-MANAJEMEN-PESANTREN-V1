Remove-Item -Path "src\components\santri" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "src\components\TabunganSantri" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Cleanup completed: Removed legacy component folders."