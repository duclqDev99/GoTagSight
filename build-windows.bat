@echo off
echo ========================================
echo GoTagSight - Windows Build Script
echo ========================================

echo.
echo Building GoTagSight for Windows...
echo.

echo Step 1: Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Step 2: Building application...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Creating Windows installer...
echo This may take several minutes...
npm run dist:win
if %errorlevel% neq 0 (
    echo ERROR: Failed to create installer!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Installer created: release\GoTagSight Setup 1.0.0.exe
echo.
echo This installer supports both x64 and ARM64 Windows systems.
echo.
echo To install on Windows:
echo 1. Copy the .exe file to your Windows machine
echo 2. Double-click to run the installer
echo 3. Follow the installation wizard
echo.
pause 