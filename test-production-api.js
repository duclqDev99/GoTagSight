const axios = require('axios');

console.log('=== Test Production API ===\n');

// Test với baseURL gán cứng
const baseURL = 'https://production.trackingis.info';
const token = 'QE64Ipd7tth9o61KrC7ebTd3m4z8aGzwUu6wzWbcafE5XOtJ57EY6GMcWnkz';

console.log('1. Testing with hardcoded production URL...');
console.log('Base URL:', baseURL);
console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');

// Tạo client với cấu hình giống ApiService
const client = axios.create({
    baseURL: baseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': ''
    }
});

// Thêm auth token
client.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Test data
const requestData = {
    status_code_string: 'C1F1R1P1E1F1',
    ids: [502424, 502473, 502552]
};

console.log('\n2. Making API call...');
console.log('Endpoint: /api/v2/order-details/update-status-code');
console.log('Full URL:', `${baseURL}/api/v2/order-details/update-status-code`);
console.log('Request Data:', requestData);

// Thực hiện API call
client.post('/api/v2/order-details/update-status-code', requestData)
    .then(response => {
        console.log('\n✅ API call successful!');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Response Data:', response.data);

        // Kiểm tra response
        if (response.data && response.data.status === true) {
            console.log('✅ Response indicates success');
        } else if (response.data && response.data.success === true) {
            console.log('✅ Response indicates success');
        } else {
            console.log('⚠️ Response structure:', typeof response.data);
            console.log('Response keys:', response.data ? Object.keys(response.data) : 'null');
        }
    })
    .catch(error => {
        console.log('\n❌ API call failed!');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Status Text:', error.response.statusText);
            console.log('Response Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    });

console.log('\n=== Instructions ===');
console.log('1. Check the API call result above');
console.log('2. If successful, the hardcoded URL is working');
console.log('3. Restart your Electron app and test "Add to Inventory"');
console.log('4. The app should now use https://production.trackingis.info'); 