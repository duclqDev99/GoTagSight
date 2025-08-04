# GoTagSight - Barcode Scanner App

Ứng dụng desktop để quét barcode cho QC sản phẩm và nhập kho, hỗ trợ Windows và macOS.

## Tính năng

- **Quét barcode**: Sử dụng webcam để quét barcode 6 ký tự
- **Nhập thủ công**: Nhập mã barcode thủ công
- **Hiển thị thông tin order**: Tìm kiếm và hiển thị thông tin đơn hàng từ MySQL database
- **Xem ảnh sản phẩm**: Hỗ trợ PNG, JPG, PDF, AI
- **QC sản phẩm**: Đánh dấu Pass/Fail cho sản phẩm
- **Cấu hình**: Thiết lập đường dẫn ảnh và MySQL database

## Yêu cầu hệ thống

- Node.js 16+ 
- MySQL 5.7+ hoặc MySQL 8.0+
- npm hoặc yarn

## Cài đặt

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Setup MySQL Database
Xem file `MYSQL_SETUP.md` để hướng dẫn chi tiết về:
- Cài đặt MySQL
- Tạo database và user
- Chạy script setup

### 3. Chạy ứng dụng trong môi trường development
```bash
npm run dev
```

### 4. Build ứng dụng
```bash
# Build cho tất cả platform
npm run build

# Build cho Windows
npm run dist:win

# Build cho macOS
npm run dist:mac
```

## Cấu hình

1. Mở ứng dụng và vào tab "Settings"
2. Chọn thư mục chứa ảnh sản phẩm (PNG, JPG, PDF, AI)
3. Cấu hình MySQL database:
   - Host: localhost (hoặc IP MySQL server)
   - Port: 3306
   - Username: root (hoặc user đã tạo)
   - Password: password của user
   - Database: gotagsight
4. Click "Test Connection" để kiểm tra kết nối
5. Click "Create Sample Data" để tạo dữ liệu mẫu
6. Lưu cấu hình

## Sử dụng

### Quét barcode
1. Mở tab "Scanner"
2. Click "Start Scanning" để bắt đầu quét
3. Đưa barcode vào khung hình webcam
4. Hoặc nhập mã 6 ký tự thủ công

### Xem thông tin order
- Sau khi quét thành công, ứng dụng sẽ tự động chuyển đến trang hiển thị thông tin order
- Hiển thị thông tin sản phẩm và ảnh
- Click vào ảnh để xem full size

### QC sản phẩm
- Click "Pass QC" hoặc "Fail QC" để đánh dấu trạng thái
- Thông tin QC sẽ được lưu vào MySQL database

## Cấu trúc Database

Ứng dụng sử dụng MySQL với bảng `order_details`:

```sql
CREATE TABLE order_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_code VARCHAR(6) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  image_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Cấu trúc thư mục ảnh

```
images/
├── product1.png
├── product2.jpg
├── product3.pdf
└── product4.ai
```

## Phát triển

### Cấu trúc project
```
src/
├── main/           # Electron main process
│   ├── main.ts
│   ├── preload.ts
│   └── database.ts
└── renderer/       # React renderer process
    ├── components/
    │   ├── Scanner.tsx
    │   ├── OrderView.tsx
    │   └── Settings.tsx
    ├── App.tsx
    └── main.tsx
```

### Scripts
- `npm run dev`: Chạy development server
- `npm run build`: Build ứng dụng
- `npm run dist`: Tạo installer

## Troubleshooting

### Lỗi MySQL connection
- Kiểm tra MySQL service có đang chạy không
- Kiểm tra thông tin kết nối (host, port, username, password)
- Xem file `MYSQL_SETUP.md` để hướng dẫn chi tiết

### Lỗi webcam không hoạt động
- Kiểm tra quyền truy cập webcam
- Thử refresh trang
- Kiểm tra webcam có được sử dụng bởi ứng dụng khác

### Lỗi không tìm thấy sản phẩm
- Kiểm tra mã barcode có đúng 6 ký tự
- Kiểm tra database có chứa mã tương ứng
- Thử tìm kiếm với một phần của mã

## License

MIT 