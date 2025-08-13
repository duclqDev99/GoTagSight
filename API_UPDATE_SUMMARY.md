# API Update Summary - Add to Inventory Button

## Tổng quan
Đã cập nhật button "Add to Inventory" để sử dụng API endpoint mới thay vì gọi API riêng lẻ cho từng order.

## Thay đổi API Endpoint

### API Cũ
- **Endpoint**: `/orders/{orderId}/status-code`
- **Method**: PUT
- **Request**: Gọi riêng lẻ cho từng order
- **Body**: `{ "status_code_string": "C1F1R1P1E1V1I0" }`

### API Mới
- **Endpoint**: `/api/v2/order-details/update-status-code`
- **Method**: POST
- **Request**: Gọi một lần cho tất cả orders
- **Body**: 
```json
{
  "status_code_string": "C1F1R1P1E1V1I0",
  "ids": [502424, 502473, 502552]
}
```

## Files đã cập nhật

### 1. `src/main/api.ts`
- Thêm method `updateOrderStatusCodes(ids: number[], statusCodeString: string)`
- Sử dụng endpoint mới `/api/v2/order-details/update-status-code`
- Hỗ trợ gửi nhiều IDs cùng lúc
- Thêm headers `X-CSRF-TOKEN: ''` theo yêu cầu API

### 2. `src/main/main.ts`
- Thêm IPC handler `update-order-status-codes`
- Xử lý request từ renderer process
- Tạo ApiService instance nếu chưa có

### 3. `src/main/preload.ts`
- Thêm `updateOrderStatusCodes` vào contextBridge
- Expose method cho renderer process

### 4. `src/renderer/types.d.ts`
- Thêm type definition cho `updateOrderStatusCodes`
- Đảm bảo TypeScript compatibility

### 5. `src/renderer/App.tsx`
- Cập nhật function `handleAddToInventory`
- Thay đổi từ loop gọi API riêng lẻ thành gọi API một lần với tất cả IDs
- Cải thiện performance và user experience

## Lợi ích

1. **Performance**: Giảm số lượng API calls từ N xuống 1
2. **Efficiency**: Xử lý batch thay vì individual updates
3. **User Experience**: Phản hồi nhanh hơn cho user
4. **Network**: Giảm overhead network

## Cách sử dụng

1. Scan các barcode để thêm orders vào danh sách
2. Click button "📦 Add to Inventory"
3. Hệ thống sẽ gọi API mới với tất cả order IDs
4. Nếu thành công, danh sách sẽ được clear và hiển thị thông báo thành công

## Testing

Để test API mới:
1. Build ứng dụng: `npm run build`
2. Khởi động development server: `npm run dev`
3. Scan một số barcode
4. Click "Add to Inventory"
5. Kiểm tra console logs để xem API calls

## Debug Information

API sẽ log thông tin debug:
- Endpoint được gọi
- IDs được gửi
- Status code string
- Response từ server 