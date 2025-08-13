const axios = require('axios')

console.log('=== Test Different Status Codes ===\n')

const freshToken = 'i0MRU5ZhK1fFMikFIHBGJ2yiUqrlQHrUcfWcpfWuaP7Uw2DMeDU3mdMJSIFi'

const testStatusCodes = [
    'C1F1R1P1E1V1I1', // Giữ nguyên I=1
    'C1F1R1P1E1V1I1T1', // Thêm T=1
    'C1F1R1P1E1V1I1T1U1', // Thêm U=1
    'C1F1R1P1E1V1I1T1U1S1', // Thêm S=1
    'C1F1R1P1E1V1I1T1U1S1D1', // Thêm D=1
    'C1F1R1P1E1V1I1T1U1S1D0', // Set D=0
    'C1F1R1P1E1V1I1T1U1S0D0', // Set S=0, D=0
    'C1F1R1P1E1V1I1T0U0S0D0', // Set T=0, U=0, S=0, D=0
]

async function testStatusCode(statusCode, orderId) {
    try {
        console.log(`Testing status code: ${statusCode}`)

        const updateData = {
            status_code_string: statusCode,
            ids: [orderId]
        }

        const response = await axios.post('https://production.trackingis.info/api/v2/order-details/update-status-code', updateData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${freshToken}`,
                'X-CSRF-TOKEN': ''
            },
            timeout: 10000
        })

        console.log(`✅ ${statusCode}: SUCCESS`)
        console.log('   Status:', response.status)
        console.log('   Response:', JSON.stringify(response.data, null, 2))
        return true

    } catch (error) {
        console.log(`❌ ${statusCode}: FAILED`)
        console.log('   Error:', error.response?.data?.message || error.message)
        if (error.response?.data?.errors) {
            console.log('   Details:', JSON.stringify(error.response.data.errors, null, 2))
        }
        return false
    }
}

async function main() {
    console.log('🚀 Testing different status codes...\n')

    const orderId = 484875 // ID từ log trước đó

    console.log(`Testing with order ID: ${orderId}\n`)

    const results = []

    for (const statusCode of testStatusCodes) {
        const success = await testStatusCode(statusCode, orderId)
        results.push({ statusCode, success })
        console.log('') // Empty line for readability
    }

    console.log('📊 Results Summary:')
    results.forEach(result => {
        const status = result.success ? '✅' : '❌'
        console.log(`${status} ${result.statusCode}`)
    })

    const successfulCodes = results.filter(r => r.success).map(r => r.statusCode)
    if (successfulCodes.length > 0) {
        console.log('\n🎯 Successful status codes:')
        successfulCodes.forEach(code => console.log(`   ${code}`))
    } else {
        console.log('\n⚠️ No successful status codes found')
    }
}

main() 