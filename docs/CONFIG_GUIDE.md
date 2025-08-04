# 🔧 Hướng dẫn cấu hình Database cho GoTagSight

## Vấn đề hiện tại
Ứng dụng đang gặp lỗi load giao diện. Trước tiên, hãy cấu hình database:

## Bước 1: Cấu hình Database

### Chạy script cấu hình:
```bash
node setup-config.js
```

### Điền thông tin database của bạn:
```
Host: localhost (hoặc IP MySQL server)
Port: 3306
Username: tên user MySQL của bạn
Password: password của user
Database: tên database hiện có
Table: tên bảng chứa thông tin sản phẩm
Image Path: đường dẫn thư mục ảnh
```

## Bước 2: Cấu trúc Database yêu cầu

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

### Ví dụ dữ liệu:
```sql
INSERT INTO your_table_name (task_code, product_name, quantity, status, image_path) VALUES
('ABC123', 'iPhone 15 Pro', 10, 'pending', '/path/to/iphone15pro.png'),
('DEF456', 'MacBook Air M2', 5, 'pending', '/path/to/macbook-air.pdf'),
('GHI789', 'AirPods Pro', 15, 'pending', '/path/to/airpods-pro.jpg');
```

## Bước 3: Chạy ứng dụng

### Sau khi cấu hình xong:
```bash
npm run dev
```

## Bước 4: Sử dụng ứng dụng

1. **Scanner tab**: Quét barcode hoặc nhập mã thủ công
2. **Order view**: Xem thông tin sản phẩm và ảnh
3. **Settings**: Cấu hình database và đường dẫn ảnh

## Troubleshooting

### Lỗi "Database connection failed":
- Kiểm tra MySQL service có đang chạy không
- Verify username/password
- Kiểm tra database và bảng có tồn tại không

### Lỗi "Table doesn't exist":
- Tạo bảng với cấu trúc như trên
- Kiểm tra tên bảng có đúng không

### Lỗi "No data found":
- Thêm dữ liệu vào bảng
- Kiểm tra mã barcode có đúng format không

## Cấu hình nâng cao

### Sử dụng Environment Variables:
```bash
# Tạo file .env
ENCRYPTION_KEY=your-secret-key
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
DB_TABLE=your_table_name
```

### Bảo mật:
- Thay đổi ENCRYPTION_KEY trong setup-config.js
- Không commit file config.encrypted lên git
- Sử dụng strong password cho MySQL

## Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console log trong Developer Tools
2. Verify database connection
3. Kiểm tra cấu trúc bảng
4. Restart ứng dụng 