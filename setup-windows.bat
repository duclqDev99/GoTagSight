@echo off
echo ========================================
echo GoTagSight - Windows Setup Script
echo ========================================

echo.
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo Then run this script again.
    pause
    exit /b 1
)

echo Node.js is installed.
echo.

echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)

echo npm is installed.
echo.

echo Checking Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Git is not installed!
    echo Git is recommended for version control.
    echo You can install Git from https://git-scm.com/
    echo.
    set /p continue="Do you want to continue without Git? (y/n): "
    if /i not "%continue%"=="y" (
        pause
        exit /b 1
    )
) else (
    echo Git is installed.
)

echo.

echo Checking MySQL installation...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: MySQL is not installed or not in PATH!
    echo Please install MySQL Server from https://dev.mysql.com/downloads/mysql/
    echo Make sure to add MySQL to your system PATH.
    echo.
    set /p continue="Do you want to continue without MySQL? (y/n): "
    if /i not "%continue%"=="y" (
        pause
        exit /b 1
    )
) else (
    echo MySQL is installed.
)

echo.

echo Installing Node.js dependencies...
echo This may take a few minutes...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    echo Try running: npm cache clean --force
    echo Then run this script again.
    pause
    exit /b 1
)

echo Dependencies installed successfully.
echo.

echo Installing additional tools...
echo Installing ImageMagick for PDF/AI support...

REM Check if Chocolatey is installed
choco --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Installing ImageMagick via Chocolatey...
    choco install imagemagick -y
) else (
    echo Chocolatey not found. Please install ImageMagick manually:
    echo 1. Download from https://imagemagick.org/script/download.php#windows
    echo 2. Install and add to PATH
    echo.
    set /p continue="Continue without ImageMagick? (y/n): "
    if /i not "%continue%"=="y" (
        pause
        exit /b 1
    )
)

echo.

echo Checking Electron dependencies...
echo Installing Electron app dependencies...
npm run postinstall
if %errorlevel% neq 0 (
    echo WARNING: Electron dependencies installation failed!
    echo This might cause issues with the application.
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" (
        pause
        exit /b 1
    )
)

echo.

echo Building application...
npm run build:main
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo Build completed successfully.
echo.

echo Checking MySQL connection...
echo Please make sure MySQL is running and accessible.
echo.

echo Running setup configuration...
npm run setup
if %errorlevel% neq 0 (
    echo ERROR: Setup configuration failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To run the application:
echo   npm run dev
echo.
echo To build for production:
echo   npm run build
echo   npm start
echo.
echo To create distribution:
echo   npm run dist
echo.
pause 