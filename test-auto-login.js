const axios = require('axios');

async function testAutoLogin() {
    console.log('=== Test Auto Login Flow ===\n');

    // Step 1: Simulate login
    console.log('1. Simulating login...');

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
        console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
        console.log('User:', user);

        if (!token) {
            console.error('❌ No token found');
            return;
        }

        // Step 2: Test API call
        console.log('\n2. Testing API call with new token...');

        const apiResponse = await axios.post('http://localhost:8000/api/v2/order-details/update-status-code', {
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

        console.log('✅ API call successful');
        console.log('Response:', apiResponse.data);

        // Step 3: Generate auto-update script
        console.log('\n3. Generating auto-update script...');

        const autoScript = `
// Auto update token script - Copy to Console
(function() {
    console.log('=== Auto Update Token ===');
    
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
            
            console.log('✅ Token updated in localStorage');
            
            // Trigger login success
            if (window.handleLoginSuccess) {
                window.handleLoginSuccess(token, user);
            } else {
                console.log('🔄 Refreshing page...');
                setTimeout(() => window.location.reload(), 1000);
            }
        } else {
            console.error('❌ No token in response');
        }
    })
    .catch(error => {
        console.error('❌ Login failed:', error);
    });
})();
`;

        console.log(autoScript);

        // Step 4: Save to file
        const fs = require('fs');
        fs.writeFileSync('auto-update-token.js', autoScript);
        console.log('\n✅ Đã tạo file auto-update-token.js');

        // Step 5: Instructions
        console.log('\n=== Hướng dẫn sử dụng ===');
        console.log('1. Mở ứng dụng Electron');
        console.log('2. Mở Developer Tools (F12)');
        console.log('3. Vào Console tab');
        console.log('4. Copy script từ file auto-update-token.js');
        console.log('5. Paste vào Console và Enter');
        console.log('6. Script sẽ tự động:');
        console.log('   - Lấy token mới từ login');
        console.log('   - Cập nhật localStorage');
        console.log('   - Trigger login success');
        console.log('   - Refresh trang');
        console.log('7. Test lại chức năng "Add to Inventory"');

    } catch (error) {
        console.error('❌ Error:', error.message);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

console.log('=== Test Auto Login ===');
console.log('This will test the complete auto-login flow\n');

testAutoLogin().then(() => {
    console.log('\n=== Complete ===');
    console.log('Use the generated script to automatically update tokens');
}); 