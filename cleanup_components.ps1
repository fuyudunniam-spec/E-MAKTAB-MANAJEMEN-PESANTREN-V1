# 1. Update Imports
Write-Host "Updating imports..."
$replacements = @{
    "@/components/CitationButtons" = "@/components/ui/CitationButtons"
    "@/components/CollectivePaymentTool" = "@/components/akademik/CollectivePaymentTool"
    "@/components/DonorBadge" = "@/components/koperasi/DonorBadge"
    "@/components/DoubleEntryAlert" = "@/components/koperasi/DoubleEntryAlert"
    "@/components/ErrorBoundary" = "@/components/ui/ErrorBoundary"
    "@/components/ExportPDFDialogV3" = "@/components/ui/ExportPDFDialogV3"
    "@/components/ImageZoomModal" = "@/components/ui/ImageZoomModal"
    "@/components/Layout" = "@/components/layout/AppLayout"
    "@/components/MassBillingGenerator" = "@/components/akademik/MassBillingGenerator"
    "@/components/MasterTarifSPP" = "@/components/akademik/MasterTarifSPP"
    "@/components/ModuleHeader" = "@/components/layout/ModuleHeader"
    "@/components/NavLink" = "@/components/layout/NavLink"
    "@/components/PDFViewer" = "@/components/ui/PDFViewer"
    "@/components/ProfileLayout" = "@/components/layout/ProfileLayout"
    "@/components/ProfileRedirect" = "@/components/layout/ProfileRedirect"
    "@/components/ProtectedRoute" = "@/components/layout/ProtectedRoute"
    "@/components/RelatedProducts" = "@/components/koperasi/RelatedProducts"
    "@/components/RoleGuard" = "@/components/layout/RoleGuard"
    "@/components/SettingsPanel" = "@/components/layout/SettingsPanel"
    "@/components/ShareButtons" = "@/components/ui/ShareButtons"
    "@/components/TemplateTagihanManager" = "@/components/akademik/TemplateTagihanManager"
    "@/components/TransactionDetailModal" = "@/components/koperasi/TransactionDetailModal"
    "@/components/TransactionEditModal" = "@/components/koperasi/TransactionEditModal"
    
    "@/components/dashboard/AccountsSection" = "@/components/dashboard/keuangan/AccountsSection"
    "@/components/dashboard/ChartsSection" = "@/components/dashboard/keuangan/ChartsSection"
    "@/components/dashboard/DetailedReports" = "@/components/dashboard/keuangan/DetailedReports"
    "@/components/dashboard/RecentActivities" = "@/components/dashboard/keuangan/RecentActivities"
    "@/components/dashboard/RiwayatTransaksi" = "@/components/dashboard/keuangan/RiwayatTransaksi"
    "@/components/dashboard/StackedAccountCards" = "@/components/dashboard/keuangan/StackedAccountCards"
    "@/components/dashboard/SummaryCards" = "@/components/dashboard/keuangan/SummaryCards"
    "@/components/dashboard/TotalBalanceDisplay" = "@/components/dashboard/keuangan/TotalBalanceDisplay"
}

$files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    foreach ($key in $replacements.Keys) {
        if ($content.Contains($key)) {
            $content = $content.Replace($key, $replacements[$key])
        }
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Updated imports in: $($file.Name)"
    }
}

# 2. Remove Duplicates
Write-Host "Removing duplicates..."
$duplicates = @(
    "CitationButtons.tsx",
    "CollectivePaymentTool.tsx",
    "DonorBadge.tsx",
    "DoubleEntryAlert.tsx",
    "ErrorBoundary.tsx",
    "ExportPDFDialogV3.tsx",
    "ImageZoomModal.tsx",
    "Layout.tsx",
    "MassBillingGenerator.tsx",
    "MasterTarifSPP.tsx",
    "ModuleHeader.tsx",
    "NavLink.tsx",
    "PDFViewer.tsx",
    "ProfileLayout.tsx",
    "ProfileRedirect.tsx",
    "ProtectedRoute.tsx",
    "RelatedProducts.tsx",
    "RoleGuard.tsx",
    "SettingsPanel.tsx",
    "ShareButtons.tsx",
    "TemplateTagihanManager.tsx",
    "TransactionDetailModal.tsx",
    "TransactionEditModal.tsx"
)

foreach ($file in $duplicates) {
    $path = "src\components\$file"
    if (Test-Path $path) {
        Remove-Item -Path $path -Force
        Write-Host "Removed duplicate: $file"
    }
}

# 3. Move Dashboard Files
Write-Host "Moving dashboard files..."
$dashboardPath = "src\components\dashboard"
$dashboardKeuanganPath = "$dashboardPath\keuangan"

if (-not (Test-Path $dashboardKeuanganPath)) {
    New-Item -ItemType Directory -Path $dashboardKeuanganPath -Force
    Write-Host "Created directory: $dashboardKeuanganPath"
}

$dashboardFinanceFiles = @(
    "AccountsSection.tsx",
    "ChartsSection.tsx",
    "DetailedReports.tsx",
    "RecentActivities.tsx",
    "RiwayatTransaksi.tsx",
    "StackedAccountCards.tsx",
    "SummaryCards.tsx",
    "TotalBalanceDisplay.tsx"
)

foreach ($file in $dashboardFinanceFiles) {
    $sourcePath = "$dashboardPath\$file"
    $destPath = "$dashboardKeuanganPath\$file"
    
    if (Test-Path $sourcePath) {
        Move-Item -Path $sourcePath -Destination $destPath -Force
        Write-Host "Moved $file to dashboard/keuangan"
    }
}

Write-Host "Cleanup completed."