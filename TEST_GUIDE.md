# 🧪 Hướng dẫn Test GoTagSight

## ✅ Cấu hình đã hoàn thành:
- **Database**: production
- **Table**: order_details  
- **User**: root
- **Host**: 127.0.0.1:3306

## 🚀 Ứng dụng đang chạy:
- **Vite Server**: http://localhost:3000
- **Electron App**: Đã khởi động

## 📋 Các bước test:

### 1. Mở ứng dụng
- Ứng dụng Electron sẽ tự động mở
- Nếu không, mở browser và truy cập: http://localhost:3000

### 2. Test Database Connection
1. Vào tab **Settings**
2. Click **"Test Connection"**
3. Kết quả mong đợi: ✅ Connection successful!

### 3. Tạo Sample Data
1. Trong tab **Settings**
2. Click **"Create Sample Data"**
3. Kết quả mong đợi: ✅ Sample data created successfully!

### 4. Test Scanner
1. Vào tab **Scanner**
2. Nhập mã test: `ABC123` hoặc `DEF456`
3. Click **"Search"**
4. Kết quả mong đợi: Hiển thị thông tin sản phẩm

### 5. Test Order View
1. Sau khi search thành công, chuyển sang tab **Order View**
2. Kiểm tra thông tin hiển thị:
   - Task codes (front/back)
   - Product name
   - Quantity, Price, Status
   - Scores
   - Descriptions
   - Product link

### 6. Test QC Functionality
1. Trong **Order View**
2. Nhập notes: "Test QC notes"
3. Click **"Pass"** hoặc **"Fail"**
4. Kiểm tra status được cập nhật

## 🔍 Troubleshooting:

### Nếu "Test Connection" thất bại:
- Kiểm tra MySQL service: `brew services list | grep mysql`
- Restart MySQL: `brew services restart mysql`

### Nếu không tìm thấy dữ liệu:
- Kiểm tra bảng có dữ liệu: 
  ```sql
  mysql -u root -p -e "USE production; SELECT task_code_front, product_name_new FROM order_details LIMIT 5;"
  ```

### Nếu ứng dụng không load:
- Kiểm tra Vite server: http://localhost:3000
- Restart ứng dụng: `npm run dev`

## 📊 Dữ liệu test:
- **ABC123**: iPhone 15 Pro Custom Case
- **DEF456**: MacBook Air M2 Custom Sleeve

## 🎯 Kết quả mong đợi:
- ✅ Database connection thành công
- ✅ Sample data được tạo
- ✅ Scanner tìm thấy sản phẩm
- ✅ Order View hiển thị đầy đủ thông tin
- ✅ QC functionality hoạt động
- ✅ Notes được lưu vào seller_note 