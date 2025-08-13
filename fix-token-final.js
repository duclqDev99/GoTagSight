// Script cuối cùng để fix token - Copy và paste vào Console của Developer Tools (F12)

console.log('=== Final Token Fix ===');

// Step 1: Get fresh token
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

        if (!token) {
            console.error('❌ No token in response');
            console.log('Response data:', data);
            return;
        }

        // Step 2: Clear old data completely
        console.log('🔄 Clearing old data...');
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("user");

        // Step 3: Set new data
        console.log('🔄 Setting new data...');
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Step 4: Verify
        const savedToken = localStorage.getItem("authToken");
        const savedUser = localStorage.getItem("user");
        console.log('✅ Saved token:', savedToken ? savedToken.substring(0, 20) + '...' : 'null');
        console.log('✅ Saved user:', savedUser);

        // Step 5: Test token immediately
        console.log('🔄 Testing token immediately...');
        fetch('http://localhost:8000/api/v2/order-details/update-status-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-CSRF-TOKEN': ''
            },
            body: JSON.stringify({
                status_code_string: 'C1F1R1P1E1V1I0',
                ids: [484875]
            })
        })
            .then(response => response.json())
            .then(testData => {
                console.log('✅ Token test result:', testData);

                if (testData.status === true) {
                    console.log('🎉 Token works perfectly!');

                    // Step 6: Force reload and trigger login success
                    console.log('🔄 Reloading application...');

                    // Clear any cached data
                    if (window.electronAPI && window.electronAPI.setAuthToken) {
                        window.electronAPI.setAuthToken(token).then(success => {
                            console.log('✅ Token set in main process:', success);
                            setTimeout(() => {
                                window.location.reload();
                            }, 500);
                        }).catch(error => {
                            console.error('❌ Failed to set token in main process:', error);
                            setTimeout(() => {
                                window.location.reload();
                            }, 500);
                        });
                    } else {
                        setTimeout(() => {
                            window.location.reload();
                        }, 500);
                    }
                } else {
                    console.error('❌ Token test failed:', testData);
                }
            })
            .catch(testError => {
                console.error('❌ Token test error:', testError);
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            });
    })
    .catch(error => {
        console.error('❌ Login failed:', error);
    }); 