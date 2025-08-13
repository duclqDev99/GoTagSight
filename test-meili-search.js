const axios = require('axios')

console.log('=== Test MeiliSearch Search ===')

// Tạo client với MeiliSearch URL (không có API key)
const meiliClient = axios.create({
    baseURL: 'http://103.139.203.10:7700',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})

async function testMeiliSearch() {
    try {
        console.log('1. Testing MeiliSearch connection...')

        const searchBody = {
            q: '',
            filter: `task_code_front_prefix = "YMQRWL"`,
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

        console.log('Search URL:', 'http://103.139.203.10:7700/indexes/order_details/search')
        console.log('Search body:', JSON.stringify(searchBody, null, 2))

        const response = await meiliClient.post('/indexes/order_details/search', searchBody)

        console.log('✅ MeiliSearch search successful!')
        console.log('Status:', response.status)
        console.log('Response data:', JSON.stringify(response.data, null, 2))

        if (response.data && response.data.hits) {
            console.log('Found hits:', response.data.hits.length)
            console.log('Total hits:', response.data.totalHits)
        }

    } catch (error) {
        console.error('❌ MeiliSearch search failed:')
        console.error('Error:', error.message)
        if (error.response) {
            console.error('Status:', error.response.status)
            console.error('Data:', error.response.data)
        }
    }
}

testMeiliSearch() 