# 🔒 Hướng dẫn Bảo mật - GoTagSight

## ⚠️ Quan trọng về Bảo mật

### 1. **Thay đổi Encryption Key**
Trước khi sử dụng trong production, **BẮT BUỘC** thay đổi encryption key:

```javascript
// Trong file setup-config.js, thay đổi:
const ENCRYPTION_KEY = 'your-super-secret-key-change-this';
// Thành:
const ENCRYPTION_KEY = 'your-very-long-and-random-secret-key-here';
```

### 2. **Sử dụng Environment Variables**
Để bảo mật hơn, sử dụng environment variables:

```bash
# Tạo file .env
ENCRYPTION_KEY=your-super-secret-key
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
```

### 3. **Bảo vệ File Config**
- File config được mã hóa và lưu tại `src/config.encrypted`
- **KHÔNG BAO GIỜ** commit file này lên git
- Đã được thêm vào `.gitignore`

## 🚀 Cách cấu hình Database

### Bước 1: Chạy script cấu hình
```bash
node setup-config.js
```

### Bước 2: Điền thông tin database
```
Host: localhost (hoặc IP MySQL server)
Port: 3306
Username: tên user MySQL
Password: password của user
Database: tên database hiện có
Table: tên bảng chứa thông tin sản phẩm
Image Path: đường dẫn thư mục ảnh
```

### Bước 3: Xác nhận và lưu
Script sẽ hiển thị summary và hỏi xác nhận trước khi lưu.

## 🗄️ Cấu trúc Database yêu cầu

### Bảng cần có các cột:
```sql
CREATE TABLE your_table_name (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_code VARCHAR(6) NOT NULL,      -- Mã barcode 6 ký tự
    product_name VARCHAR(255) NOT NULL,  -- Tên sản phẩm
    quantity INT NOT NULL,               -- Số lượng
    status VARCHAR(50) DEFAULT 'pending', -- Trạng thái
    image_path VARCHAR(500)              -- Đường dẫn ảnh
);
```

### Nếu bảng của bạn có tên cột khác:
Chỉnh sửa file `src/main/database.ts` để map đúng tên cột.

## 🔐 Bảo mật nâng cao

### 1. **Sử dụng Environment Variables**
```bash
# Tạo file .env
ENCRYPTION_KEY=your-production-secret-key
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-database
DB_TABLE=your-table-name
```

### 2. **Sử dụng SSL cho MySQL**
```javascript
// Trong database config
{
  host: 'localhost',
  port: 3306,
  user: 'username',
  password: 'password',
  database: 'database',
  ssl: {
    rejectUnauthorized: false
  }
}
```

### 3. **Restrict Database User Permissions**
```sql
-- Tạo user chỉ có quyền cần thiết
CREATE USER 'gotagsight_user'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT, UPDATE ON your_database.your_table TO 'gotagsight_user'@'localhost';
FLUSH PRIVILEGES;
```

## 🛡️ Best Practices

### 1. **Encryption Key**
- Sử dụng key dài ít nhất 32 ký tự
- Bao gồm chữ hoa, chữ thường, số, ký tự đặc biệt
- Thay đổi định kỳ

### 2. **File Permissions**
```bash
# Đảm bảo file config chỉ owner có thể đọc
chmod 600 src/config.encrypted
```

### 3. **Network Security**
- Sử dụng VPN nếu database ở remote
- Cấu hình firewall chỉ cho phép IP cần thiết
- Sử dụng SSH tunnel nếu cần

### 4. **Backup Security**
- Mã hóa backup files
- Lưu trữ backup ở vị trí an toàn
- Test restore procedure định kỳ

## 🔍 Troubleshooting

### Lỗi "Invalid encryption key":
- Kiểm tra ENCRYPTION_KEY có đúng không
- Đảm bảo key không bị thay đổi giữa các lần chạy

### Lỗi "Config file not found":
- Chạy lại `node setup-config.js`
- Kiểm tra file `src/config.encrypted` có tồn tại không

### Lỗi "Access denied":
- Kiểm tra MySQL user permissions
- Verify database connection credentials

## 📋 Checklist Bảo mật

- [ ] Thay đổi ENCRYPTION_KEY
- [ ] Sử dụng strong password cho MySQL
- [ ] Restrict database user permissions
- [ ] Cấu hình firewall
- [ ] Backup encryption key
- [ ] Test connection với production database
- [ ] Review file permissions
- [ ] Setup monitoring cho database access

## 🆘 Emergency Procedures

### Nếu config bị compromise:
1. Thay đổi ngay ENCRYPTION_KEY
2. Tạo lại config file
3. Thay đổi MySQL password
4. Review access logs
5. Notify security team

### Nếu quên encryption key:
1. Xóa file `src/config.encrypted`
2. Chạy lại `node setup-config.js`
3. Cấu hình lại database connection 