# GoTagSight - Build & Installation Guide

## Build cho Windows

### Yêu cầu hệ thống
- Node.js 18+ 
- npm hoặc yarn
- Git (khuyến nghị)

### Cách 1: Build tự động (Khuyến nghị)

```bash
# Trên macOS/Linux
./build-windows.sh

# Trên Windows
build-windows.bat
```

### Cách 2: Build thủ công

```bash
# 1. Cài đặt dependencies
npm install

# 2. Build ứng dụng
npm run build

# 3. Tạo installer cho Windows
npm run dist:win
```

### Kết quả build
File installer sẽ được tạo tại: `release/GoTagSight Setup 1.0.0.exe`

## Cài đặt trên Windows

### Yêu cầu hệ thống Windows
- Windows 10/11 (x64 hoặc ARM64)
- Tối thiểu 4GB RAM
- 500MB dung lượng ổ cứng trống

### Các bước cài đặt

1. **Tải file installer**
   - Copy file `GoTagSight Setup 1.0.0.exe` từ thư mục `release/`
   - Chuyển file này đến máy Windows cần cài đặt

2. **Chạy installer**
   - Double-click vào file `.exe`
   - Nếu có cảnh báo bảo mật, chọn "Run anyway" hoặc "More info" → "Run anyway"

3. **Làm theo wizard cài đặt**
   - Chọn thư mục cài đặt (mặc định: `C:\Users\[Username]\AppData\Local\Programs\gotagsight`)
   - Chọn tạo shortcut trên Desktop (khuyến nghị)
   - Chọn tạo shortcut trong Start Menu (khuyến nghị)

4. **Hoàn tất cài đặt**
   - Installer sẽ tự động tạo shortcut
   - Ứng dụng có thể chạy ngay sau khi cài đặt

## Cấu hình sau khi cài đặt

### 1. Cấu hình Database
- Mở ứng dụng GoTagSight
- Vào Settings → Database
- Nhập thông tin kết nối MySQL:
  - Host: IP của MySQL server
  - Port: 3306 (mặc định)
  - Database: production
  - Username/Password: thông tin đăng nhập

### 2. Cấu hình Image Path
- Vào Settings → Image Path
- Nhập đường dẫn thư mục chứa ảnh sản phẩm
- Hỗ trợ: PNG, JPG, PDF, AI files

### 3. Cấu hình BarTender (Tùy chọn)
- Vào Settings → BarTender Integration
- Chọn phương thức tích hợp:
  - Excel Export
  - File System
  - Named Pipes (Windows)
  - HTTP/HTTPS

## Troubleshooting

### Lỗi thường gặp

1. **"Windows protected your PC"**
   - Click "More info" → "Run anyway"
   - Hoặc tắt Windows Defender SmartScreen tạm thời

2. **"Application cannot be started"**
   - Kiểm tra Visual C++ Redistributable
   - Tải và cài đặt từ Microsoft

3. **"Database connection failed"**
   - Kiểm tra MySQL server đang chạy
   - Kiểm tra firewall/network
   - Xác nhận thông tin kết nối

4. **"Image not found"**
   - Kiểm tra đường dẫn thư mục ảnh
   - Đảm bảo quyền truy cập thư mục

### Gỡ cài đặt

1. **Cách 1: Control Panel**
   - Mở Control Panel → Programs → Uninstall
   - Tìm "GoTagSight" → Uninstall

2. **Cách 2: Settings App**
   - Mở Settings → Apps → Apps & features
   - Tìm "GoTagSight" → Uninstall

3. **Cách 3: Thủ công**
   - Xóa thư mục: `C:\Users\[Username]\AppData\Local\Programs\gotagsight`
   - Xóa shortcut trên Desktop và Start Menu

## Phiên bản và cập nhật

### Kiểm tra phiên bản
- Mở ứng dụng → Help → About
- Hoặc xem trong Settings → About

### Cập nhật
- Tải phiên bản mới từ repository
- Chạy installer mới (sẽ ghi đè phiên bản cũ)
- Hoặc gỡ cài đặt phiên bản cũ trước khi cài mới

## Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra log file trong thư mục cài đặt
2. Tạo issue trên GitHub repository
3. Liên hệ team phát triển

---

**Lưu ý**: File installer này hỗ trợ cả Windows x64 và ARM64, phù hợp với hầu hết các máy Windows hiện đại. 