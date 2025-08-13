const axios = require('axios');

async function testAPIResponse() {
    try {
        console.log('=== Testing API Response Structure ===');

        // Token mới từ user
        const token = 'w5K9NTqkwgfYLoTuCYGphFZxUbXYDpPtaBPprOnXAcxAiISPu9slTJ9NTvSx';

        console.log('Using token:', token.substring(0, 20) + '...');

        const response = await axios.post('http://localhost:8000/api/v2/order-details/update-status-code', {
            status_code_string: 'C1F1R1P1E1V1I0',
            ids: [484875]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-CSRF-TOKEN': ''
            },
            timeout: 10000
        });

        console.log('\n=== Response Analysis ===');
        console.log('Status Code:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Response Data Type:', typeof response.data);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));

        if (response.data) {
            console.log('\n=== Field Analysis ===');
            console.log('Response Data Keys:', Object.keys(response.data));
            console.log('Response Data Length:', Object.keys(response.data).length);

            // Kiểm tra từng field
            for (const [key, value] of Object.entries(response.data)) {
                console.log(`Field "${key}":`, value, `(type: ${typeof value})`);
            }

            // Kiểm tra logic xử lý
            console.log('\n=== Logic Analysis ===');
            if (typeof response.data.status === 'boolean') {
                console.log('✅ Has boolean status field:', response.data.status);
                console.log('Result would be:', response.data.status);
            } else {
                console.log('❌ No boolean status field');
            }

            if (response.data.success !== undefined) {
                console.log('✅ Has success field:', response.data.success);
            } else {
                console.log('❌ No success field');
            }

            if (response.data.message) {
                console.log('✅ Has message field:', response.data.message);
            } else {
                console.log('❌ No message field');
            }

            if (response.data.error) {
                console.log('❌ Has error field:', response.data.error);
            } else {
                console.log('✅ No error field');
            }

            // Kiểm tra nested data
            if (response.data.data) {
                console.log('\n=== Nested Data Analysis ===');
                console.log('Nested data keys:', Object.keys(response.data.data));
                for (const [key, value] of Object.entries(response.data.data)) {
                    console.log(`Nested field "${key}":`, value, `(type: ${typeof value})`);
                }
            }
        }

        // Kết luận
        console.log('\n=== Conclusion ===');
        if (response.status >= 200 && response.status < 300) {
            console.log('✅ HTTP Status: Success');
            if (response.data) {
                console.log('✅ Has response data');
                // Kiểm tra logic xử lý
                if (typeof response.data.status === 'boolean') {
                    console.log('Result would be:', response.data.status);
                } else if (response.data.success !== undefined) {
                    console.log('Result would be:', response.data.success);
                } else {
                    console.log('Result would be: true (HTTP success + has data)');
                }
            } else {
                console.log('Result would be: true (HTTP success + no data)');
            }
        } else {
            console.log('❌ HTTP Status: Failure');
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

        // Kiểm tra lỗi cụ thể
        if (error.response?.status === 401) {
            console.error('❌ 401 Unauthorized - Token không hợp lệ hoặc hết hạn');
        } else if (error.response?.status === 403) {
            console.error('❌ 403 Forbidden - Không có quyền truy cập');
        } else if (error.response?.status === 404) {
            console.error('❌ 404 Not Found - API endpoint không tồn tại');
        } else if (error.response?.status >= 500) {
            console.error('❌ Server Error - Lỗi server');
        }
    }
}

// Hướng dẫn sử dụng
console.log('=== API Response Test ===');
console.log('Testing với token mới và cấu trúc API đúng');
console.log('Chạy: node test-api-response.js\n');

testAPIResponse(); 