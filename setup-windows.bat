@echo off
echo ========================================
echo GoTagSight - Windows Setup Script
echo ========================================

echo.
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed!
    echo.
    echo Installing Node.js...
    
    REM Check if Chocolatey is available
    choco --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo Installing Node.js via Chocolatey...
        choco install nodejs -y
        if %errorlevel% neq 0 (
            echo ERROR: Failed to install Node.js via Chocolatey!
            echo Please install Node.js manually from https://nodejs.org/
            pause
            exit /b 1
        )
    ) else (
        echo Chocolatey not found. Please install Node.js manually:
        echo 1. Download from https://nodejs.org/
        echo 2. Run the installer
        echo 3. Restart this script
        echo.
        echo Or install Chocolatey first:
        echo Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        echo.
        pause
        exit /b 1
    )
    
    echo Node.js installed successfully.
    echo Please restart this script to continue.
    pause
    exit /b 0
)

echo Node.js is installed: 
node --version
echo.

echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    echo Please reinstall Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo npm is installed: 
npm --version
echo.

echo Checking Chocolatey installation...
choco --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Chocolatey is not installed!
    echo Installing Chocolatey package manager...
    echo This will help install other tools automatically.
    echo.
    set /p install_choco="Do you want to install Chocolatey? (y/n): "
    if /i "%install_choco%"=="y" (
        echo Installing Chocolatey...
        powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
        if %errorlevel% neq 0 (
            echo WARNING: Failed to install Chocolatey!
            echo You may need to run PowerShell as Administrator.
        ) else (
            echo Chocolatey installed successfully.
            echo Please restart this script to continue.
            pause
            exit /b 0
        )
    ) else (
        echo Skipping Chocolatey installation.
        echo Some tools may need to be installed manually.
    )
) else (
    echo Chocolatey is installed.
)

echo.
echo Checking Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Git is not installed!
    choco --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo Installing Git via Chocolatey...
        choco install git -y
        if %errorlevel% neq 0 (
            echo WARNING: Failed to install Git via Chocolatey!
            echo You can install Git manually from https://git-scm.com/
        ) else (
            echo Git installed successfully.
        )
    ) else (
        echo WARNING: Git is not installed!
        echo Git is recommended for version control.
        echo You can install Git from https://git-scm.com/
        echo.
        set /p continue="Do you want to continue without Git? (y/n): "
        if /i not "%continue%"=="y" (
            pause
            exit /b 1
        )
    )
) else (
    echo Git is installed.
)

echo.

echo Checking MySQL client (optional)...
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo MySQL client is not installed locally.
    echo This is OK - you will connect to production database.
    echo If you need MySQL client for testing, you can install it later.
) else (
    echo MySQL client is available locally.
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