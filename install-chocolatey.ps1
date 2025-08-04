# GoTagSight - Chocolatey Installation Script
# Run this script as Administrator

Write-Host "========================================" -ForegroundColor Green
Write-Host "Installing Chocolatey Package Manager" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host ""
Write-Host "This script will install Chocolatey package manager for Windows." -ForegroundColor Yellow
Write-Host "Chocolatey will help install Node.js, MySQL, and other tools automatically." -ForegroundColor Yellow
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Running as Administrator ✓" -ForegroundColor Green

# Check if Chocolatey is already installed
if (Get-Command choco -ErrorAction SilentlyContinue) {
    Write-Host "Chocolatey is already installed!" -ForegroundColor Green
    choco --version
    Read-Host "Press Enter to exit"
    exit 0
}

Write-Host "Installing Chocolatey..." -ForegroundColor Yellow

# Set execution policy
Set-ExecutionPolicy Bypass -Scope Process -Force

# Install Chocolatey
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Verify installation
if (Get-Command choco -ErrorAction SilentlyContinue) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Chocolatey installed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run: setup-windows.bat" -ForegroundColor Yellow
    Write-Host "Or install tools manually:" -ForegroundColor Yellow
    Write-Host "  choco install nodejs -y" -ForegroundColor Cyan
    Write-Host "  choco install mysql -y" -ForegroundColor Cyan
    Write-Host "  choco install git -y" -ForegroundColor Cyan
    Write-Host "  choco install imagemagick -y" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to install Chocolatey!" -ForegroundColor Red
    Write-Host "Please try running this script again as Administrator." -ForegroundColor Red
}

Read-Host "Press Enter to exit" 