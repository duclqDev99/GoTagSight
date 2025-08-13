# Hướng dẫn sử dụng hệ thống Authentication

## Tổng quan

Hệ thống GoTagSight đã được tích hợp authentication để bảo mật ứng dụng. Người dùng phải đăng nhập trước khi có thể sử dụng các tính năng của ứng dụng.

## Cấu hình môi trường

### 1. File .env

Tạo file `.env` trong thư mục gốc của dự án:

```env
# Environment Configuration
NODE_ENV=development

# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=v2
VITE_AUTH_ENDPOINT=/api/v2/auth/login

# Production Environment (uncomment when deploying)
# NODE_ENV=production
# VITE_API_BASE_URL=https://your-production-domain.com
# VITE_API_VERSION=v2
# VITE_AUTH_ENDPOINT=/api/v2/auth/login
```

### 2. Cấu hình cho Production

Khi deploy lên production, cập nhật file `.env`:

```env
NODE_ENV=production
VITE_API_BASE_URL=https://your-production-domain.com
VITE_API_VERSION=v2
VITE_AUTH_ENDPOINT=/api/v2/auth/login
```

## API Authentication

### Endpoint đăng nhập

```
POST /api/v2/auth/login
Content-Type: application/json
X-CSRF-TOKEN: 

{
  "email": "user@example.com",
  "password": "password"
}
```

### Response thành công

```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

## Tính năng Authentication

### 1. Form đăng nhập

- **Email**: Nhập email đăng nhập
- **Password**: Nhập mật khẩu
- **Validation**: Kiểm tra đầy đủ thông tin trước khi submit
- **Loading state**: Hiển thị spinner khi đang đăng nhập
- **Error handling**: Hiển thị lỗi nếu đăng nhập thất bại

### 2. Token Management

- **Auto-save**: Token được lưu vào localStorage
- **Auto-load**: Tự động load token khi khởi động ứng dụng
- **Auto-clear**: Xóa token khi đăng xuất
- **Main process sync**: Đồng bộ token với main process

### 3. Protected Routes

- **Login required**: Phải đăng nhập mới vào được app
- **Auto-redirect**: Tự động chuyển về login nếu chưa authenticated
- **Session persistence**: Duy trì session qua các lần khởi động

### 4. Logout

- **Logout button**: Nút đăng xuất ở header
- **Clear session**: Xóa token và user data
- **Redirect**: Chuyển về màn hình login

## Cách sử dụng

### 1. Khởi động ứng dụng

```bash
npm run dev
```

### 2. Đăng nhập

1. Mở ứng dụng
2. Nhập email và password
3. Click "Đăng nhập"
4. Nếu thành công, sẽ vào được main app

### 3. Sử dụng app

- Tất cả tính năng chỉ hoạt động sau khi đăng nhập
- Token được tự động gửi với mọi API request
- Session được duy trì cho đến khi logout

### 4. Đăng xuất

1. Click nút "🚪 Logout" ở header
2. Ứng dụng sẽ chuyển về màn hình login
3. Token và session bị xóa

## Troubleshooting

### Lỗi đăng nhập

1. **Kiểm tra API endpoint**: Đảm bảo URL trong `.env` đúng
2. **Kiểm tra credentials**: Email và password phải chính xác
3. **Kiểm tra network**: Đảm bảo có thể kết nối đến server
4. **Kiểm tra CORS**: Server phải cho phép CORS từ localhost

### Lỗi token

1. **Token expired**: Đăng nhập lại
2. **Invalid token**: Clear localStorage và đăng nhập lại
3. **Network error**: Kiểm tra kết nối mạng

### Lỗi production

1. **HTTPS required**: Production phải dùng HTTPS
2. **Domain mismatch**: Đảm bảo domain trong `.env` đúng
3. **CORS policy**: Server phải cho phép domain của bạn

## Security Notes

- Token được lưu trong localStorage (có thể bị XSS)
- Sử dụng HTTPS trong production
- Implement token refresh nếu cần
- Logout khi không sử dụng
- Clear sensitive data khi logout

## Development

### Thêm authentication cho API mới

1. API service đã tự động gửi token với mọi request
2. Token được set qua `apiService.setAuthToken(token)`
3. Không cần thêm code gì thêm

### Customize login form

1. Edit `src/renderer/components/Login.tsx`
2. Edit `src/renderer/components/Login.css`
3. Thêm validation rules nếu cần

### Customize authentication logic

1. Edit `src/renderer/App.tsx` - authentication handlers
2. Edit `src/main/api.ts` - API service
3. Edit `src/main/main.ts` - IPC handlers 