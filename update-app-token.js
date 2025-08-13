const axios = require('axios');

// Token mới nhất đã được xác nhận hoạt động
const FRESH_TOKEN = 'CFWrVr3n2NX8cTV0zYydDEXycvq0g9ruVlfJuIB1MiL0872qb4g0TVCJk1cG';

// Test token trước khi cập nhật
async function testToken() {
    try {
        console.log('=== TESTING FRESH TOKEN ===');
        console.log('Token:', FRESH_TOKEN.substring(0, 20) + '...');

        const response = await axios.post(
            'https://production.trackingis.info/api/v2/order-details/update-status-code',
            {
                status_code_string: "C1F1R1P1E1V1I0",
                ids: [511133]
            },
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

        console.log('✅ Token test SUCCESS');
        console.log('Status:', response.status);
        console.log('Response:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Token test FAILED');
        console.error('Error:', error.response?.data || error.message);
        return false;
    }
}

// Hướng dẫn cập nhật token
function showInstructions() {
    console.log('\n=== HƯỚNG DẪN CẬP NHẬT TOKEN ===');
    console.log('1. Mở ứng dụng Electron GoTagSight');
    console.log('2. Vào phần Settings/Login');
    console.log('3. Đăng nhập lại với tài khoản: minhn.it@isuccesscorp.com');
    console.log('4. Hoặc nếu có chỗ nhập token trực tiếp, hãy nhập token sau:');
    console.log(`   ${FRESH_TOKEN}`);
    console.log('\n5. Sau khi đăng nhập, thử lại chức năng "Add to Inventory"');
    console.log('\n=== LÝ DO CẦN CẬP NHẬT ===');
    console.log('- Token hiện tại trong ứng dụng đã hết hạn');
    console.log('- Token mới này đã được test và hoạt động tốt');
    console.log('- Ứng dụng cần token mới để gọi API thành công');
}

// Chạy test và hiển thị hướng dẫn
async function main() {
    console.log('🔍 Kiểm tra token mới...\n');

    const tokenWorks = await testToken();

    if (tokenWorks) {
        console.log('\n🎯 Token mới hoạt động tốt!');
        showInstructions();
    } else {
        console.log('\n⚠️ Token mới không hoạt động, cần lấy token mới hơn');
    }
}

main(); 