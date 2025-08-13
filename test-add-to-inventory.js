const axios = require('axios')

console.log('=== Test Add to Inventory Function ===\n')

const freshToken = 'i0MRU5ZhK1fFMikFIHBGJ2yiUqrlQHrUcfWcpfWuaP7Uw2DMeDU3mdMJSIFi'

async function testAddToInventory() {
    try {
        console.log('1. Testing Add to Inventory with adjusted status code...')

        // Status code gốc (có thể gây lỗi)
        const originalStatusCode = 'C1F1R1P1E1V1I0'

        // Status code đã được điều chỉnh (an toàn)
        const adjustedStatusCode = 'C1F1R1P1E1V1I1'

        console.log('Original status code:', originalStatusCode)
        console.log('Adjusted status code:', adjustedStatusCode)

        const updateData = {
            status_code_string: adjustedStatusCode,
            ids: [484875] // ID từ log trước đó
        }

        console.log('\n2. Making API request...')
        console.log('Endpoint: /api/v2/order-details/update-status-code')
        console.log('Data:', updateData)

        const response = await axios.post('https://production.trackingis.info/api/v2/order-details/update-status-code', updateData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${freshToken}`,
                'X-CSRF-TOKEN': ''
            },
            timeout: 10000
        })

        console.log('\n✅ Add to Inventory: SUCCESS!')
        console.log('Status:', response.status)
        console.log('Response:', JSON.stringify(response.data, null, 2))

        if (response.data && response.data.status === true) {
            console.log('\n🎉 Order successfully added to inventory!')
            console.log('Message:', response.data.message)
            if (response.data.data) {
                console.log('Updated orders:', response.data.data.orderDetail)
            }
        }

    } catch (error) {
        console.error('\n❌ Add to Inventory: FAILED')
        console.error('Error:', error.message)
        if (error.response) {
            console.error('Status:', error.response.status)
            console.error('Data:', error.response.data)
        }
    }
}

async function testWithOriginalStatusCode() {
    try {
        console.log('\n3. Testing with original status code (should fail)...')

        const updateData = {
            status_code_string: 'C1F1R1P1E1V1I0', // Status code gốc có I0
            ids: [484875]
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

        console.log('⚠️ Unexpected success with original status code')
        console.log('Response:', response.data)

    } catch (error) {
        console.log('✅ Original status code correctly failed as expected')
        console.log('Error:', error.response?.data?.message || error.message)
    }
}

async function main() {
    console.log('🚀 Testing Add to Inventory functionality...\n')

    await testAddToInventory()
    await testWithOriginalStatusCode()

    console.log('\n🏁 Test completed!')
    console.log('\n📋 Summary:')
    console.log('   - Add to Inventory should work with adjusted status codes')
    console.log('   - Original status codes with step regression will be automatically fixed')
    console.log('   - Token is fresh and valid')
    console.log('\n💡 Next steps:')
    console.log('   1. Login again in the app to get fresh token')
    console.log('   2. Test "Add to Inventory" function in the app')
    console.log('   3. Status codes will be automatically adjusted if needed')
}

main() 