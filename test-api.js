const axios = require('axios');

async function testUpdateAPI() {
    try {
        console.log('Testing API endpoint...');

        const response = await axios.post('http://localhost:8000/api/v2/order-details/update-status-code', {
            status_code_string: 'C1F1R1P1E1V1I0',
            ids: [502567] // Sử dụng ID từ logs
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Bearer QE64Ipd7tth9o61KrC7ebTd3m4z8aGzwUu6wzWbcafE5XOtJ57EY6GMcWnkz',
                'X-CSRF-TOKEN': ''
            },
            timeout: 10000
        });

        console.log('Response Status:', response.status);
        console.log('Response Headers:', response.headers);
        console.log('Response Data:', response.data);
        console.log('Response Data Type:', typeof response.data);

        if (response.data) {
            console.log('Response Data Keys:', Object.keys(response.data));
        }

    } catch (error) {
        console.error('Error testing API:');
        console.error('Error Message:', error.message);
        console.error('Response Status:', error.response?.status);
        console.error('Response Data:', error.response?.data);
        console.error('Response Headers:', error.response?.headers);
    }
}

testUpdateAPI(); 