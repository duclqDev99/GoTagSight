#!/bin/bash

echo "========================================"
echo "GoTagSight - Windows Build Script"
echo "========================================"

echo ""
echo "Building GoTagSight for Windows..."
echo ""

echo "Step 1: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies!"
    exit 1
fi

echo ""
echo "Step 2: Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed!"
    exit 1
fi

echo ""
echo "Step 3: Creating Windows installer..."
echo "This may take several minutes..."
npm run dist:win
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to create installer!"
    exit 1
fi

echo ""
echo "========================================"
echo "Build completed successfully!"
echo "========================================"
echo ""
echo "Installer created: release/GoTagSight Setup 1.0.0.exe"
echo ""
echo "This installer supports both x64 and ARM64 Windows systems."
echo ""
echo "To install on Windows:"
echo "1. Copy the .exe file to your Windows machine"
echo "2. Double-click to run the installer"
echo "3. Follow the installation wizard"
echo "" 