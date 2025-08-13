const axios = require('axios');

async function testFullFlow() {
    console.log('=== Test Full Flow: Login -> API Call ===\n');

    // Step 1: Login
    console.log('1. Testing Login...');
    const loginData = {
        email: 'minhn.it@isuccesscorp.com',
        password: 'success88'
    };

    try {
        const loginResponse = await axios.post('http://localhost:8000/api/v2/auth/login', loginData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log('✅ Login successful');
        console.log('Login response status:', loginResponse.status);

        const token = loginResponse.data.token || loginResponse.data.access_token || loginResponse.data.accessToken || loginResponse.data.data?.token;
        const user = loginResponse.data.user || loginResponse.data.data?.user || loginResponse.data.data || {};

        console.log('Extracted token:', token ? `${token.substring(0, 20)}...` : 'null');
        console.log('Extracted user:', user);

        if (!token) {
            console.error('❌ No token found in login response');
            console.log('Response data keys:', Object.keys(loginResponse.data));
            return;
        }

        // Step 2: Test API call with extracted token
        console.log('\n2. Testing API call with extracted token...');

        const apiResponse = await axios.post('http://localhost:8000/api/v2/order-details/update-status-code', {
            status_code_string: 'C1F1R1P1E1V1I0',
            ids: [484875]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-CSRF-TOKEN': ''
            },
            timeout: 10000
        });

        console.log('✅ API call successful');
        console.log('API response status:', apiResponse.status);
        console.log('API response data:', JSON.stringify(apiResponse.data, null, 2));

        // Step 3: Compare with known working token
        console.log('\n3. Comparing with known working token...');

        const knownToken = 'w5K9NTqkwgfYLoTuCYGphFZxUbXYDpPtaBPprOnXAcxAiISPu9slTJ9NTvSx';

        if (token === knownToken) {
            console.log('✅ Token matches known working token');
        } else {
            console.log('⚠️ Token is different from known working token');
            console.log('Login token:', token.substring(0, 20) + '...');
            console.log('Known token:', knownToken.substring(0, 20) + '...');
        }

        // Step 4: Test API call with known token
        console.log('\n4. Testing API call with known token...');

        const knownTokenResponse = await axios.post('http://localhost:8000/api/v2/order-details/update-status-code', {
            status_code_string: 'C1F1R1P1E1V1I0',
            ids: [484875]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${knownToken}`,
                'X-CSRF-TOKEN': ''
            },
            timeout: 10000
        });

        console.log('✅ Known token API call successful');
        console.log('Known token response status:', knownTokenResponse.status);
        console.log('Known token response data:', JSON.stringify(knownTokenResponse.data, null, 2));

        // Step 5: Analysis
        console.log('\n=== Analysis ===');

        if (token === knownToken) {
            console.log('✅ Login returns the correct token');
            console.log('✅ Both tokens work for API calls');
            console.log('🎯 The issue is likely in the Electron app token handling');
        } else {
            console.log('⚠️ Login returns a different token');
            console.log('🔍 This might be the root cause of the issue');
            console.log('💡 The app might be using an old cached token');
        }

    } catch (error) {
        console.error('❌ Error in test flow:', error.message);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

console.log('=== Test Full Flow ===');
console.log('This will test the complete flow from login to API call\n');

testFullFlow().then(() => {
    console.log('\n=== Test Complete ===');
    console.log('Check the results above to identify the issue');
}); 