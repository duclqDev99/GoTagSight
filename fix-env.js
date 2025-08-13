const fs = require('fs');

console.log('🔧 Sửa lại file .env với cấu hình đúng...\n');

// Cấu hình production đúng
const envContent = `# Production API Configuration
VITE_API_BASE_URL=https://production.trackingis.info
VITE_MEILI_BASE_URL=http://103.139.203.10:7700
VITE_MEILI_API_KEY=cbf33c1c50e471743a3212352244936d4cd4841f781506d19cc9c1a66ccb691e
VITE_AUTH_ENDPOINT=https://production.trackingis.info/api/v2/auth/login
NODE_ENV=production`;

try {
    // Tạo file .env với nội dung đúng
    fs.writeFileSync('.env', envContent);

    console.log('✅ Đã tạo lại file .env với cấu hình đúng');
    console.log('📁 File: .env');

    console.log('\n📋 Nội dung .env:');
    console.log(envContent);

    console.log('\n🔍 Kiểm tra file:');
    const checkContent = fs.readFileSync('.env', 'utf8');
    console.log('File length:', checkContent.length);
    console.log('Last 10 chars:', checkContent.slice(-10));

    console.log('\n🔧 Bây giờ bạn có thể:');
    console.log('1. Build lại ứng dụng: npm run build');
    console.log('2. Build Windows: npm run dist:win');

} catch (error) {
    console.error('❌ Lỗi khi tạo file:', error.message);
} 