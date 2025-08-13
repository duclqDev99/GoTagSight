const axios = require('axios')

console.log('=== Test Scan Function with MeiliSearch ===')

// Sử dụng cấu hình giống như trong ứng dụng
const meiliBaseURL = 'http://103.139.203.10:7700'
const apiKey = 'cbf33c1c50e471743a3212352244936d4cd4841f781506d19cc9c1a66ccb691e'

// Tạo client giống như trong ApiService
const meiliClient = axios.create({
    baseURL: meiliBaseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    }
})

async function testScanFunction() {
    try {
        console.log('1. Testing MeiliSearch scan connection...')
        console.log('Base URL:', meiliBaseURL)
        console.log('API Key:', `${apiKey.substring(0, 10)}...`)

        // Test với task code mẫu
        const taskCode = 'G0xr7j' // Sử dụng task code từ curl command của bạn

        const searchBody = {
            q: '',
            filter: `task_code_front_prefix = "${taskCode}"`,
            sort: ['created_at:desc'],
            attributesToRetrieve: [
                'id',
                'order_id',
                'quantity',
                'order',
                'origin_id',
                'task_code_front_prefix',
                'total_items_in_order',
                'task_code_front',
                'task_code_back',
                'created_at'
            ],
            hitsPerPage: 10,
            page: 1
        }

        console.log('\n2. Search body:')
        console.log(JSON.stringify(searchBody, null, 2))

        console.log('\n3. Making search request...')
        const response = await meiliClient.post('/indexes/order_details/search', searchBody)

        console.log('\n✅ Scan function successful!')
        console.log('Status:', response.status)
        console.log('Response data:', JSON.stringify(response.data, null, 2))

        if (response.data && response.data.hits) {
            console.log('\n4. Search Results:')
            console.log('Total hits:', response.data.totalHits)
            console.log('Found items:', response.data.hits.length)

            response.data.hits.forEach((hit, index) => {
                console.log(`\n--- Item ${index + 1} ---`)
                console.log('ID:', hit.id)
                console.log('Order ID:', hit.order_id)
                console.log('Task Code Front:', hit.task_code_front)
                console.log('Task Code Back:', hit.task_code_back)
                console.log('Quantity:', hit.quantity)
                console.log('Total Items in Order:', hit.total_items_in_order)

                if (hit.order) {
                    console.log('Customer Name:', hit.order.customer_name)
                    console.log('Origin ID:', hit.order.origin_id)
                }
            })
        }

    } catch (error) {
        console.error('\n❌ Scan function failed:')
        console.error('Error:', error.message)
        if (error.response) {
            console.error('Status:', error.response.status)
            console.error('Data:', error.response.data)
        }
    }
}

testScanFunction() 