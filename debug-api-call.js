const axios = require('axios');

async function debugApiCall() {
    console.log('=== Debug API Call ===\n');

    // Step 1: Get fresh token
    console.log('1. Getting fresh token...');

    try {
        const loginResponse = await axios.post('http://localhost:8000/api/v2/auth/login', {
            email: 'minhn.it@isuccesscorp.com',
            password: 'success88'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const token = loginResponse.data.token || loginResponse.data.access_token || loginResponse.data.accessToken || loginResponse.data.data?.token;
        const user = loginResponse.data.user || loginResponse.data.data?.user || loginResponse.data.data || {};

        console.log('✅ Login successful');
        console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
        console.log('User:', user);

        if (!token) {
            console.error('❌ No token found');
            return;
        }

        // Step 2: Test API call with exact same configuration as ApiService
        console.log('\n2. Testing API call with ApiService-like configuration...');

        const baseURL = 'http://localhost:8000';
        const endpoint = '/api/v2/order-details/update-status-code';

        // Create client like ApiService
        const client = axios.create({
            baseURL: baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': ''
            }
        });

        // Set auth token
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const requestData = {
            status_code_string: 'C1F1R1P1E1V1I0',
            ids: [484875]
        };

        console.log('=== Request Details ===');
        console.log('Base URL:', baseURL);
        console.log('Endpoint:', endpoint);
        console.log('Full URL:', `${baseURL}${endpoint}`);
        console.log('Request Data:', requestData);
        console.log('Request Headers:', client.defaults.headers);
        console.log('Auth Token:', token.substring(0, 20) + '...');

        // Make API call
        console.log('\n=== Making API Call ===');
        const response = await client.post(endpoint, requestData);

        console.log('\n=== Response Details ===');
        console.log('Status Code:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
        console.log('Response Data Type:', typeof response.data);
        console.log('Response Data Keys:', response.data ? Object.keys(response.data) : 'null/undefined');

        // Step 3: Analyze response like ApiService
        console.log('\n=== Response Analysis (like ApiService) ===');

        if (response.data) {
            console.log('Response data exists, checking fields...');

            if (typeof response.data.status === 'boolean') {
                console.log('✅ Response has boolean status:', response.data.status);
                console.log('Result would be:', response.data.status);
            } else {
                console.log('❌ Response does not have boolean status field');
            }

            if (response.data.message) {
                console.log('✅ Response has message:', response.data.message);
            }

            if (response.data.success !== undefined) {
                console.log('✅ Response has success field:', response.data.success);
                console.log('Result would be:', response.data.success);
            } else {
                console.log('❌ Response does not have success field');
            }

            if (response.data.error) {
                console.log('❌ Response has error field:', response.data.error);
            }

            // Check if response indicates success
            if (typeof response.data === 'object' && Object.keys(response.data).length > 0) {
                console.log('✅ Response has data object with keys:', Object.keys(response.data));
                console.log('Result would be: true (has data object)');
            }
        } else {
            console.log('❌ Response data is null/undefined');
        }

        // Check HTTP status
        if (response.status >= 200 && response.status < 300) {
            console.log('✅ HTTP status indicates success:', response.status);
            console.log('Result would be: true (HTTP success)');
        } else {
            console.log('❌ HTTP status indicates failure:', response.status);
            console.log('Result would be: false (HTTP failure)');
        }

        // Step 4: Final result
        console.log('\n=== Final Result ===');
        let finalResult = false;

        if (response.data) {
            if (typeof response.data.status === 'boolean') {
                finalResult = response.data.status;
            } else if (response.data.success !== undefined) {
                finalResult = response.data.success;
            } else if (typeof response.data === 'object' && Object.keys(response.data).length > 0) {
                finalResult = true;
            }
        }

        if (response.status >= 200 && response.status < 300 && !finalResult) {
            finalResult = true;
        }

        console.log('Final result:', finalResult);

        if (finalResult) {
            console.log('✅ API call should succeed');
        } else {
            console.log('❌ API call should fail');
        }

    } catch (error) {
        console.error('\n=== Error Details ===');
        console.error('Error Message:', error.message);
        console.error('Error Response Status:', error.response?.status);
        console.error('Error Response Data:', error.response?.data);

        if (error.response?.data) {
            console.error('Error Response Data Type:', typeof error.response.data);
            console.error('Error Response Data Keys:', Object.keys(error.response.data));
        }
    }
}

console.log('=== Debug API Call ===');
console.log('This will debug the API call in detail\n');

debugApiCall().then(() => {
    console.log('\n=== Debug Complete ===');
    console.log('Check the analysis above to understand the issue');
}); 