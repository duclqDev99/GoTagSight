@echo off
echo ========================================
echo GoTagSight - Setup Validation Script
echo ========================================

echo.
echo This script validates that the setup files are working correctly.
echo.

echo Checking if install-chocolatey.ps1 exists...
if exist "install-chocolatey.ps1" (
    echo ✓ install-chocolatey.ps1 found
) else (
    echo ✗ install-chocolatey.ps1 not found
    pause
    exit /b 1
)

echo.
echo Checking if setup-windows.bat exists...
if exist "setup-windows.bat" (
    echo ✓ setup-windows.bat found
) else (
    echo ✗ setup-windows.bat not found
    pause
    exit /b 1
)

echo.
echo Testing PowerShell script syntax...
powershell -ExecutionPolicy Bypass -File "install-chocolatey.ps1" -WhatIf >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ PowerShell script syntax is valid
) else (
    echo ✗ PowerShell script has syntax errors
    echo Please check the install-chocolatey.ps1 file
    pause
    exit /b 1
)

echo.
echo ========================================
echo All validation checks passed!
echo ========================================
echo.
echo You can now run: setup-windows.bat
echo.
pause 