const axios = require('axios');

async function testAppAPI() {
    try {
        console.log('=== Test API với cấu hình giống ứng dụng ===\n');

        // Cấu hình giống như trong ứng dụng
        const baseURL = 'http://localhost:8000';
        const endpoint = '/api/v2/order-details/update-status-code';
        const token = 'w5K9NTqkwgfYLoTuCYGphFZxUbXYDpPtaBPprOnXAcxAiISPu9slTJ9NTvSx';

        console.log('Cấu hình:');
        console.log('- Base URL:', baseURL);
        console.log('- Endpoint:', endpoint);
        console.log('- Token:', token.substring(0, 20) + '...');

        // Tạo client giống như trong ApiService
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

        const requestData = {
            status_code_string: 'C1F1R1P1E1V1I0',
            ids: [484875]
        };

        console.log('\nRequest Data:', JSON.stringify(requestData, null, 2));
        console.log('Request Headers:', client.defaults.headers);

        console.log('\n=== Gọi API ===');
        const response = await client.post(endpoint, requestData);

        console.log('\n=== Response Analysis ===');
        console.log('Status Code:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));

        // Kiểm tra logic xử lý giống như trong ApiService
        console.log('\n=== Logic Analysis (giống ApiService) ===');

        if (response.data) {
            console.log('Response data exists, checking fields...');

            if (typeof response.data.status === 'boolean') {
                console.log('✅ Response has boolean status:', response.data.status);
                console.log('Result would be:', response.data.status);
                return response.data.status;
            }

            if (response.data.message) {
                console.log('✅ Response has message:', response.data.message);
            }

            if (response.data.success !== undefined) {
                console.log('✅ Response has success field:', response.data.success);
                console.log('Result would be:', response.data.success);
                return response.data.success;
            }

            if (response.data.error) {
                console.log('❌ Response has error field:', response.data.error);
                throw new Error(`API Error: ${response.data.error}`);
            }

            // Nếu có data nhưng không có field status/success
            if (typeof response.data === 'object' && Object.keys(response.data).length > 0) {
                console.log('✅ Response has data but no status/success field');
                console.log('Result would be: true (HTTP success + has data)');
                return true;
            }
        } else {
            console.log('Response data is null/undefined');
        }

        // Kiểm tra HTTP status
        if (response.status >= 200 && response.status < 300) {
            console.log('✅ HTTP status indicates success:', response.status);
            console.log('Result would be: true (HTTP success)');
            return true;
        } else {
            console.log('❌ HTTP status indicates failure:', response.status);
            console.log('Result would be: false (HTTP failure)');
            return false;
        }

    } catch (error) {
        console.error('\n=== Error Analysis ===');
        console.error('Error Message:', error.message);
        console.error('Response Status:', error.response?.status);
        console.error('Response Data:', error.response?.data);

        if (error.response?.data) {
            console.error('Response Data Type:', typeof error.response.data);
            console.error('Response Data Keys:', Object.keys(error.response.data));
        }

        // Xử lý lỗi giống như trong ApiService
        let errorMessage = 'Unknown error occurred';

        if (error.response?.data) {
            if (error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.response.data.error) {
                errorMessage = error.response.data.error;
            } else if (typeof error.response.data === 'string') {
                errorMessage = error.response.data;
            } else {
                errorMessage = `Server error: ${JSON.stringify(error.response.data)}`;
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        console.error('Processed Error Message:', errorMessage);

        // Xử lý các lỗi authentication cụ thể
        if (error.response?.status === 401) {
            if (errorMessage.includes('Invalid token') || errorMessage.includes('Unauthorized')) {
                console.error('❌ Token không hợp lệ hoặc đã hết hạn');
            }
        } else if (error.response?.status === 403) {
            console.error('❌ Không có quyền truy cập');
        } else if (error.response?.status === 404) {
            console.error('❌ API endpoint không tồn tại');
        } else if (error.response?.status >= 500) {
            console.error('❌ Lỗi server');
        }

        return false;
    }
}

console.log('=== Test API với cấu hình ứng dụng ===');
console.log('Chạy: node test-app-api.js\n');

testAppAPI().then(result => {
    console.log('\n=== Final Result ===');
    console.log('API call result:', result);
    if (result === true) {
        console.log('✅ API call successful');
    } else {
        console.log('❌ API call failed');
    }
}); 