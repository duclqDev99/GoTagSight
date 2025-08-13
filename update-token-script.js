
// Copy và paste script này vào Console của Developer Tools (F12)
(function() {
    console.log('=== Updating Token in Application ===');
    
    // Token mới từ login
    const NEW_TOKEN = "OnZM0adbayOEleB08T2bjsLcVgHl63FUWfEfqDB4ksJB2VW0TkDyDLhXVJWH";
    const NEW_USER = {"id":26,"name":"Minh N.Dev","email":"minhn.it@isuccesscorp.com"};
    
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
