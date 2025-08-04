#!/bin/bash

echo "========================================"
echo "GoTagSight - macOS Setup Script"
echo "========================================"

echo ""
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js using one of these methods:"
    echo "1. Homebrew: brew install node"
    echo "2. Download from https://nodejs.org/"
    echo "Then run this script again."
    exit 1
fi

echo "Node.js is installed: $(node --version)"
echo ""

echo "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed!"
    exit 1
fi

echo "npm is installed: $(npm --version)"
echo ""

echo "Checking Git installation..."
if ! command -v git &> /dev/null; then
    echo "WARNING: Git is not installed!"
    echo "Git is recommended for version control."
    echo "Install with: brew install git"
    echo ""
    read -p "Do you want to continue without Git? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "Git is installed: $(git --version)"
fi

echo ""

echo "Checking Homebrew installation..."
if ! command -v brew &> /dev/null; then
    echo "WARNING: Homebrew is not installed!"
    echo "Homebrew is recommended for easy package management."
    echo "Install with: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo ""
    read -p "Do you want to continue without Homebrew? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "Homebrew is installed."
fi

echo ""

echo "Checking MySQL client (optional)..."
if ! command -v mysql &> /dev/null; then
    echo "MySQL client is not installed locally."
    echo "This is OK - you will connect to production database."
    echo "If you need MySQL client for testing, you can install it later."
else
    echo "MySQL client is available locally."
fi

echo ""

echo "Installing Node.js dependencies..."
echo "This may take a few minutes..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies!"
    echo "Try running: npm cache clean --force"
    echo "Then run this script again."
    exit 1
fi

echo "Dependencies installed successfully."
echo ""

echo "Installing additional tools..."
echo "Installing ImageMagick for PDF/AI support..."

if command -v brew &> /dev/null; then
    echo "Installing ImageMagick via Homebrew..."
    brew install imagemagick
    if [ $? -ne 0 ]; then
        echo "WARNING: Failed to install ImageMagick!"
        echo "You can install it manually later with: brew install imagemagick"
    else
        echo "ImageMagick installed successfully."
    fi
else
    echo "Homebrew not available. Please install ImageMagick manually:"
    echo "1. Install Homebrew first"
    echo "2. Run: brew install imagemagick"
    echo ""
    read -p "Continue without ImageMagick? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

echo "Checking for Ghostscript (required for PDF support)..."
if ! command -v gs &> /dev/null; then
    echo "Installing Ghostscript..."
    if command -v brew &> /dev/null; then
        brew install ghostscript
    else
        echo "Please install Ghostscript manually for PDF support."
    fi
else
    echo "Ghostscript is installed."
fi

echo ""

echo "Checking Electron dependencies..."
echo "Installing Electron app dependencies..."
npm run postinstall
if [ $? -ne 0 ]; then
    echo "WARNING: Electron dependencies installation failed!"
    echo "This might cause issues with the application."
    echo ""
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

echo "Building application..."
npm run build:main
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed!"
    exit 1
fi

echo "Build completed successfully."
echo ""

echo "Running setup configuration..."
npm run setup
if [ $? -ne 0 ]; then
    echo "ERROR: Setup configuration failed!"
    exit 1
fi

echo ""
echo "========================================"
echo "Setup completed successfully!"
echo "========================================"
echo ""
echo "To run the application:"
echo "  npm run dev"
echo ""
echo "To build for production:"
echo "  npm run build"
echo "  npm start"
echo ""
echo "To create distribution:"
echo "  npm run dist"
echo ""
echo "For more information, see SETUP.md"
echo "" 