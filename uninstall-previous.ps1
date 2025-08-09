# GoTagSight Uninstall Script
# Chạy script này trước khi cài đặt phiên bản mới

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    GoTagSight Uninstall Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra quyền admin
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Script cần quyền Administrator để chạy" -ForegroundColor Red
    Write-Host "Vui lòng chạy PowerShell với quyền Administrator" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "[1/4] Kiểm tra phiên bản cũ..." -ForegroundColor Yellow

# Kiểm tra process đang chạy
$process = Get-Process -Name "GoTagSight" -ErrorAction SilentlyContinue
if ($process) {
    Write-Host "⚠️  Phát hiện GoTagSight đang chạy" -ForegroundColor Yellow
    Write-Host "Đang dừng process..." -ForegroundColor Yellow
    Stop-Process -Name "GoTagSight" -Force
    Start-Sleep -Seconds 3
    Write-Host "✓ Đã dừng GoTagSight" -ForegroundColor Green
} else {
    Write-Host "✓ Không có GoTagSight đang chạy" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/4] Gỡ cài đặt từ Control Panel..." -ForegroundColor Yellow

# Tìm và gỡ cài đặt từ registry
$uninstallKey = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\GoTagSight"
if (Test-Path $uninstallKey) {
    $uninstallString = (Get-ItemProperty $uninstallKey).UninstallString
    if ($uninstallString) {
        Write-Host "Đang gỡ cài đặt GoTagSight..." -ForegroundColor Yellow
        try {
            Start-Process -FilePath $uninstallString -ArgumentList "/S" -Wait
            Write-Host "✓ Đã gỡ cài đặt từ Control Panel" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Không thể gỡ cài đặt từ Control Panel" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "✓ Không tìm thấy bản cài đặt trong Control Panel" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3/4] Xóa thư mục cài đặt..." -ForegroundColor Yellow

# Xóa thư mục cài đặt
$installPaths = @(
    "${env:ProgramFiles}\GoTagSight",
    "${env:ProgramFiles(x86)}\GoTagSight",
    "${env:LOCALAPPDATA}\Programs\GoTagSight"
)

foreach ($path in $installPaths) {
    if (Test-Path $path) {
        Write-Host "Đang xóa: $path" -ForegroundColor Yellow
        try {
            Remove-Item -Path $path -Recurse -Force
            Write-Host "✓ Đã xóa: $path" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Không thể xóa: $path" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "[4/4] Xóa dữ liệu ứng dụng..." -ForegroundColor Yellow

# Xóa dữ liệu app
$appDataPath = "${env:APPDATA}\GoTagSight"
if (Test-Path $appDataPath) {
    Write-Host "Đang xóa dữ liệu ứng dụng..." -ForegroundColor Yellow
    try {
        Remove-Item -Path $appDataPath -Recurse -Force
        Write-Host "✓ Đã xóa dữ liệu ứng dụng" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Không thể xóa dữ liệu ứng dụng" -ForegroundColor Yellow
    }
}

# Xóa shortcut
$desktopShortcut = "${env:USERPROFILE}\Desktop\GoTagSight.lnk"
$startMenuShortcut = "${env:APPDATA}\Microsoft\Windows\Start Menu\Programs\GoTagSight"

if (Test-Path $desktopShortcut) {
    Remove-Item $desktopShortcut -Force
    Write-Host "✓ Đã xóa shortcut Desktop" -ForegroundColor Green
}

if (Test-Path $startMenuShortcut) {
    Remove-Item $startMenuShortcut -Recurse -Force
    Write-Host "✓ Đã xóa shortcut Start Menu" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Uninstall hoàn tất!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Đã gỡ cài đặt hoàn toàn GoTagSight" -ForegroundColor Green
Write-Host "🚀 Bây giờ bạn có thể cài đặt phiên bản mới" -ForegroundColor Green
Write-Host ""
pause 