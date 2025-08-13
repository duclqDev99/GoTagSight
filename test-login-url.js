const fs = require('fs');

console.log('🧪 Test URL Login để kiểm tra duplicate...\n');

// Đọc file .env
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        envVars[key.trim()] = value.trim();
    }
});

console.log('📋 Biến môi trường:');
console.log('VITE_API_BASE_URL:', envVars.VITE_API_BASE_URL);
console.log('VITE_AUTH_ENDPOINT:', envVars.VITE_AUTH_ENDPOINT);

// Test logic từ Login.tsx
const fullUrl = envVars.VITE_AUTH_ENDPOINT ||
    `${envVars.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v2/auth/login`;

console.log('\n🔗 URL Login cuối cùng:');
console.log(fullUrl);

// Kiểm tra có bị duplicate không
if (fullUrl.includes('https://production.trackingis.infohttps://production.trackingis.info')) {
    console.log('\n❌ LỖI: URL bị duplicate!');
    console.log('Cần sửa lại logic trong Login.tsx');
} else {
    console.log('\n✅ URL không bị duplicate!');
}

console.log('\n📝 Logic hiện tại:');
console.log('1. Nếu có VITE_AUTH_ENDPOINT → sử dụng trực tiếp');
console.log('2. Nếu không có → tạo từ VITE_API_BASE_URL + /api/v2/auth/login');
console.log('3. Kết quả:', fullUrl); 