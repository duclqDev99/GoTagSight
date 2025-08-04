# GoTagSight - Setup Guide

## Yêu cầu hệ thống

### Windows
- Windows 10/11 (64-bit)
- Node.js 16.0.0 trở lên
- MySQL Server 8.0 trở lên
- Git (tùy chọn)

### macOS
- macOS 10.15 (Catalina) trở lên
- Node.js 16.0.0 trở lên
- MySQL Server 8.0 trở lên
- Git (tùy chọn)

## Cài đặt

### Phương pháp 1: Setup Scripts (Khuyến nghị)

#### Windows
```bash
# Double-click file setup-windows.bat
# Hoặc chạy trong Command Prompt
setup-windows.bat
```

#### macOS
```bash
# Chạy trong Terminal
./setup-macos.sh
```

### Phương pháp 2: Manual Setup

#### Bước 1: Cài đặt Node.js

**Windows:**
1. Tải Node.js từ https://nodejs.org/ (LTS version)
2. Chạy file installer và làm theo hướng dẫn
3. Kiểm tra cài đặt:
```bash
node --version
npm --version
```

**macOS:**
1. Cài đặt Homebrew (khuyến nghị):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. Cài đặt Node.js:
```bash
brew install node
```

3. Kiểm tra cài đặt:
```bash
node --version
npm --version
```

#### Bước 2: Cài đặt MySQL Client (Tùy chọn)

**Lưu ý:** Bạn sẽ kết nối đến database production có sẵn, không cần cài đặt MySQL Server local.

**Windows:**
1. Tải MySQL Client từ https://dev.mysql.com/downloads/mysql/
2. Chỉ cài đặt MySQL Client (không cần Server)
3. Thêm MySQL vào PATH

**macOS:**
```bash
brew install mysql-client
```

**Hoặc bỏ qua bước này** - ứng dụng sẽ kết nối trực tiếp đến production database.

#### Bước 3: Cài đặt Git (Tùy chọn)

**Windows:**
1. Tải Git từ https://git-scm.com/
2. Chạy installer và làm theo hướng dẫn

**macOS:**
```bash
brew install git
```

#### Bước 4: Cài đặt ImageMagick (Cho PDF/AI support)

**Windows:**
1. Cài đặt Chocolatey (package manager):
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

2. Cài đặt ImageMagick:
```powershell
choco install imagemagick -y
```

**macOS:**
```bash
brew install imagemagick ghostscript
```

#### Bước 5: Clone và cài đặt dự án

```bash
# Clone dự án (nếu sử dụng Git)
git clone <repository-url>
cd GoTagSight

# Hoặc tải và giải nén file ZIP
cd GoTagSight

# Cài đặt dependencies
npm install

# Cài đặt Electron dependencies
npm run postinstall

# Build application
npm run build:main
```

### Bước 4: Cấu hình database

**Lưu ý:** Bạn sẽ kết nối đến database production có sẵn.

1. Đảm bảo bạn có thông tin kết nối production database:
- **Host**: IP hoặc domain của production database
- **Port**: 3306 (mặc định) hoặc port tùy chỉnh
- **User**: Username có quyền truy cập database
- **Password**: Password của user
- **Database**: Tên database production
- **Table**: `order_details` (hoặc tên bảng tương ứng)

2. Cấu trúc bảng cần có:
```sql
CREATE TABLE order_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_code VARCHAR(255),
    task_code_front VARCHAR(255),
    task_code_back VARCHAR(255),
    product_name_new VARCHAR(255),
    description_task TEXT,
    description_task_front TEXT,
    description_task_back TEXT,
    quantity INT,
    status VARCHAR(50),
    price DECIMAL(10,2),
    score_task VARCHAR(50),
    score_task_front VARCHAR(50),
    score_task_back VARCHAR(50),
    `condition` VARCHAR(50),
    size_style VARCHAR(100),
    pack VARCHAR(100),
    color VARCHAR(100),
    material VARCHAR(100),
    layout_style VARCHAR(100),
    personalization TEXT,
    link TEXT,
    status_code_string VARCHAR(50),
    seller_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

3. Chạy script setup config:
```bash
npm run setup
```

4. Nhập thông tin database production khi được hỏi.

### Bước 5: Cấu hình đường dẫn ảnh

Trong quá trình setup, nhập đường dẫn đến thư mục chứa ảnh sản phẩm:
- Windows: `C:\path\to\images`
- macOS: `/Users/username/path/to/images`

### Bước 6: Chạy ứng dụng

```bash
# Chế độ development
npm run dev

# Hoặc build và chạy production
npm run build
npm start
```

## Cấu hình BarTender (Tùy chọn)

### Excel Export
1. Mở Settings trong ứng dụng
2. Chọn "BarTender Settings"
3. Enable BarTender Integration
4. Chọn "Excel Export"
5. Nhập đường dẫn file Excel (ví dụ: `/path/to/bartender_export.xlsx`)

### File System
1. Chọn "File System" method
2. Nhập đường dẫn file JSON (ví dụ: `/path/to/print_queue.json`)

### Named Pipes (Windows)
1. Chọn "Named Pipes" method
2. Nhập đường dẫn pipe (mặc định: `\\.\pipe\BarTenderPrint`)

### HTTP/HTTPS
1. Chọn "HTTP/HTTPS" method
2. Nhập URL endpoint (ví dụ: `http://localhost:8080/print`)

## Troubleshooting

### Lỗi Node.js/npm
- **Node.js not found**: Cài đặt Node.js từ https://nodejs.org/
- **npm not found**: Cài đặt lại Node.js (npm đi kèm)
- **Version too old**: Cập nhật Node.js lên version 16+
- **Permission denied**: Chạy với quyền admin (Windows) hoặc sudo (macOS)

### Lỗi MySQL Connection
- **MySQL not found**: Cài đặt MySQL Server
- **Service not running**: Khởi động MySQL service
- **Access denied**: Kiểm tra username/password
- **Connection refused**: Kiểm tra host/port
- **Database not found**: Tạo database và bảng

### Lỗi Image Loading
- **ImageMagick not found**: Cài đặt ImageMagick cho PDF/AI support
- **Ghostscript not found**: Cài đặt Ghostscript cho PDF support
- **File not found**: Kiểm tra đường dẫn ảnh trong config
- **Permission denied**: Kiểm tra quyền đọc file

### Lỗi Electron Build
- **Native modules**: Chạy `npm run postinstall`
- **Build failed**: Kiểm tra TypeScript errors
- **Dependencies missing**: Chạy `npm install` lại
- **Cache issues**: Xóa cache: `npm cache clean --force`

### Lỗi BarTender Export
- **File write error**: Kiểm tra quyền ghi thư mục
- **Directory not found**: Tạo thư mục trước khi export
- **Excel format error**: Kiểm tra thư viện xlsx
- **Path issues**: Sử dụng đường dẫn tuyệt đối

### Lỗi Build
- **TypeScript errors**: Kiểm tra syntax trong source code
- **Missing dependencies**: Chạy `npm install`
- **Version conflicts**: Xóa node_modules và cài lại
- **Memory issues**: Tăng RAM cho build process

### Lỗi Development
- **Port conflicts**: Thay đổi port trong vite.config.ts
- **Hot reload not working**: Restart development server
- **DevTools not opening**: Kiểm tra Electron configuration
- **File watching issues**: Tăng file watcher limits

### Lỗi Production
- **App not starting**: Kiểm tra main.js build
- **Renderer not loading**: Kiểm tra renderer build
- **Config not found**: Chạy setup script
- **Database connection**: Kiểm tra production database

## Cấu trúc thư mục

```
GoTagSight/
├── src/
│   ├── main/           # Electron main process
│   └── renderer/       # React renderer process
├── dist/               # Build output
├── node_modules/       # Dependencies
├── package.json        # Project config
├── tsconfig.json       # TypeScript config
├── vite.config.ts      # Vite config
└── SETUP.md           # This file
```

## Scripts có sẵn

```bash
npm run dev          # Chạy development mode
npm run build        # Build production
npm run start        # Chạy production
npm run setup        # Setup config
npm run dist         # Build distribution
```

## Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Log trong terminal
2. Console trong DevTools (Ctrl+Shift+I)
3. File config đã được tạo đúng chưa
4. Database connection
5. File permissions

## Ghi chú

- Ứng dụng sẽ tự động tạo file config được mã hóa
- Dữ liệu quét sẽ được lưu trong localStorage
- File Excel sẽ được tạo tự động khi quét barcode
- Hỗ trợ hot reload trong development mode 