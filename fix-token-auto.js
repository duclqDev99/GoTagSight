// Script tự động cập nhật token - Copy và paste vào Console của Developer Tools (F12)

console.log('=== Auto Fix Token ===');

// Lấy token mới từ login
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
        console.log('User:', user);

        if (token) {
            // Xóa token cũ
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            console.log('✅ Đã xóa token cũ');

            // Đặt token mới
            localStorage.setItem("authToken", token);
            localStorage.setItem("user", JSON.stringify(user));
            console.log('✅ Đã đặt token mới');

            // Kiểm tra
            const savedToken = localStorage.getItem("authToken");
            console.log('Saved token:', savedToken ? savedToken.substring(0, 20) + '...' : 'null');

            // Refresh trang
            console.log('🔄 Đang refresh trang...');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            console.error('❌ No token in response');
            console.log('Response data:', data);
        }
    })
    .catch(error => {
        console.error('❌ Login failed:', error);
    }); 