const fs = require('fs');
const path = require('path');

console.log('🔄 Cập nhật cấu hình sang Production...\n');

// Cấu hình production
const productionConfig = {
    VITE_API_BASE_URL: 'https://production.trackingis.info',
    VITE_MEILI_BASE_URL: 'http://103.139.203.10:7700',
    VITE_MEILI_API_KEY: 'cbf33c1c50e471743a3212352244936d4cd4841f781506d19cc9c1a66ccb691e',
    VITE_AUTH_ENDPOINT: 'https://production.trackingis.info/api/v2/auth/login',
    NODE_ENV: 'production'
};

// Tạo file .env.local (sẽ được ưu tiên hơn .env)
const envContent = Object.entries(productionConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

try {
    fs.writeFileSync('.env.local', envContent);
    console.log('✅ Đã tạo file .env.local với cấu hình production');
    console.log('📁 File: .env.local');
    console.log('\n📋 Nội dung:');
    console.log(envContent);

    console.log('\n🔧 Bây giờ bạn cần:');
    console.log('1. Build lại ứng dụng: npm run build');
    console.log('2. Build Windows: npm run dist:win');
    console.log('3. File .exe mới sẽ sử dụng production API');

    console.log('\n⚠️ Lưu ý:');
    console.log('- File .exe cũ vẫn sẽ sử dụng localhost:8000');
    console.log('- Chỉ file .exe mới build mới sử dụng production API');
    console.log('- Không thể thay đổi cấu hình sau khi đã build .exe');

} catch (error) {
    console.error('❌ Lỗi khi tạo file:', error.message);
}

console.log('\n📚 Hướng dẫn chi tiết:');
console.log('1. File .env.local sẽ được ưu tiên hơn .env');
console.log('2. Các biến môi trường sẽ được nhúng vào code khi build');
console.log('3. Sau khi build, ứng dụng sẽ sử dụng production API');
console.log('4. Để thay đổi sau khi build, cần build lại hoàn toàn'); 