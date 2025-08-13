// Copy và paste script này vào Console của Developer Tools

// Auto fix token script
(function() {
    console.log('=== Auto Fix Token ===');
    
    // Xóa token cũ
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    console.log('✅ Đã xóa token cũ');
    
    // Đặt token mới
    localStorage.setItem("authToken", "w5K9NTqkwgfYLoTuCYGphFZxUbXYDpPtaBPprOnXAcxAiISPu9slTJ9NTvSx");
    localStorage.setItem("user", JSON.stringify({
        name: "User", 
        email: "user@example.com"
    }));
    console.log('✅ Đã đặt token mới');
    
    // Kiểm tra
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("user");
    console.log('Token mới:', token ? token.substring(0, 20) + '...' : 'null');
    console.log('User:', user);
    
    // Refresh trang
    console.log('🔄 Đang refresh trang...');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
})();
