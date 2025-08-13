const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

console.log('=== Check Current Config ===')

function decrypt(encryptedText, encryptionKey) {
    try {
        const algorithm = 'aes-256-cbc'
        const key = crypto.scryptSync(encryptionKey, 'salt', 32)

        const parts = encryptedText.split(':')
        const iv = Buffer.from(parts[0], 'hex')
        const encrypted = parts[1]

        const decipher = crypto.createDecipheriv(algorithm, key, iv)
        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    } catch (error) {
        console.error('Failed to decrypt:', error.message)
        return null
    }
}

function checkConfig() {
    try {
        // Tìm config file
        const userDataPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Library', 'Application Support', 'GoTagSight')
        const configPath = path.join(userDataPath, 'config.encrypted')

        console.log('Config path:', configPath)

        if (!fs.existsSync(configPath)) {
            console.log('❌ Config file not found')
            return
        }

        // Đọc và giải mã config
        const encrypted = fs.readFileSync(configPath, 'utf8')
        const encryptionKey = process.env.ENCRYPTION_KEY || 'your-secret-key-change-this'

        const decrypted = decrypt(encrypted, encryptionKey)
        if (!decrypted) {
            console.log('❌ Failed to decrypt config')
            return
        }

        const config = JSON.parse(decrypted)
        console.log('✅ Config loaded successfully')

        console.log('\n=== API Config ===')
        console.log('Base URL:', config.apiConfig?.baseURL)
        console.log('API Key:', config.apiConfig?.apiKey ? '***SET***' : 'NOT SET')
        console.log('Timeout:', config.apiConfig?.timeout)
        console.log('Environment:', config.apiConfig?.environment)

        console.log('\n=== Environment URLs ===')
        console.log('Development:', config.apiConfig?.environmentUrls?.development)
        console.log('Staging:', config.apiConfig?.environmentUrls?.staging)
        console.log('Production:', config.apiConfig?.environmentUrls?.production)
        console.log('Custom:', config.apiConfig?.environmentUrls?.custom)

    } catch (error) {
        console.error('Error checking config:', error)
    }
}

checkConfig() 