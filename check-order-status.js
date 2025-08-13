const axios = require('axios')

console.log('=== Check Current Order Status ===\n')

const freshToken = 'i0MRU5ZhK1fFMikFIHBGJ2yiUqrlQHrUcfWcpfWuaP7Uw2DMeDU3mdMJSIFi'

async function checkOrderStatus() {
    try {
        console.log('1. Checking current order status...')

        const orderId = 484875

        // Thử lấy thông tin order từ MeiliSearch
        const meiliResponse = await axios.post('http://103.139.203.10:7700/indexes/order_details/search', {
            q: '',
            filter: `id = ${orderId}`,
            attributesToRetrieve: ['id', 'order_id', 'status_code_string', 'order']
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Bearer cbf33c1c50e471743a3212352244936d4cd4841f781506d19cc9c1a66ccb691e'
            }
        })

        if (meiliResponse.data && meiliResponse.data.hits && meiliResponse.data.hits.length > 0) {
            const order = meiliResponse.data.hits[0]
            console.log('✅ Order found in MeiliSearch:')
            console.log('ID:', order.id)
            console.log('Order ID:', order.order_id)
            console.log('Current Status Code:', order.status_code_string)

            if (order.order && order.order.order_details && order.order.order_details.length > 0) {
                const orderDetail = order.order.order_details[0]
                console.log('Order Detail Status Code:', orderDetail.status_code_string)
                console.log('Order Detail Status:', orderDetail.status)
            }

            return order.status_code_string || order.order?.order_details?.[0]?.status_code_string
        }

        console.log('❌ Order not found in MeiliSearch')
        return null

    } catch (error) {
        console.error('❌ Failed to check order status:')
        console.error('Error:', error.message)
        return null
    }
}

async function testSafeStatusCodes(currentStatus) {
    console.log('\n2. Testing safe status codes...')
    console.log('Current status:', currentStatus)

    // Các status code an toàn (không lùi bước)
    const safeStatusCodes = [
        'C1F1R1P1E1V1I1T1U1S1D1', // Tất cả bước = 1
        'C1F1R1P1E1V1I1T1U1S1D0', // Chỉ D = 0
        'C1F1R1P1E1V1I1T1U1S0D0', // S = 0, D = 0
        'C1F1R1P1E1V1I1T1U0S0D0', // U = 0, S = 0, D = 0
        'C1F1R1P1E1V1I1T0U0S0D0', // T = 0, U = 0, S = 0, D = 0
        'C1F1R1P1E1V1I0T0U0S0D0', // I = 0, T = 0, U = 0, S = 0, D = 0
    ]

    const results = []

    for (const statusCode of safeStatusCodes) {
        try {
            console.log(`\nTesting: ${statusCode}`)

            const response = await axios.post('https://production.trackingis.info/api/v2/order-details/update-status-code', {
                status_code_string: statusCode,
                ids: [484875]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${freshToken}`,
                    'X-CSRF-TOKEN': ''
                },
                timeout: 10000
            })

            console.log(`✅ ${statusCode}: SUCCESS`)
            results.push({ statusCode, success: true, response: response.data })

        } catch (error) {
            console.log(`❌ ${statusCode}: FAILED`)
            console.log('   Error:', error.response?.data?.message || error.message)
            results.push({ statusCode, success: false, error: error.response?.data?.message || error.message })
        }
    }

    return results
}

async function main() {
    console.log('🚀 Checking order status and testing safe codes...\n')

    const currentStatus = await checkOrderStatus()
    const results = await testSafeStatusCodes(currentStatus)

    console.log('\n📊 Results Summary:')
    results.forEach(result => {
        const status = result.success ? '✅' : '❌'
        console.log(`${status} ${result.statusCode}`)
    })

    const successfulCodes = results.filter(r => r.success).map(r => r.statusCode)
    if (successfulCodes.length > 0) {
        console.log('\n🎯 Successful status codes:')
        successfulCodes.forEach(code => console.log(`   ${code}`))

        // Chọn status code đơn giản nhất
        const recommendedCode = successfulCodes[0]
        console.log(`\n💡 Recommended status code: ${recommendedCode}`)
    } else {
        console.log('\n⚠️ No successful status codes found')
    }
}

main() 