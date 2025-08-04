# GoTagSight - Clone và Build trên máy khác

## 🚀 Hướng dẫn nhanh

### 1. Clone Repository
```bash
git clone https://github.com/duclqDev99/GoTagSight.git
cd GoTagSight
```

### 2. Build cho Windows
```bash
# Trên macOS/Linux
./build-windows.sh

# Trên Windows
build-windows.bat
```

### 3. Kết quả
File installer sẽ được tạo tại: `release/GoTagSight Setup 1.0.0.exe`

---

## 📋 Yêu cầu hệ thống

### Trước khi build
- **Node.js**: 18+ 
- **npm**: Có sẵn với Node.js
- **Git**: Để clone repository
- **Disk space**: Ít nhất 2GB trống

### Hệ thống hỗ trợ build
- **macOS**: 10.15+ (Catalina)
- **Linux**: Ubuntu 18.04+, CentOS 7+
- **Windows**: Windows 10/11

---

## 🔧 Các bước chi tiết

### Bước 1: Chuẩn bị môi trường

#### Trên macOS
```bash
# Cài đặt Node.js (nếu chưa có)
brew install node

# Hoặc tải từ https://nodejs.org/
```

#### Trên Linux (Ubuntu/Debian)
```bash
# Cài đặt Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài đặt build tools
sudo apt-get install -y build-essential
```

#### Trên Windows
```bash
# Tải Node.js từ https://nodejs.org/
# Hoặc sử dụng Chocolatey
choco install nodejs
```

### Bước 2: Clone và setup

```bash
# Clone repository
git clone https://github.com/duclqDev99/GoTagSight.git
cd GoTagSight

# Kiểm tra phiên bản Node.js
node --version  # Phải >= 18
npm --version
```

### Bước 3: Build ứng dụng

#### Cách 1: Build tự động (Khuyến nghị)
```bash
# Trên macOS/Linux
chmod +x build-windows.sh
./build-windows.sh

# Trên Windows
build-windows.bat
```

#### Cách 2: Build thủ công
```bash
# 1. Cài đặt dependencies
npm install

# 2. Build ứng dụng
npm run build

# 3. Tạo installer cho Windows
npm run dist:win
```

### Bước 4: Kiểm tra kết quả

```bash
# Kiểm tra file installer
ls -lh release/

# Kết quả mong đợi:
# GoTagSight Setup 1.0.0.exe (khoảng 157MB)
```

---

## 🎯 Các script có sẵn

### Build Scripts
- `build-windows.sh` - Build trên macOS/Linux
- `build-windows.bat` - Build trên Windows
- `validate-setup.bat` - Kiểm tra setup files

### Setup Scripts
- `setup-windows.bat` - Setup môi trường Windows
- `install-chocolatey.ps1` - Cài đặt Chocolatey
- `setup-macos.sh` - Setup môi trường macOS

### Documentation
- `BUILD_GUIDE.md` - Hướng dẫn build chi tiết
- `BUILD_SUMMARY.md` - Tóm tắt build
- `README.md` - Thông tin tổng quan

---

## 🔍 Troubleshooting

### Lỗi thường gặp

#### 1. "node: command not found"
```bash
# Cài đặt Node.js
# macOS: brew install node
# Linux: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
# Windows: Tải từ https://nodejs.org/
```

#### 2. "npm: command not found"
```bash
# Cài đặt npm (thường có sẵn với Node.js)
# Hoặc cài đặt lại Node.js
```

#### 3. "Permission denied" khi chạy script
```bash
# Cấp quyền thực thi
chmod +x build-windows.sh
chmod +x setup-macos.sh
```

#### 4. "Build failed" 
```bash
# Xóa cache và thử lại
npm cache clean --force
rm -rf node_modules
npm install
npm run build
```

#### 5. "Electron download failed"
```bash
# Kiểm tra kết nối internet
# Hoặc sử dụng proxy nếu cần
export ELECTRON_MIRROR="https://npm.taobao.org/mirrors/electron/"
```

### Kiểm tra môi trường
```bash
# Kiểm tra Node.js
node --version
npm --version

# Kiểm tra Git
git --version

# Kiểm tra disk space
df -h
```

---

## 📦 Kết quả build

### File installer
- **Tên**: `GoTagSight Setup 1.0.0.exe`
- **Kích thước**: ~157MB
- **Hỗ trợ**: Windows x64 và ARM64
- **Vị trí**: `release/` directory

### Cấu trúc thư mục sau build
```
GoTagSight/
├── release/
│   ├── GoTagSight Setup 1.0.0.exe    # Installer chính
│   ├── GoTagSight Setup 1.0.0.exe.blockmap
│   ├── latest.yml
│   ├── win-unpacked/                  # Unpacked x64
│   └── win-arm64-unpacked/            # Unpacked ARM64
├── dist/                              # Build output
├── node_modules/                      # Dependencies
└── [source files...]
```

---

## 🚀 Deploy

### Copy file installer
```bash
# Copy file .exe đến máy Windows
scp "release/GoTagSight Setup 1.0.0.exe" user@windows-machine:/path/to/destination/
```

### Hoặc sử dụng cloud storage
- Upload lên Google Drive, Dropbox, etc.
- Chia sẻ link download
- Hoặc sử dụng GitHub Releases

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra log lỗi trong terminal
2. Đảm bảo đã cài đặt đúng Node.js 18+
3. Kiểm tra kết nối internet
4. Tạo issue trên GitHub repository

**Lưu ý**: File installer được tạo sẽ hỗ trợ cả Windows x64 và ARM64, phù hợp với hầu hết các máy Windows hiện đại. 