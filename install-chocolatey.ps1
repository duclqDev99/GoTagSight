# Chocolatey Installation Script for GoTagSight
# This script installs Chocolatey package manager

Write-Host "Installing Chocolatey package manager..." -ForegroundColor Green

# Set execution policy and install Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

if ($LASTEXITCODE -eq 0) {
    Write-Host "Chocolatey installed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Failed to install Chocolatey. You may need to run PowerShell as Administrator." -ForegroundColor Red
    exit 1
}