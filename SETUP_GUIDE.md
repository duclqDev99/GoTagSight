# 🔧 Hướng dẫn cấu hình GoTagSight cho bảng order_details thực tế

## Cấu trúc bảng hiện tại
Ứng dụng đã được cập nhật để hoạt động với bảng `order_details` thực tế của bạn:

```sql
CREATE TABLE `order_details` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `task_code` varchar(50) DEFAULT NULL,
  `task_code_front` varchar(191) DEFAULT NULL,
  `task_code_back` varchar(191) DEFAULT NULL,
  `product_name_new` varchar(191) DEFAULT NULL,
  `description_task` text,
  `description_task_front` text,
  `description_task_back` text,
  `quantity` int NOT NULL,
  `status` enum('pending','cancel','waiting','buy','bought','ready_to_buy') DEFAULT 'waiting',
  `price` decimal(6,2) DEFAULT '0.00',
  `score_task` decimal(6,2) DEFAULT '0.00',
  `score_task_front` decimal(8,2) DEFAULT '0.00',
  `score_task_back` decimal(8,2) DEFAULT '0.00',
  `condition` varchar(191) DEFAULT NULL,
  `size_style` varchar(191) DEFAULT NULL,
  `pack` varchar(191) DEFAULT NULL,
  `color` varchar(191) DEFAULT NULL,
  `material` varchar(191) DEFAULT NULL,
  `layout_style` varchar(191) DEFAULT NULL,
  `personalization` text,
  `link` varchar(500) NOT NULL,
  -- ... các cột khác
);
```

## Bước 1: Cấu hình Database

Chạy script cấu hình:
```bash
node setup-config.js
```

Điền thông tin:
- **Host**: localhost (hoặc IP MySQL server)
- **Port**: 3306
- **Username**: tên user MySQL của bạn
- **Password**: password của user
- **Database**: tên database chứa bảng order_details
- **Table**: `order_details` (hoặc tên bảng thực tế của bạn)

## Bước 2: Logic tìm kiếm

Ứng dụng sẽ tìm kiếm theo:
- **task_code_front**: 6 ký tự đầu của mã quét
- **task_code_back**: 6 ký tự đầu của mã quét

Ví dụ: Nếu quét mã `ABC123`, sẽ tìm:
- `task_code_front LIKE 'ABC123%'`
- `task_code_back LIKE 'ABC123%'`

## Bước 3: Chạy ứng dụng

```bash
npm run dev
```

## Bước 4: Sử dụng

### Scanner:
- Quét barcode 6 ký tự
- Hoặc nhập mã thủ công
- Tìm kiếm trong `task_code_front` và `task_code_back`

### Order View:
Hiển thị thông tin:
- Task codes (front/back)
- Product name
- Quantity, Price, Status
- Scores (task/front/back)
- Condition, Size, Pack, Color, Material
- Descriptions (general/front/back)
- Personalization
- Product link

### QC Functionality:
- Pass/Fail status
- Notes được lưu vào `seller_note`
- Format: `[QC PASS/FAIL] {notes}`

## Bước 5: Test với dữ liệu thực

1. Vào **Settings** tab
2. Click **"Test Connection"** để kiểm tra kết nối
3. Click **"Create Sample Data"** để tạo dữ liệu test
4. Quét mã `ABC123` hoặc `DEF456` để test

## Troubleshooting

### Lỗi "ECONNREFUSED":
- Kiểm tra MySQL service đang chạy
- Verify host/port trong cấu hình

### Lỗi "Table not found":
- Kiểm tra tên database và bảng
- Đảm bảo user có quyền truy cập

### Không tìm thấy dữ liệu:
- Kiểm tra format của `task_code_front` và `task_code_back`
- Đảm bảo mã quét khớp với 6 ký tự đầu

### Lỗi "electronAPI not available":
- Đợi 5-10 giây để ứng dụng khởi động hoàn toàn
- Kiểm tra console log trong Developer Tools

## Cấu hình nâng cao

### Custom Status Values:
Ứng dụng hỗ trợ các status:
- `pending`, `cancel`, `waiting`
- `buy`, `bought`, `ready_to_buy`

### Notes Format:
QC notes được lưu vào `seller_note` với format:
```
[QC PASS] Customer approved design
[QC FAIL] Color mismatch detected
```

## Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console log (F12)
2. Verify database connection
3. Kiểm tra cấu trúc bảng
4. Restart ứng dụng 