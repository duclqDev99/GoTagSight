# GoTagSight - Hướng Dẫn Cài Đặt Windows

## 📦 File Installer
- **File**: `release/GoTagSight-Setup-1.0.0.exe`
- **Kích thước**: ~157MB
- **Hỗ trợ**: Windows x64 và ARM64

## 🚀 Cách Cài Đặt

### Phương Pháp 1: Cài Đặt Trực Tiếp (Khuyến Nghị)
1. Copy file `GoTagSight-Setup-1.0.0.exe` đến máy Windows
2. Chạy file với quyền Administrator
3. Installer sẽ tự động:
   - Dừng phiên bản cũ nếu đang chạy
   - Gỡ cài đặt phiên bản cũ
   - Cài đặt phiên bản mới
   - Tạo shortcut Desktop và Start Menu

### Phương Pháp 2: Gỡ Cài Đặt Thủ Công Trước
Nếu gặp lỗi, chạy script PowerShell:
```powershell
# Chạy PowerShell với quyền Administrator
.\uninstall-previous.ps1
```

## ⚙️ Tính Năng Installer

### ✅ Tự Động Xử Lý
- **Dừng process cũ**: Tự động dừng GoTagSight đang chạy
- **Gỡ cài đặt sạch**: Xóa hoàn toàn phiên bản cũ
- **Xóa dữ liệu**: Xóa config files và registry entries
- **Tạo shortcut**: Desktop và Start Menu

### 🔧 Tùy Chọn Cài Đặt
- **Thư mục cài đặt**: Có thể thay đổi
- **Shortcut**: Desktop và Start Menu
- **Uninstall**: Hoàn toàn với dọn dẹp dữ liệu

## 🛠️ Troubleshooting

### Lỗi "Access Denied"
```powershell
# Chạy PowerShell với quyền Administrator
Start-Process PowerShell -Verb RunAs
```

### Lỗi "File in Use"
1. Đóng tất cả ứng dụng GoTagSight
2. Kiểm tra Task Manager
3. Chạy lại installer

### Lỗi "Registry Access"
```powershell
# Chạy script uninstall
.\uninstall-previous.ps1
```

## 📁 Cấu Trúc Thư Mục Sau Cài Đặt

```
C:\Program Files\GoTagSight\
├── GoTagSight.exe
├── resources\
│   ├── app.asar
│   └── demo-images\
└── [other files]

%APPDATA%\GoTagSight\
└── config.encrypted
```

## 🔄 Cập Nhật Phiên Bản

### Tự Động
- Chạy installer mới
- Sẽ tự động gỡ cài đặt phiên bản cũ

### Thủ Công
```powershell
# Gỡ cài đặt hoàn toàn
.\uninstall-previous.ps1

# Cài đặt phiên bản mới
.\GoTagSight-Setup-1.0.0.exe
```

## 🚨 Lưu Ý Quan Trọng

1. **Quyền Administrator**: Cần để gỡ cài đặt phiên bản cũ
2. **Backup Config**: Nếu có config quan trọng, backup trước
3. **Dừng App**: Đóng GoTagSight trước khi cài đặt
4. **Antivirus**: Có thể cảnh báo, chọn "Allow"

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Chạy script uninstall
2. Restart máy tính
3. Chạy installer với quyền Administrator
4. Kiểm tra Windows Defender/Antivirus

---
**Phiên bản**: 1.0.0  
**Ngày tạo**: $(date)  
**Hỗ trợ**: Windows 10/11 (x64, ARM64) 