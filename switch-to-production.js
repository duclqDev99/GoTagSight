const fs = require('fs');
const path = require('path');

console.log('🔄 Chuyển đổi cấu hình sang Production...\n');

// Cấu hình production
const productionConfig = {
    VITE_API_BASE_URL: 'https://production.trackingis.info',
    VITE_MEILI_BASE_URL: 'http://103.139.203.10:7700',
    VITE_MEILI_API_KEY: 'cbf33c1c50e471743a3212352244936d4cd4841f781506d19cc9c1a66ccb691e',
    VITE_AUTH_ENDPOINT: 'https://production.trackingis.info/api/v2/auth/login',
    NODE_ENV: 'production'
};

// Tạo file .env
const envContent = Object.entries(productionConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

try {
    // Tạo file .env
    fs.writeFileSync('.env', envContent);
    console.log('✅ Đã tạo file .env với cấu hình production');
    console.log('📁 File: .env');

    console.log('\n📋 Nội dung .env:');
    console.log(envContent);

    console.log('\n🔧 Bây giờ bạn cần:');
    console.log('1. Build lại ứng dụng: npm run build');
    console.log('2. Build Windows: npm run dist:win');
    console.log('3. File .exe mới sẽ sử dụng production API');

    console.log('\n⚠️ Lưu ý quan trọng:');
    console.log('- File .exe cũ vẫn sẽ sử dụng localhost:8000');
    console.log('- Chỉ file .exe mới build mới sử dụng production API');
    console.log('- Không thể thay đổi cấu hình sau khi đã build .exe');

    console.log('\n📚 Quy trình hoàn chỉnh:');
    console.log('1. Chạy script này để tạo .env');
    console.log('2. Build lại ứng dụng');
    console.log('3. Build Windows installer');
    console.log('4. Cài đặt .exe mới');
    console.log('5. Ứng dụng sẽ sử dụng production API');

} catch (error) {
    console.error('❌ Lỗi khi tạo file:', error.message);
}

console.log('\n🎯 Tóm tắt:');
console.log('✅ Sửa .env → Build lại → .exe mới sử dụng production');
console.log('❌ Không thể sửa sau khi đã build .exe'); 