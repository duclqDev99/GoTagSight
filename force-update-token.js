const axios = require('axios');

// Token mới nhất đã được xác nhận hoạt động
const FRESH_TOKEN = 'CFWrVr3n2NX8cTV0zYydDEXycvq0g9ruVlfJuIB1MiL0872qb4g0TVCJk1cG';

async function forceUpdateToken() {
    try {
        console.log('=== FORCE UPDATE TOKEN ===');
        console.log('Token mới:', FRESH_TOKEN.substring(0, 20) + '...');

        // Test token trước
        console.log('\n1. Testing token...');
        const testResponse = await axios.post(
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
        console.log('Status:', testResponse.status);
        console.log('Response:', testResponse.data);

        // Hướng dẫn cập nhật token
        console.log('\n=== HƯỚNG DẪN CẬP NHẬT TOKEN ===');
        console.log('1. Mở ứng dụng Electron GoTagSight');
        console.log('2. Mở Developer Tools (F12 hoặc Cmd+Option+I)');
        console.log('3. Vào tab Console');
        console.log('4. Copy và paste đoạn code sau:');
        console.log('');
        console.log('// Cập nhật token trực tiếp');
        console.log('localStorage.setItem("authToken", "' + FRESH_TOKEN + '");');
        console.log('localStorage.setItem("user", JSON.stringify({email: "minhn.it@isuccesscorp.com"}));');
        console.log('');
        console.log('// Gọi API để set token trong main process');
        console.log('window.electronAPI.setAuthToken("' + FRESH_TOKEN + '").then(result => {');
        console.log('    console.log("Token set result:", result);');
        console.log('    if (result) {');
        console.log('        console.log("✅ Token đã được cập nhật thành công!");');
        console.log('        alert("Token đã được cập nhật! Hãy thử lại chức năng Add to Inventory.");');
        console.log('    } else {');
        console.log('        console.log("❌ Không thể cập nhật token");');
        console.log('        alert("Không thể cập nhật token. Vui lòng thử lại.");');
        console.log('    }');
        console.log('}).catch(error => {');
        console.log('    console.error("Error setting token:", error);');
        console.log('    alert("Lỗi khi cập nhật token: " + error.message);');
        console.log('});');
        console.log('');
        console.log('5. Nhấn Enter để thực thi');
        console.log('6. Đóng Developer Tools');
        console.log('7. Thử lại chức năng "Add to Inventory"');

        // Tạo script tự động
        console.log('\n=== SCRIPT TỰ ĐỘNG ===');
        console.log('Hoặc bạn có thể tạo file HTML để chạy tự động:');

        const autoScript = `
<!DOCTYPE html>
<html>
<head>
    <title>Update Token</title>
</head>
<body>
    <h2>Cập nhật Token</h2>
    <button onclick="updateToken()">Cập nhật Token</button>
    <div id="result"></div>
    
    <script>
        async function updateToken() {
            const token = '${FRESH_TOKEN}';
            const resultDiv = document.getElementById('result');
            
            try {
                // Cập nhật localStorage
                localStorage.setItem('authToken', token);
                localStorage.setItem('user', JSON.stringify({email: 'minhn.it@isuccesscorp.com'}));
                
                // Cập nhật trong main process (nếu có electronAPI)
                if (window.electronAPI) {
                    const result = await window.electronAPI.setAuthToken(token);
                    if (result) {
                        resultDiv.innerHTML = '<p style="color: green;">✅ Token đã được cập nhật thành công!</p>';
                    } else {
                        resultDiv.innerHTML = '<p style="color: red;">❌ Không thể cập nhật token trong main process</p>';
                    }
                } else {
                    resultDiv.innerHTML = '<p style="color: orange;">⚠️ Electron API không khả dụng, chỉ cập nhật localStorage</p>';
                }
            } catch (error) {
                resultDiv.innerHTML = '<p style="color: red;">❌ Lỗi: ' + error.message + '</p>';
            }
        }
    </script>
</body>
</html>`;

        console.log(autoScript);

    } catch (error) {
        console.error('❌ Token test FAILED');
        console.error('Error:', error.response?.data || error.message);
    }
}

forceUpdateToken(); 