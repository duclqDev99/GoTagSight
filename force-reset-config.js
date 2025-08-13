const fs = require('fs');
const path = require('path');
const { app } = require('electron');

console.log('=== Force Reset Configuration ===\n');

// Step 1: Find config file location
console.log('1. Finding config file location...');

// Get user data path (similar to Electron app)
const userDataPath = process.platform === 'darwin'
    ? path.join(process.env.HOME, 'Library/Application Support/GoTagSight')
    : process.platform === 'win32'
        ? path.join(process.env.APPDATA, 'GoTagSight')
        : path.join(process.env.HOME, '.config/GoTagSight');

const configPath = path.join(userDataPath, 'config.encrypted');
const configPathAlt = path.join(process.cwd(), 'config.encrypted');

console.log('User data path:', userDataPath);
console.log('Config path:', configPath);
console.log('Alternative config path:', configPathAlt);

// Step 2: Check if config files exist
console.log('\n2. Checking existing config files...');

const configFiles = [configPath, configPathAlt];
let foundConfigs = [];

configFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        foundConfigs.push(filePath);
        console.log('✅ Found config:', filePath);

        // Show file size
        const stats = fs.statSync(filePath);
        console.log(`   Size: ${stats.size} bytes`);
        console.log(`   Modified: ${stats.mtime}`);
    }
});

if (foundConfigs.length === 0) {
    console.log('❌ No config files found');
} else {
    console.log(`\nFound ${foundConfigs.length} config file(s)`);
}

// Step 3: Generate force reset script
console.log('\n3. Generating force reset script...');

const forceResetScript = `
// Force Reset Configuration Script - Copy to Console
(function() {
    console.log('=== Force Reset Configuration ===');
    
    // Step 1: Clear localStorage completely
    console.log('1. Clearing localStorage...');
    localStorage.clear();
    console.log('✅ localStorage cleared');
    
    // Step 2: Force reload to reset main process
    console.log('2. Force reloading application...');
    window.location.reload();
})();
`;

console.log(forceResetScript);

// Step 4: Generate manual config deletion commands
console.log('\n4. Manual config deletion commands:');
console.log('Run these commands in terminal to delete config files:');

foundConfigs.forEach(filePath => {
    console.log(`rm -f "${filePath}"`);
});

// Step 5: Generate complete reset script
console.log('\n5. Complete reset script for console:');

const completeResetScript = `
// Complete Reset Script - Copy to Console
(function() {
    console.log('=== Complete Configuration Reset ===');
    
    // Step 1: Clear all localStorage
    console.log('1. Clearing localStorage...');
    localStorage.clear();
    console.log('✅ localStorage cleared');
    
    // Step 2: Clear specific items
    console.log('2. Clearing specific items...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('config');
    console.log('✅ Specific items cleared');
    
    // Step 3: Force reload
    console.log('3. Force reloading...');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
})();
`;

console.log(completeResetScript);

// Step 6: Instructions
console.log('\n=== Hướng dẫn Force Reset ===');
console.log('1. Dừng development server (Ctrl+C)');
console.log('2. Xóa config files cũ:');
foundConfigs.forEach(filePath => {
    console.log(`   rm -f "${filePath}"`);
});
console.log('3. Restart server:');
console.log('   npm run build:main');
console.log('   npm run dev');
console.log('4. Mở ứng dụng Electron');
console.log('5. Mở Developer Tools (F12)');
console.log('6. Copy script từ phần 5 (Complete Reset Script)');
console.log('7. Paste vào Console và Enter');
console.log('8. Ứng dụng sẽ reload với cấu hình mới');
console.log('9. Đăng nhập lại');
console.log('10. Test "Add to Inventory"');

// Step 7: Save scripts to files
fs.writeFileSync('force-reset-script.js', forceResetScript);
fs.writeFileSync('complete-reset-script.js', completeResetScript);

console.log('\n✅ Đã tạo files:');
console.log('   - force-reset-script.js');
console.log('   - complete-reset-script.js');

console.log('\n=== Expected Result ===');
console.log('After reset, API should use: http://localhost:8000');
console.log('Config will be recreated from .env file');
console.log('Old cached config will be completely removed'); 