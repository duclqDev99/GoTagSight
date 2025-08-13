const axios = require('axios');

async function updateToken() {
    console.log('=== Update Token in Application ===\n');

    // Step 1: Get new token from login
    console.log('1. Getting new token from login...');

    try {
        const loginResponse = await axios.post('http://localhost:8000/api/v2/auth/login', {
            email: 'minhn.it@isuccesscorp.com',
            password: 'success88'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const token = loginResponse.data.token || loginResponse.data.access_token || loginResponse.data.accessToken || loginResponse.data.data?.token;
        const user = loginResponse.data.user || loginResponse.data.data?.user || loginResponse.data.data || {};

        console.log('✅ Login successful');
        console.log('New token:', token ? `${token.substring(0, 20)}...` : 'null');
        console.log('User:', user);

        if (!token) {
            console.error('❌ No token found in login response');
            return;
        }

        // Step 2: Test new token
        console.log('\n2. Testing new token...');

        const testResponse = await axios.post('http://localhost:8000/api/v2/order-details/update-status-code', {
            status_code_string: 'C1F1R1P1E1V1I0',
            ids: [484875]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-CSRF-TOKEN': ''
            }
        });

        console.log('✅ New token works!');
        console.log('Test response:', testResponse.data);

        // Step 3: Generate update script
        console.log('\n3. Generating update script for application...');

        const updateScript = `
// Copy và paste script này vào Console của Developer Tools (F12)
(function() {
    console.log('=== Updating Token in Application ===');
    
    // Token mới từ login
    const NEW_TOKEN = "${token}";
    const NEW_USER = ${JSON.stringify(user)};
    
    console.log('New token:', NEW_TOKEN.substring(0, 20) + '...');
    console.log('New user:', NEW_USER);
    
    // Xóa token cũ
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    console.log('✅ Đã xóa token cũ');
    
    // Đặt token mới
    localStorage.setItem("authToken", NEW_TOKEN);
    localStorage.setItem("user", JSON.stringify(NEW_USER));
    console.log('✅ Đã đặt token mới');
    
    // Kiểm tra
    const savedToken = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("user");
    console.log('Saved token:', savedToken ? savedToken.substring(0, 20) + '...' : 'null');
    console.log('Saved user:', savedUser);
    
    // Refresh trang
    console.log('🔄 Đang refresh trang...');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
})();
`;

        console.log(updateScript);

        // Step 4: Save to file
        const fs = require('fs');
        fs.writeFileSync('update-token-script.js', updateScript);
        console.log('\n✅ Đã tạo file update-token-script.js');
        console.log('Mở file này và copy script vào Console của ứng dụng');

        // Step 5: Instructions
        console.log('\n=== Hướng dẫn cập nhật ===');
        console.log('1. Mở ứng dụng Electron');
        console.log('2. Mở Developer Tools (F12)');
        console.log('3. Vào Console tab');
        console.log('4. Copy script từ file update-token-script.js');
        console.log('5. Paste vào Console và Enter');
        console.log('6. Ứng dụng sẽ tự động refresh');
        console.log('7. Test lại chức năng "Add to Inventory"');

    } catch (error) {
        console.error('❌ Error:', error.message);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

console.log('=== Update Token ===');
console.log('This will get a fresh token and generate update script\n');

updateToken().then(() => {
    console.log('\n=== Complete ===');
    console.log('Follow the instructions above to update the token in your application');
}); 