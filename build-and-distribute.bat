@echo off
echo ========================================
echo    GoTagSight Build & Distribute
echo ========================================
echo.

echo [1/6] Cleaning previous builds...
if exist "dist" rmdir /s /q "dist"
if exist "release" rmdir /s /q "release"
echo ✓ Cleaned previous builds

echo.
echo [2/6] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed

echo.
echo [3/6] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)
echo ✓ Application built successfully

echo.
echo [4/6] Creating Windows installer...
call npm run dist:win
if %errorlevel% neq 0 (
    echo ❌ Installer creation failed
    pause
    exit /b 1
)
echo ✓ Windows installer created

echo.
echo [5/6] Preparing distribution files...
if not exist "dist-files" mkdir "dist-files"
copy "release\GoTagSight-Setup-1.0.0.exe" "dist-files\"
copy "uninstall-previous.ps1" "dist-files\"
copy "WINDOWS_INSTALLATION_GUIDE.md" "dist-files\"
echo ✓ Distribution files prepared

echo.
echo [6/6] Build completed successfully!
echo.
echo 📁 Files ready for distribution:
echo    - dist-files\GoTagSight-Setup-1.0.0.exe
echo    - dist-files\uninstall-previous.ps1
echo    - dist-files\WINDOWS_INSTALLATION_GUIDE.md
echo.
echo 💡 Installation features:
echo    - Auto-detect and stop old version
echo    - Clean uninstall of previous version
echo    - Desktop and Start Menu shortcuts
echo    - Configurable installation directory
echo    - Complete uninstall with data cleanup
echo.
echo 🚀 Ready to distribute!
echo.
echo 📋 Next steps:
echo    1. Copy dist-files folder to Windows machine
echo    2. Run GoTagSight-Setup-1.0.0.exe as Administrator
echo    3. Follow installation wizard
echo.
pause 