# BarTender Integration Setup

## Tổng quan
Ứng dụng GoTagSight có thể tích hợp với phần mềm BarTender để tự động in mã vạch khi quét barcode.

## Các phương thức tích hợp

### 1. File System (Khuyến nghị cho bắt đầu)
- **Cách hoạt động**: Ứng dụng sẽ ghi dữ liệu in vào file JSON
- **BarTender**: Sử dụng Integration Builder để đọc file và in
- **Ưu điểm**: Đơn giản, không cần cấu hình mạng

### 2. Named Pipes (Windows)
- **Cách hoạt động**: Kết nối trực tiếp qua Named Pipes
- **BarTender**: Tạo Integration Builder với Named Pipe listener
- **Ưu điểm**: Real-time, hiệu suất cao

### 3. HTTP/HTTPS
- **Cách hoạt động**: Gửi HTTP POST request
- **BarTender**: Tạo Integration Builder với HTTP listener
- **Ưu điểm**: Cross-platform, có thể remote

## Cấu hình trong ứng dụng

### Bước 1: Cấu hình BarTender trong Settings
1. Mở Settings trong ứng dụng
2. Chọn tab "BarTender Integration"
3. Cấu hình:
   - **Enabled**: Bật/tắt tích hợp
   - **Method**: Chọn phương thức (file/named_pipe/http)
   - **Template Name**: Tên template trong BarTender
   - **Print Quantity**: Số lượng bản in

### Bước 2: Cấu hình BarTender

#### Phương thức File System:
1. Tạo Integration Builder trong BarTender
2. Thêm File System trigger
3. Cấu hình đọc file `print_queue.json`
4. Map dữ liệu với template
5. Thêm Print action

#### Phương thức Named Pipes:
1. Tạo Integration Builder trong BarTender
2. Thêm Named Pipe trigger
3. Cấu hình pipe name: `BarTenderPrint`
4. Map JSON data với template
5. Thêm Print action

#### Phương thức HTTP:
1. Tạo Integration Builder trong BarTender
2. Thêm HTTP trigger
3. Cấu hình endpoint: `http://localhost:8080/print`
4. Map JSON data với template
5. Thêm Print action

## Cấu trúc dữ liệu

### File System JSON:
```json
[
  {
    "timestamp": "2024-01-01T10:00:00.000Z",
    "template": "Default",
    "data": {
      "barcode": "ABC123",
      "orderInfo": {
        "id": 1,
        "task_code": "ABC123",
        "product_name_new": "Product Name"
      }
    },
    "quantity": 1
  }
]
```

### Named Pipes/HTTP JSON:
```json
{
  "template": "Default",
  "data": {
    "barcode": "ABC123",
    "orderInfo": {
      "id": 1,
      "task_code": "ABC123",
      "product_name_new": "Product Name"
    }
  },
  "quantity": 1
}
```

## Template BarTender

### Các field có sẵn:
- `barcode`: Mã vạch đã quét
- `orderInfo.id`: ID đơn hàng
- `orderInfo.task_code`: Mã task
- `orderInfo.product_name_new`: Tên sản phẩm
- `orderInfo.task_code_front`: Mã task front
- `orderInfo.task_code_back`: Mã task back

### Ví dụ template:
```
Barcode: [barcode]
Order ID: [orderInfo.id]
Product: [orderInfo.product_name_new]
Task Code: [orderInfo.task_code]
```

## Troubleshooting

### Lỗi thường gặp:
1. **"BarTender integration is disabled"**
   - Kiểm tra cấu hình trong Settings
   - Đảm bảo đã bật "Enabled"

2. **"Named pipe connection error"**
   - Kiểm tra BarTender Integration Builder
   - Đảm bảo pipe name đúng
   - Kiểm tra quyền truy cập

3. **"HTTP print error"**
   - Kiểm tra URL trong cấu hình
   - Đảm bảo BarTender HTTP listener đang chạy
   - Kiểm tra firewall

4. **"File print error"**
   - Kiểm tra đường dẫn file
   - Đảm bảo quyền ghi file
   - Kiểm tra BarTender file trigger

### Test Connection:
- Sử dụng nút "Test Connection" trong Settings
- Kiểm tra log trong console
- Đảm bảo BarTender đang chạy

## Lưu ý bảo mật
- Không chia sẻ cấu hình BarTender với người khác
- Sử dụng HTTPS cho HTTP integration
- Kiểm tra quyền truy cập file system
- Backup cấu hình trước khi thay đổi 