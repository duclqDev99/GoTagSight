const axios = require('axios');

console.log('=== Get Production Token ===\n');

// Production login endpoint
const loginURL = 'https://production.trackingis.info/api/v2/auth/login';
const credentials = {
    email: 'minhn.it@isuccesscorp.com',
    password: 'success88'
};

console.log('1. Logging in to production server...');
console.log('URL:', loginURL);
console.log('Email:', credentials.email);

// Thực hiện login
axios.post(loginURL, credentials, {
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})
    .then(response => {
        console.log('\n✅ Login successful!');
        console.log('Status:', response.status);
        console.log('Response Data:', response.data);

        // Extract token
        const token = response.data.token || response.data.access_token || response.data.accessToken || response.data.data?.token;
        const user = response.data.user || response.data.data?.user || response.data.data || {};

        if (token) {
            console.log('\n✅ Token obtained:');
            console.log('Token:', token);
            console.log('Token length:', token.length);
            console.log('Token preview:', `${token.substring(0, 20)}...`);

            console.log('\nUser data:', user);

            // Test token với API call
            console.log('\n2. Testing token with API call...');

            const testClient = axios.create({
                baseURL: 'https://production.trackingis.info',
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': '',
                    'Authorization': `Bearer ${token}`
                }
            });

            const testData = {
                status_code_string: 'C1F1R1P1E1F1',
                ids: [502424, 502473, 502552]
            };

            return testClient.post('/api/v2/order-details/update-status-code', testData);
        } else {
            console.log('❌ No token found in response');
            throw new Error('No token in response');
        }
    })
    .then(response => {
        console.log('\n✅ API test successful!');
        console.log('Status:', response.status);
        console.log('Response Data:', response.data);

        console.log('\n=== SUCCESS ===');
        console.log('Production API is working correctly!');
        console.log('Your Electron app should now work with the hardcoded URL.');
    })
    .catch(error => {
        console.log('\n❌ Error:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Status Text:', error.response.statusText);
            console.log('Response Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    });

console.log('\n=== Instructions ===');
console.log('1. Check if login is successful');
console.log('2. If successful, the production API is working');
console.log('3. Your Electron app should now use the hardcoded URL');
console.log('4. Test "Add to Inventory" function'); 