# Hướng dẫn Debug - Vấn đề đăng nhập lại vẫn bị lỗi

## Vấn đề: Sau khi đăng nhập lại vẫn gặp lỗi "API returned false"

### Nguyên nhân có thể:

1. **Token không được cập nhật đúng cách trong main process**
2. **API endpoint không đúng**
3. **Cấu hình không được lưu**
4. **Token format không đúng**

## Cách Debug:

### 1. Kiểm tra Console Logs

Mở Developer Tools (F12) và xem Console để tìm các log sau:

#### Khi đăng nhập:
```
=== DEBUG: Login Success ===
Token received: [token preview]...
User data: [user data]
Token set in main process: true/false
Token saved to localStorage
```

#### Khi click "Add to Inventory":
```
=== DEBUG: Add to Inventory ===
Orders count: [number]
Current auth token: [token preview]...
Is authenticated: true/false
```

#### Khi gọi API:
```
=== DEBUG: API Configuration ===
Base URL: [url]
Update API Base URL: [url]
Auth Token exists: true/false
Auth Token length: [number]
Auth Token preview: [token preview]...
Authorization header set: Bearer [token preview]...
```

### 2. Kiểm tra Token trong Browser

```javascript
// Trong Console, gõ:
console.log('Auth Token:', localStorage.getItem('authToken'))
console.log('User:', localStorage.getItem('user'))
```

### 3. Kiểm tra Network Tab

Trong Developer Tools > Network tab:
- Tìm request đến `/api/v2/order-details/update-status-code`
- Kiểm tra Request Headers có `Authorization: Bearer [token]`
- Kiểm tra Response status và data

### 4. Test Token với curl

```bash
# Thay YOUR_TOKEN bằng token từ localStorage
curl -X 'POST' 'http://localhost:8000/api/v2/order-details/update-status-code' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'X-CSRF-TOKEN: ' \
  -d '{
    "status_code_string": "C1F1R1P1E1V1I0",
    "ids": [502567]
  }'
```

## Các bước khắc phục:

### Bước 1: Kiểm tra Token
1. Mở Developer Tools (F12)
2. Vào Console
3. Gõ: `localStorage.getItem('authToken')`
4. Copy token và test với curl

### Bước 2: Kiểm tra API Endpoint
1. Kiểm tra file `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

2. Test endpoint:
   ```bash
   curl -X GET 'http://localhost:8000/api/v2/order-details/update-status-code'
   ```

### Bước 3: Restart Application
1. Dừng development server (Ctrl+C)
2. Xóa cache:
   ```bash
   rm -rf node_modules/.cache
   rm -rf dist
   ```
3. Restart:
   ```bash
   npm run dev
   ```

### Bước 4: Clear Browser Data
1. Mở Developer Tools (F12)
2. Vào Application tab
3. Clear Storage > Clear site data
4. Refresh page

### Bước 5: Kiểm tra Main Process
1. Kiểm tra logs trong terminal chạy `npm run dev`
2. Tìm logs về token setting
3. Kiểm tra IPC communication

## Auto-fix Features đã thêm:

### 1. Detailed Logging
- Logs chi tiết cho mọi bước
- Token validation
- API call details
- Error analysis

### 2. Token Validation
- Kiểm tra token trước khi gọi API
- Auto-logout khi token hết hạn
- Clear error messages

### 3. Error Handling
- Phân loại lỗi cụ thể
- Hướng dẫn khắc phục
- Auto-retry cho một số lỗi

## Troubleshooting Checklist:

- [ ] Token có tồn tại trong localStorage?
- [ ] Token có được set trong main process?
- [ ] API endpoint có đúng không?
- [ ] Server có đang chạy không?
- [ ] Token có hợp lệ không?
- [ ] Có lỗi network không?
- [ ] Có lỗi CORS không?

## Next Steps:

1. **Implement token refresh**: Tự động refresh token
2. **Add health check**: Kiểm tra API health
3. **Improve error recovery**: Tự động khôi phục từ lỗi
4. **Add retry mechanism**: Tự động thử lại khi fail

## Contact Support:

Nếu vẫn gặp vấn đề, hãy cung cấp:
1. Console logs đầy đủ
2. Network tab screenshots
3. Error messages
4. Steps to reproduce 