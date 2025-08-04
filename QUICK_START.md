# GoTagSight - Quick Start Guide

## 🚀 Cài đặt nhanh

### Windows
**Phương pháp 1: Setup tự động (khuyến nghị)**
1. Double-click `setup-windows.bat`
2. Làm theo hướng dẫn
3. Chạy `npm run dev`

**Phương pháp 2: Cài đặt Chocolatey trước**
1. Right-click PowerShell → "Run as Administrator"
2. Chạy: `.\install-chocolatey.ps1`
3. Sau đó chạy: `setup-windows.bat`
4. Chạy `npm run dev`

### macOS
1. Mở Terminal
2. Chạy `./setup-macos.sh`
3. Làm theo hướng dẫn
4. Chạy `npm run dev`

## 📋 Yêu cầu trước khi cài đặt

### Bắt buộc
- [Node.js](https://nodejs.org/) (v16+)
- [npm](https://www.npmjs.com/) (đi kèm với Node.js)
- [MySQL](https://dev.mysql.com/downloads/mysql/) (v8+)

### Khuyến nghị
- [Git](https://git-scm.com/) (version control)
- [Homebrew](https://brew.sh/) (macOS package manager)
- [Chocolatey](https://chocolatey.org/) (Windows package manager)

### Tùy chọn (cho PDF/AI support)
- [ImageMagick](https://imagemagick.org/) 
  - macOS: `brew install imagemagick`
  - Windows: `choco install imagemagick`
- [Ghostscript](https://www.ghostscript.com/) (cho PDF support)
  - macOS: `brew install ghostscript`
  - Windows: `choco install ghostscript`

## ⚙️ Cấu hình

### 1. Database Setup
```sql
CREATE DATABASE production;
USE production;

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

### 2. Setup Configuration
```bash
npm run setup
```

Nhập thông tin:
- **Host**: localhost
- **Port**: 3306
- **User**: root
- **Password**: [your MySQL password]
- **Database**: production
- **Table**: order_details
- **Image Path**: [đường dẫn thư mục ảnh]

## 🎯 Sử dụng

### Quét barcode
1. Nhập mã 6 ký tự vào ô input
2. Hoặc sử dụng webcam để quét tự động
3. Xem thông tin đơn hàng và ảnh sản phẩm

### Quản lý inventory
1. Quét nhiều đơn hàng
2. Click "Add to Inventory" để nhập kho
3. Trạng thái sẽ thay đổi từ `C1F1R1P1E1V0` → `C1F1R1P1E1V1I0`

### BarTender Integration
1. Mở Settings → BarTender Settings
2. Enable BarTender Integration
3. Chọn method (Excel Export, File System, etc.)
4. Cấu hình đường dẫn file

## 📁 Cấu trúc file

```
GoTagSight/
├── setup-windows.bat     # Windows setup script
├── setup-macos.sh        # macOS setup script
├── SETUP.md              # Hướng dẫn chi tiết
├── README.md             # Tổng quan dự án
└── QUICK_START.md       # Hướng dẫn nhanh (này)
```

## 🔧 Scripts hữu ích

```bash
npm run dev          # Development mode
npm run build        # Build production
npm run start        # Run production
npm run setup        # Setup configuration
npm run dist         # Build distribution
npm run dist:win     # Build for Windows
npm run dist:mac     # Build for macOS
```

## 🆘 Troubleshooting

### Lỗi MySQL Connection
- Kiểm tra MySQL service đang chạy
- Kiểm tra thông tin kết nối trong config
- Đảm bảo user có quyền truy cập database

### Lỗi Image Loading
- Kiểm tra đường dẫn ảnh trong config
- Đảm bảo file ảnh tồn tại
- Hỗ trợ định dạng: PNG, JPG, PDF, AI

### Lỗi BarTender Export
- Kiểm tra quyền ghi file
- Đảm bảo thư mục tồn tại
- Kiểm tra định dạng file (.xlsx)

## 📞 Hỗ trợ

Xem [SETUP.md](SETUP.md) để biết thêm chi tiết về cài đặt và xử lý lỗi. 