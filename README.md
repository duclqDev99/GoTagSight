# GoTagSight

Ứng dụng desktop cross-platform cho barcode scanning và quản lý inventory với tích hợp BarTender.

## Tính năng chính

- 🔍 **Barcode Scanning**: Quét mã vạch 6 ký tự qua webcam
- 📊 **Database Integration**: Kết nối MySQL để tìm kiếm thông tin đơn hàng
- 🖼️ **Image Display**: Hiển thị ảnh sản phẩm từ thư mục local
- 📄 **Multi-format Support**: Hỗ trợ PNG, JPG, PDF, AI files
- 📦 **Inventory Management**: Quản lý trạng thái đơn hàng và nhập kho
- 🖨️ **BarTender Integration**: Tích hợp với BarTender để in mã vạch
- 📈 **Excel Export**: Export dữ liệu ra file Excel (.xlsx)
- 💾 **Data Persistence**: Lưu trữ dữ liệu quét trong localStorage
- 🎨 **Modern UI**: Giao diện hiện đại và responsive

## Cài đặt nhanh

### Windows
```bash
# Chạy script setup tự động
setup-windows.bat
```

### macOS
```bash
# Chạy script setup tự động
./setup-macos.sh
```

### Manual Setup
```bash
# Cài đặt dependencies
npm install

# Setup configuration
npm run setup

# Chạy ứng dụng
npm run dev
```

## Cấu hình

### Database
- MySQL Server 8.0+
- Database: `production`
- Table: `order_details`

### Image Path
- Cấu hình đường dẫn thư mục chứa ảnh sản phẩm
- Hỗ trợ: PNG, JPG, PDF, AI

### BarTender Integration
- **Excel Export**: Export dữ liệu ra file Excel
- **File System**: Ghi dữ liệu vào file JSON
- **Named Pipes**: Kết nối trực tiếp với BarTender (Windows)
- **HTTP/HTTPS**: Giao tiếp qua web API

## Sử dụng

1. **Quét barcode**: Nhập mã 6 ký tự hoặc sử dụng webcam
2. **Xem thông tin**: Hiển thị chi tiết đơn hàng và ảnh sản phẩm
3. **Quản lý inventory**: Thêm đơn hàng vào kho với button "Add to Inventory"
4. **Export Excel**: Tự động export dữ liệu khi quét (nếu bật BarTender)

## Cấu trúc dự án

```
GoTagSight/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── main.ts          # Main entry point
│   │   ├── database.ts      # Database operations
│   │   ├── config.ts        # Configuration management
│   │   └── barTenderIntegration.ts  # BarTender integration
│   └── renderer/            # React renderer process
│       ├── App.tsx          # Main React component
│       ├── components/      # React components
│       └── App.css          # Styles
├── dist/                    # Build output
├── setup-windows.bat        # Windows setup script
├── setup-macos.sh           # macOS setup script
├── SETUP.md                 # Detailed setup guide
└── README.md               # This file
```

## Scripts

```bash
npm run dev          # Development mode
npm run build        # Build production
npm run start        # Run production
npm run setup        # Setup configuration
npm run dist         # Build distribution
```

## Yêu cầu hệ thống

- **Node.js**: 16.0.0+
- **MySQL**: 8.0+
- **ImageMagick**: (cho PDF/AI support)
- **OS**: Windows 10/11, macOS 10.15+

## Troubleshooting

Xem [SETUP.md](SETUP.md) để biết thêm chi tiết về cài đặt và xử lý lỗi.

## License

MIT License

## Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Log trong terminal
2. Console trong DevTools
3. File config
4. Database connection
5. File permissions 