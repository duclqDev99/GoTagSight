const fs = require('fs');
const path = require('path');

console.log('=== Fix API Configuration ===\n');

// Step 1: Check .env file
console.log('1. Checking .env file...');
const envPath = path.join(process.cwd(), '.env');

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ .env file exists');
    console.log('Content:', envContent);

    // Parse VITE_API_BASE_URL
    const lines = envContent.split('\n');
    let apiBaseUrl = '';

    lines.forEach(line => {
        if (line.startsWith('VITE_API_BASE_URL=')) {
            apiBaseUrl = line.split('=')[1];
        }
    });

    console.log('VITE_API_BASE_URL:', apiBaseUrl);
} else {
    console.error('❌ .env file not found');
}

// Step 2: Generate reset script
console.log('\n2. Generating API config reset script...');

const resetScript = `
// API Config Reset Script - Copy to Console
(function() {
    console.log('=== Reset API Configuration ===');
    
    // Clear existing API config
    if (window.electronAPI && window.electronAPI.setConfig) {
        const resetConfig = {
            apiConfig: {
                baseURL: 'http://localhost:8000',
                timeout: 10000,
                username: '',
                password: '',
                apiKey: '',
                environment: 'development',
                environmentUrls: {
                    development: 'http://localhost:8000',
                    staging: '',
                    production: '',
                    custom: ''
                },
                updateApiBaseURL: 'http://localhost:8000',
                updateApiKey: ''
            }
        };
        
        window.electronAPI.setConfig(resetConfig).then(success => {
            console.log('✅ API config reset:', success);
            
            // Get fresh token
            fetch('http://localhost:8000/api/v2/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: 'minhn.it@isuccesscorp.com',
                    password: 'success88'
                })
            })
            .then(response => response.json())
            .then(data => {
                const token = data.token || data.access_token || data.accessToken || data.data?.token;
                const user = data.user || data.data?.user || data.data || {};
                
                console.log('✅ Fresh token obtained:', token ? token.substring(0, 20) + '...' : 'null');
                
                if (token) {
                    // Clear old data
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("user");
                    
                    // Set new data
                    localStorage.setItem("authToken", token);
                    localStorage.setItem("user", JSON.stringify(user));
                    
                    console.log('✅ Token updated');
                    
                    // Set token in main process
                    if (window.electronAPI && window.electronAPI.setAuthToken) {
                        window.electronAPI.setAuthToken(token).then(success => {
                            console.log('✅ Token set in main process:', success);
                            setTimeout(() => window.location.reload(), 1000);
                        });
                    } else {
                        setTimeout(() => window.location.reload(), 1000);
                    }
                }
            })
            .catch(error => {
                console.error('❌ Login failed:', error);
            });
        });
    } else {
        console.error('❌ Electron API not available');
    }
})();
`;

console.log(resetScript);

// Step 3: Save to file
fs.writeFileSync('reset-api-config.js', resetScript);
console.log('\n✅ Đã tạo file reset-api-config.js');

// Step 4: Instructions
console.log('\n=== Hướng dẫn sử dụng ===');
console.log('1. Restart development server:');
console.log('   Ctrl+C (dừng server)');
console.log('   npm run build:main');
console.log('   npm run dev');
console.log('2. Mở ứng dụng Electron');
console.log('3. Mở Developer Tools (F12)');
console.log('4. Copy script từ file reset-api-config.js');
console.log('5. Paste vào Console và Enter');
console.log('6. Script sẽ:');
console.log('   - Reset API config với baseURL đúng');
console.log('   - Lấy token mới');
console.log('   - Cập nhật localStorage');
console.log('   - Set token trong main process');
console.log('   - Reload ứng dụng');
console.log('7. Test lại chức năng "Add to Inventory"');

console.log('\n=== Expected Result ===');
console.log('API calls should now use: http://localhost:8000');
console.log('Instead of: http://103.139.203.10:7700'); 