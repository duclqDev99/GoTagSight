const axios = require('axios')

// Token mới từ production API
const FRESH_TOKEN = 'CFWrVr3n2NX8cTV0zYydDEXycvq0g9ruVlfJuIB1MiL0872qb4g0TVCJk1cG'

// Logic tự động điều chỉnh status code (giống như trong src/main/api.ts)
function adjustStatusCode(statusCodeString) {
    let safeStatusCode = statusCodeString

    // Nếu status code có bất kỳ bước nào = 0 (trừ C), thay đổi thành 1 để tránh lùi bước
    const stepsToCheck = ['I', 'T', 'U', 'S', 'D', 'F', 'R', 'P', 'E', 'V']

    stepsToCheck.forEach(step => {
        const pattern = new RegExp(`${step}0`, 'g')
        if (safeStatusCode.match(pattern)) {
            safeStatusCode = safeStatusCode.replace(pattern, `${step}1`)
            console.log(`⚠️ Status code adjusted from ${step}0 to ${step}1 to avoid step regression`)
        }
    })

    // Đảm bảo tất cả các bước cần thiết đều có mặt
    const requiredSteps = ['C', 'F', 'R', 'P', 'E', 'V', 'I', 'T', 'U', 'S', 'D']
    requiredSteps.forEach(step => {
        if (!safeStatusCode.includes(step)) {
            safeStatusCode += `${step}1`
            console.log(`⚠️ Added missing step ${step}1 to status code`)
        }
    })

    return safeStatusCode
}

async function testAddToInventory() {
    console.log('=== Test Add to Inventory with Fresh Token ===\n')

    // Test với các status code khác nhau
    const testCases = [
        {
            name: 'Status code có I0 (sẽ bị điều chỉnh)',
            original: 'C1F1R1P1E1V1I0',
            expected: 'C1F1R1P1E1V1I1'
        },
        {
            name: 'Status code thiếu một số bước (sẽ được thêm)',
            original: 'C1F1R1',
            expected: 'C1F1R1P1E1V1I1T1U1S1D1'
        },
        {
            name: 'Status code hoàn chỉnh (không thay đổi)',
            original: 'C1F1R1P1E1V1I1T1U1S1D1',
            expected: 'C1F1R1P1E1V1I1T1U1S1D1'
        }
    ]

    for (const testCase of testCases) {
        console.log(`🧪 Testing: ${testCase.name}`)
        console.log(`Original: ${testCase.original}`)

        const adjusted = adjustStatusCode(testCase.original)
        console.log(`Adjusted: ${adjusted}`)
        console.log(`Expected: ${testCase.expected}`)
        console.log(`✅ Match: ${adjusted === testCase.expected ? 'YES' : 'NO'}`)
        console.log('')
    }

    // Test API call với status code đã được điều chỉnh
    console.log('🚀 Testing API call with adjusted status code...')

    const testStatusCode = 'C1F1R1P1E1V1I0' // Có I0 sẽ bị điều chỉnh thành I1
    const adjustedStatusCode = adjustStatusCode(testStatusCode)

    console.log(`Original status code: ${testStatusCode}`)
    console.log(`Adjusted status code: ${adjustedStatusCode}`)

    try {
        const response = await axios.post('https://production.trackingis.info/api/v2/order-details/update-status-code', {
            status_code_string: adjustedStatusCode,
            ids: [484875] // Sử dụng ID từ test trước
        }, {
            headers: {
                'Authorization': `Bearer ${FRESH_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': ''
            }
        })

        console.log('\n✅ API call successful!')
        console.log('Status:', response.status)
        console.log('Response:', response.data)

        if (response.data && response.data.status === true) {
            console.log('🎉 Add to Inventory successful!')
        } else {
            console.log('⚠️ API returned success but status is false')
        }

    } catch (error) {
        console.error('\n❌ API call failed:')
        if (error.response) {
            console.error('Status:', error.response.status)
            console.error('Data:', error.response.data)
        } else {
            console.error('Error:', error.message)
        }
    }
}

// Chạy test
testAddToInventory().catch(console.error) 