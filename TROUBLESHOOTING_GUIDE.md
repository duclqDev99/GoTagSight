# Hướng dẫn Troubleshooting - Add to Inventory API

## Vấn đề: "Failed to add orders to inventory - API returned false"

### Nguyên nhân phổ biến:

1. **Token hết hạn hoặc không hợp lệ** (Phổ biến nhất)
2. **API endpoint không đúng**
3. **Server không phản hồi**
4. **Dữ liệu request không đúng format**

## Cách khắc phục:

### 1. Kiểm tra Token Authentication

#### Triệu chứng:
- Error message: "Token không hợp lệ hoặc đã hết hạn"
- HTTP Status: 401
- Response: `{ message: 'Invalid token' }`

#### Giải pháp:
1. **Đăng nhập lại**:
   - Click nút "Logout" 
   - Đăng nhập lại với tài khoản hợp lệ
   - Kiểm tra token mới trong localStorage

2. **Kiểm tra token trong browser**:
   ```javascript
   // Mở Developer Tools (F12)
   // Trong Console, gõ:
   localStorage.getItem('authToken')
   ```

3. **Test token với curl**:
   ```bash
   curl -X 'POST' 'http://localhost:8000/api/v2/order-details/update-status-code' \
     -H 'accept: application/json' \
     -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
     -H 'Content-Type: application/json' \
     -H 'X-CSRF-TOKEN: ' \
     -d '{
       "status_code_string": "C1F1R1P1E1V1I0",
       "ids": [502567]
     }'
   ```

### 2. Kiểm tra API Endpoint

#### Triệu chứng:
- HTTP Status: 404
- Error message: "API endpoint không tồn tại"

#### Giải pháp:
1. **Kiểm tra URL trong .env**:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

2. **Test endpoint trực tiếp**:
   ```bash
   curl -X GET 'http://localhost:8000/api/v2/order-details/update-status-code'
   ```

### 3. Kiểm tra Server Status

#### Triệu chứng:
- HTTP Status: 500, 502, 503
- Error message: "Lỗi server"

#### Giải pháp:
1. **Kiểm tra server có đang chạy không**
2. **Kiểm tra logs của server**
3. **Restart server nếu cần**

### 4. Kiểm tra Request Data

#### Triệu chứng:
- HTTP Status: 422 (Validation Error)
- Error message: "Dữ liệu không hợp lệ"

#### Giải pháp:
1. **Kiểm tra format của request**:
   ```json
   {
     "status_code_string": "C1F1R1P1E1V1I0",
     "ids": [502567, 502473, 502552]
   }
   ```

2. **Kiểm tra IDs có tồn tại không**

## Debug Steps:

### 1. Kiểm tra Console Logs
Mở Developer Tools (F12) và xem Console để tìm:
- Request details
- Response details
- Error messages

### 2. Sử dụng Test Script
Chạy test script để kiểm tra API:
```bash
node test-api.js
```

### 3. Kiểm tra Network Tab
Trong Developer Tools > Network tab:
- Xem request headers
- Xem response data
- Xem HTTP status codes

## Auto-fix Features:

### 1. Tự động Logout khi Token hết hạn
- Hệ thống sẽ tự động logout sau 2 giây khi phát hiện token hết hạn
- User sẽ được yêu cầu đăng nhập lại

### 2. Detailed Error Messages
- Thông báo lỗi cụ thể cho từng loại lỗi
- Hướng dẫn khắc phục cho user

### 3. Logging chi tiết
- Logs chi tiết trong console để debug
- Response analysis để xác định nguyên nhân

## Prevention:

### 1. Token Management
- Kiểm tra token validity trước khi gọi API
- Implement token refresh mechanism
- Auto-logout khi token hết hạn

### 2. Error Handling
- Implement retry mechanism cho network errors
- Graceful degradation khi API không khả dụng
- User-friendly error messages

### 3. Monitoring
- Monitor API response times
- Track error rates
- Alert khi có vấn đề với API

## Next Steps:

1. **Implement token refresh**: Tự động refresh token khi sắp hết hạn
2. **Add retry mechanism**: Tự động thử lại khi có lỗi network
3. **Improve error reporting**: Gửi error reports về server để phân tích
4. **Add health checks**: Kiểm tra API health định kỳ 