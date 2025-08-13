
// API Config Reset Script - Copy to Console
(function() {
    console.log('=== Reset API Configuration ===');
    
    // Clear existing API config
    if (window.electronAPI && window.electronAPI.setConfig) {
        const resetConfig = {
            apiConfig: {
                baseURL: 'http://localhost:8000',
                timeout: 10000,
                username: '',
                password: '',
                apiKey: '',
                environment: 'development',
                environmentUrls: {
                    development: 'http://localhost:8000',
                    staging: '',
                    production: '',
                    custom: ''
                },
                updateApiBaseURL: 'http://localhost:8000',
                updateApiKey: ''
            }
        };
        
        window.electronAPI.setConfig(resetConfig).then(success => {
            console.log('✅ API config reset:', success);
            
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
                    
                    console.log('✅ Token updated');
                    
                    // Set token in main process
                    if (window.electronAPI && window.electronAPI.setAuthToken) {
                        window.electronAPI.setAuthToken(token).then(success => {
                            console.log('✅ Token set in main process:', success);
                            setTimeout(() => window.location.reload(), 1000);
                        });
                    } else {
                        setTimeout(() => window.location.reload(), 1000);
                    }
                }
            })
            .catch(error => {
                console.error('❌ Login failed:', error);
            });
        });
    } else {
        console.error('❌ Electron API not available');
    }
})();
