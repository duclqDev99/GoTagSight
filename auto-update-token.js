
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
