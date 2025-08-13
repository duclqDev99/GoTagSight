const fs = require('fs');
const path = require('path');

console.log('=== Debug Application Configuration ===\n');

// Kiểm tra file .env
console.log('1. Kiểm tra file .env:');
try {
    if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf8');
        console.log('✅ File .env tồn tại');
        console.log('Nội dung:', envContent);
    } else {
        console.log('❌ File .env không tồn tại');
    }
} catch (error) {
    console.log('❌ Lỗi đọc file .env:', error.message);
}

console.log('\n2. Kiểm tra package.json:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log('✅ Package.json tồn tại');
    console.log('Scripts:', Object.keys(packageJson.scripts));
} catch (error) {
    console.log('❌ Lỗi đọc package.json:', error.message);
}

console.log('\n3. Kiểm tra cấu trúc thư mục:');
try {
    const srcMain = fs.existsSync('src/main');
    const srcRenderer = fs.existsSync('src/renderer');
    console.log('✅ src/main:', srcMain);
    console.log('✅ src/renderer:', srcRenderer);

    if (srcMain) {
        const mainFiles = fs.readdirSync('src/main');
        console.log('Files in src/main:', mainFiles);
    }

    if (srcRenderer) {
        const rendererFiles = fs.readdirSync('src/renderer');
        console.log('Files in src/renderer:', rendererFiles);
    }
} catch (error) {
    console.log('❌ Lỗi kiểm tra thư mục:', error.message);
}

console.log('\n4. Kiểm tra file cấu hình:');
try {
    const configFiles = ['setup-config.js', 'vite.config.ts', 'tsconfig.json'];
    configFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} tồn tại`);
            try {
                const content = fs.readFileSync(file, 'utf8');
                console.log(`   Nội dung ${file}:`, content.substring(0, 200) + '...');
            } catch (e) {
                console.log(`   Không thể đọc nội dung ${file}`);
            }
        } else {
            console.log(`❌ ${file} không tồn tại`);
        }
    });
} catch (error) {
    console.log('❌ Lỗi kiểm tra file cấu hình:', error.message);
}

console.log('\n5. Hướng dẫn debug:');
console.log('Để debug vấn đề "API returned false":');
console.log('1. Mở Developer Tools (F12) trong ứng dụng');
console.log('2. Vào Console tab');
console.log('3. Tìm logs bắt đầu với "=== DEBUG:"');
console.log('4. Kiểm tra token trong localStorage:');
console.log('   localStorage.getItem("authToken")');
console.log('5. So sánh token với token mới: w5K9NTqkwgfYLoTuCYGphFZxUbXYDpPtaBPprOnXAcxAiISPu9slTJ9NTvSx');
console.log('6. Kiểm tra baseURL trong cấu hình');
console.log('7. Restart ứng dụng nếu cần');

console.log('\n6. Các bước khắc phục:');
console.log('1. Clear localStorage và đăng nhập lại');
console.log('2. Kiểm tra file .env có đúng baseURL không');
console.log('3. Restart development server');
console.log('4. Kiểm tra console logs chi tiết'); 