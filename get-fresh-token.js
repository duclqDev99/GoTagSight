const axios = require('axios')

console.log('=== Get Fresh Token for Production API ===\n')

async function getFreshToken() {
    try {
        console.log('1. Getting fresh token from production login...')

        const loginData = {
            email: 'minhn.it@isuccesscorp.com',
            password: 'success88'
        }

        console.log('Login credentials:', { email: loginData.email, password: '***' })

        const response = await axios.post('https://production.trackingis.info/api/v2/auth/login', loginData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        })

        console.log('✅ Login successful!')
        console.log('Status:', response.status)
        console.log('Response data:', JSON.stringify(response.data, null, 2))

        // Extract token from response
        let token = null
        if (response.data && response.data.token) {
            token = response.data.token
        } else if (response.data && response.data.access_token) {
            token = response.data.access_token
        } else if (response.data && response.data.data && response.data.data.token) {
            token = response.data.data.token
        } else if (response.data && response.data.data && response.data.data.access_token) {
            token = response.data.data.access_token
        }

        if (!token) {
            console.log('❌ No token found in response')
            console.log('Available fields:', response.data ? Object.keys(response.data) : 'null')
            return null
        }

        console.log('\n2. Token extracted successfully!')
        console.log('Token length:', token.length)
        console.log('Token preview:', `${token.substring(0, 20)}...`)

        return token

    } catch (error) {
        console.error('❌ Failed to get fresh token:')
        console.error('Error:', error.message)
        if (error.response) {
            console.error('Status:', error.response.status)
            console.error('Data:', error.response.data)
        }
        return null
    }
}

async function testUpdateStatus(token) {
    if (!token) {
        console.log('\n⚠️ Skipping update test - no token available')
        return
    }

    try {
        console.log('\n3. Testing update status with fresh token...')

        const updateData = {
            status_code_string: 'C1F1R1P1E1V1I0',
            ids: [484875] // Sử dụng ID từ log trước đó
        }

        console.log('Update data:', updateData)

        const response = await axios.post('https://production.trackingis.info/api/v2/order-details/update-status-code', updateData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-CSRF-TOKEN': ''
            },
            timeout: 10000
        })

        console.log('✅ Update status successful!')
        console.log('Status:', response.status)
        console.log('Response data:', JSON.stringify(response.data, null, 2))

    } catch (error) {
        console.error('❌ Update status failed:')
        console.error('Error:', error.message)
        if (error.response) {
            console.error('Status:', error.response.status)
            console.error('Data:', error.response.data)
        }
    }
}

async function main() {
    console.log('🚀 Starting token refresh process...\n')

    const token = await getFreshToken()
    await testUpdateStatus(token)

    console.log('\n🏁 Process completed!')
    if (token) {
        console.log('\n💡 Next steps:')
        console.log('1. Copy the token above')
        console.log('2. Login again in the app to get fresh token')
        console.log('3. Test "Add to Inventory" function')
    }
}

main() 