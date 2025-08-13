const axios = require('axios')

console.log('=== Test Both Functions: Scan + Update Status ===\n')

// 1. Test MeiliSearch Scan Function
async function testMeiliSearchScan() {
    console.log('🔍 Testing MeiliSearch Scan Function...')

    const meiliClient = axios.create({
        baseURL: 'http://103.139.203.10:7700',
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer cbf33c1c50e471743a3212352244936d4cd4841f781506d19cc9c1a66ccb691e'
        }
    })

    try {
        const searchBody = {
            q: '',
            filter: `task_code_front_prefix = "G0xr7j"`,
            sort: ['created_at:desc'],
            attributesToRetrieve: [
                'id', 'order_id', 'quantity', 'order', 'origin_id',
                'task_code_front_prefix', 'total_items_in_order',
                'task_code_front', 'task_code_back', 'created_at'
            ],
            hitsPerPage: 10,
            page: 1
        }

        const response = await meiliClient.post('/indexes/order_details/search', searchBody)

        if (response.data && response.data.hits && response.data.hits.length > 0) {
            const hit = response.data.hits[0]
            console.log('✅ MeiliSearch Scan: SUCCESS')
            console.log(`   Found: ${response.data.totalHits} items`)
            console.log(`   Sample ID: ${hit.id}`)
            console.log(`   Task Code: ${hit.task_code_front}`)
            console.log(`   Customer: ${hit.order?.customer_name || 'N/A'}`)
            return hit.id // Return ID for update test
        } else {
            console.log('❌ MeiliSearch Scan: No results found')
            return null
        }
    } catch (error) {
        console.log('❌ MeiliSearch Scan: FAILED')
        console.log(`   Error: ${error.message}`)
        return null
    }
}

// 2. Test Production API Update Status Function
async function testProductionUpdateStatus(orderId) {
    console.log('\n📝 Testing Production API Update Status Function...')

    if (!orderId) {
        console.log('⚠️  Skipping update test - no order ID from scan')
        return
    }

    const productionClient = axios.create({
        baseURL: 'https://production.trackingis.info',
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })

    try {
        // Note: You'll need to provide a valid token here
        const token = 'YOUR_VALID_TOKEN_HERE' // Replace with actual token
        productionClient.defaults.headers.common['Authorization'] = `Bearer ${token}`

        const updateBody = {
            status_code_string: 'C1F1R1P1E1V1I0',
            ids: [orderId]
        }

        console.log(`   Updating order ID: ${orderId}`)
        console.log(`   Status: ${updateBody.status_code_string}`)

        const response = await productionClient.post('/api/v2/order-details/update-status-code', updateBody)

        console.log('✅ Production Update: SUCCESS')
        console.log(`   Status: ${response.status}`)
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`)

    } catch (error) {
        console.log('❌ Production Update: FAILED')
        console.log(`   Error: ${error.message}`)
        if (error.response) {
            console.log(`   Status: ${error.response.status}`)
            console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`)
        }
    }
}

// 3. Main test function
async function runTests() {
    console.log('🚀 Starting comprehensive function tests...\n')

    // Test scan function first
    const orderId = await testMeiliSearchScan()

    // Test update function with the ID from scan
    await testProductionUpdateStatus(orderId)

    console.log('\n🏁 Test completed!')
    console.log('\n📋 Summary:')
    console.log('   - MeiliSearch Scan: Should work with your API key')
    console.log('   - Production Update: Needs valid token from login')
    console.log('\n💡 Next steps:')
    console.log('   1. Test scan function in the app with task code G0xr7j')
    console.log('   2. Login to get fresh token for production API')
    console.log('   3. Test update status function')
}

runTests() 