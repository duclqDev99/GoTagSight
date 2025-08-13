const fs = require('fs');
const path = require('path');

console.log('=== Fix Token Issue ===\n');

// Token mới từ user
const NEW_TOKEN = 'w5K9NTqkwgfYLoTuCYGphFZxUbXYDpPtaBPprOnXAcxAiISPu9slTJ9NTvSx';

console.log('Token mới:', NEW_TOKEN.substring(0, 20) + '...');

// Hướng dẫn cập nhật token
console.log('\n=== Hướng dẫn cập nhật token ===');
console.log('1. Mở ứng dụng Electron');
console.log('2. Mở Developer Tools (F12)');
console.log('3. Vào Console tab');
console.log('4. Chạy các lệnh sau:');

console.log('\n// Xóa token cũ');
console.log('localStorage.removeItem("authToken");');
console.log('localStorage.removeItem("user");');

console.log('\n// Đặt token mới');
console.log(`localStorage.setItem("authToken", "${NEW_TOKEN}");`);
console.log('localStorage.setItem("user", JSON.stringify({name: "User", email: "user@example.com"}));');

console.log('\n// Kiểm tra token');
console.log('console.log("Auth Token:", localStorage.getItem("authToken"));');
console.log('console.log("User:", localStorage.getItem("user"));');

console.log('\n// Refresh trang');
console.log('window.location.reload();');

console.log('\n=== Hoặc sử dụng script tự động ===');
console.log('Chạy lệnh sau trong Console:');

const autoScript = `
// Auto fix token script
(function() {
    console.log('=== Auto Fix Token ===');
    
    // Xóa token cũ
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    console.log('✅ Đã xóa token cũ');
    
    // Đặt token mới
    localStorage.setItem("authToken", "${NEW_TOKEN}");
    localStorage.setItem("user", JSON.stringify({
        name: "User", 
        email: "user@example.com"
    }));
    console.log('✅ Đã đặt token mới');
    
    // Kiểm tra
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("user");
    console.log('Token mới:', token ? token.substring(0, 20) + '...' : 'null');
    console.log('User:', user);
    
    // Refresh trang
    console.log('🔄 Đang refresh trang...');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
})();
`;

console.log(autoScript);

console.log('\n=== Kiểm tra sau khi cập nhật ===');
console.log('1. Sau khi refresh, kiểm tra console logs');
console.log('2. Tìm logs "=== DEBUG: Login Success ==="');
console.log('3. Kiểm tra token có được set trong main process không');
console.log('4. Thử click "Add to Inventory" và xem logs');

console.log('\n=== Nếu vẫn lỗi ===');
console.log('1. Restart development server:');
console.log('   Ctrl+C (dừng server)');
console.log('   npm run dev (restart)');
console.log('2. Clear browser cache');
console.log('3. Kiểm tra file .env có đúng không');
console.log('4. Kiểm tra console logs chi tiết');

// Tạo file script để copy-paste
const scriptContent = `// Copy và paste script này vào Console của Developer Tools
${autoScript}`;

fs.writeFileSync('fix-token-script.js', scriptContent);
console.log('\n✅ Đã tạo file fix-token-script.js');
console.log('Mở file này và copy script vào Console'); 