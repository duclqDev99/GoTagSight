# Hướng dẫn sử dụng GoTagSight

## Cài đặt và chạy ứng dụng

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Chạy ứng dụng trong development mode
```bash
npm run dev
```

### 3. Build ứng dụng cho production
```bash
# Build cho tất cả platform
npm run build

# Build cho Windows
npm run dist:win

# Build cho macOS
npm run dist:mac
```

## Cấu hình ban đầu

### 1. Thiết lập database
- Mở ứng dụng và vào tab "Settings"
- Click "Browse" để chọn file database (có thể là file JSON hoặc tạo mới)
- Hoặc sử dụng file `demo-data.json` có sẵn

### 2. Thiết lập thư mục ảnh
- Trong Settings, click "Browse" để chọn thư mục chứa ảnh sản phẩm
- Hỗ trợ các định dạng: PNG, JPG, PDF, AI
- Tạo thư mục `demo-images` và đặt ảnh vào đó

### 3. Lưu cấu hình
- Click "Save Settings" để lưu cấu hình

## Sử dụng ứng dụng

### Quét barcode
1. Mở tab "Scanner"
2. Click "Start Scanning" để bắt đầu quét
3. Đưa barcode vào khung hình webcam
4. Ứng dụng sẽ tự động nhận diện barcode 6 ký tự

### Nhập mã thủ công
1. Trong tab Scanner, nhập mã 6 ký tự vào ô "Manual Input"
2. Nhấn Enter để tìm kiếm

### Xem thông tin sản phẩm
- Sau khi quét thành công, ứng dụng sẽ hiển thị:
  - Tên sản phẩm
  - Mã task code
  - Số lượng
  - Trạng thái
  - Ảnh sản phẩm

### QC sản phẩm
- Click "Pass QC" để đánh dấu sản phẩm đạt chuẩn
- Click "Fail QC" để đánh dấu sản phẩm không đạt chuẩn
- Trạng thái sẽ được cập nhật trong database

### Xem ảnh sản phẩm
- Click vào ảnh sản phẩm để xem full size
- Hỗ trợ các định dạng:
  - PNG, JPG: Hiển thị trực tiếp
  - PDF: Hiển thị trang đầu tiên
  - AI: Hiển thị thông báo cần mở bằng Adobe Illustrator

## Cấu trúc dữ liệu

### Database format (JSON)
```json
[
  {
    "id": 1,
    "task_code": "ABC123",
    "product_name": "iPhone 15 Pro",
    "quantity": 10,
    "status": "pending",
    "image_path": "/path/to/image.png"
  }
]
```

### Các trạng thái có thể có:
- `pending`: Chờ QC
- `pass`: Đạt chuẩn
- `fail`: Không đạt chuẩn

## Troubleshooting

### Lỗi webcam không hoạt động
- Kiểm tra quyền truy cập webcam
- Thử refresh trang
- Kiểm tra webcam có được sử dụng bởi ứng dụng khác

### Lỗi không tìm thấy sản phẩm
- Kiểm tra mã barcode có đúng 6 ký tự
- Kiểm tra database có chứa mã tương ứng
- Thử tìm kiếm với một phần của mã

### Lỗi không hiển thị ảnh
- Kiểm tra đường dẫn ảnh trong database
- Kiểm tra file ảnh có tồn tại
- Kiểm tra định dạng file được hỗ trợ

### Lỗi không lưu được cấu hình
- Kiểm tra quyền ghi file
- Thử chạy ứng dụng với quyền admin
- Kiểm tra ổ đĩa có đủ dung lượng

## Tính năng nâng cao

### Tùy chỉnh giao diện
- Có thể chỉnh sửa CSS trong `src/renderer/App.css`
- Thay đổi màu sắc, font chữ, layout

### Thêm sản phẩm mới
- Chỉnh sửa file database JSON
- Thêm entry mới với format tương tự
- Đặt ảnh vào thư mục đã cấu hình

### Backup dữ liệu
- Sao chép file database JSON
- Sao chép thư mục ảnh
- Lưu trữ ở vị trí an toàn

## Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console log trong Developer Tools
2. Restart ứng dụng
3. Kiểm tra cấu hình database và ảnh
4. Liên hệ support team 