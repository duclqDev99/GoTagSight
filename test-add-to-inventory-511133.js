const axios = require('axios');

// Token mới nhất
const FRESH_TOKEN = 'CFWrVr3n2NX8cTV0zYydDEXycvq0g9ruVlfJuIB1MiL0872qb4g0TVCJk1cG';

// Test chức năng Add to Inventory với ID 511133
async function testAddToInventory511133() {
    try {
        console.log('=== TEST: Add to Inventory với ID 511133 ===');
        console.log('Token:', FRESH_TOKEN.substring(0, 20) + '...');

        // Tạo request data đơn giản như yêu cầu
        const requestData = {
            status_code_string: "C1F1R1P1E1V1I0",
            ids: [511133]
        };

        console.log('Request Data:', JSON.stringify(requestData, null, 2));

        // Gọi API production
        const response = await axios.post(
            'https://production.trackingis.info/api/v2/order-details/update-status-code',
            requestData,
            {
                headers: {
                    'Authorization': `Bearer ${FRESH_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': ''
                },
                timeout: 10000
            }
        );

        console.log('\n=== RESPONSE SUCCESS ===');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));

        // Kiểm tra kết quả
        if (response.data && response.data.status === true) {
            console.log('\n✅ SUCCESS: Order 511133 đã được cập nhật thành công!');
            console.log('Message:', response.data.message);
            if (response.data.data) {
                console.log('Data:', response.data.data);
            }
        } else {
            console.log('\n⚠️ WARNING: Response không có status = true');
            console.log('Response structure:', Object.keys(response.data || {}));
        }

    } catch (error) {
        console.error('\n❌ ERROR:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Status Text:', error.response.statusText);
            console.error('Response Data:', error.response.data);
            console.error('Response Headers:', error.response.headers);
        } else if (error.request) {
            console.error('Request Error:', error.message);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Chạy test
console.log('🚀 Bắt đầu test chức năng Add to Inventory với ID 511133...\n');
testAddToInventory511133(); 