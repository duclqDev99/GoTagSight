const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

console.log('=== Fix MeiliSearch Configuration ===')

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

function encrypt(text, encryptionKey) {
    try {
        const algorithm = 'aes-256-cbc'
        const key = crypto.scryptSync(encryptionKey, 'salt', 32)
        const iv = crypto.randomBytes(16)

        const cipher = crypto.createCipheriv(algorithm, key, iv)
        let encrypted = cipher.update(text, 'utf8', 'hex')
        encrypted += cipher.final('hex')

        return iv.toString('hex') + ':' + encrypted
    } catch (error) {
        console.error('Failed to encrypt:', error.message)
        return null
    }
}

function fixMeiliConfig() {
    try {
        // Tìm config file
        const userDataPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Library', 'Application Support', 'GoTagSight')
        const configPath = path.join(userDataPath, 'config.encrypted')

        console.log('Config path:', configPath)

        if (!fs.existsSync(configPath)) {
            console.log('❌ Config file not found')
            return
        }

        // Đọc và giải mã config hiện tại
        const encrypted = fs.readFileSync(configPath, 'utf8')
        const encryptionKey = process.env.ENCRYPTION_KEY || 'your-secret-key-change-this'

        const decrypted = decrypt(encrypted, encryptionKey)
        if (!decrypted) {
            console.log('❌ Failed to decrypt config')
            return
        }

        const config = JSON.parse(decrypted)
        console.log('✅ Current config loaded')

        // Cập nhật cấu hình MeiliSearch
        console.log('\n🔄 Updating MeiliSearch configuration...')

        config.apiConfig = {
            baseURL: 'http://103.139.203.10:7700', // Chỉ baseURL, không bao gồm endpoint
            timeout: 10000,
            username: '',
            password: '',
            apiKey: 'cbf33c1c50e471743a3212352244936d4cd4841f781506d19cc9c1a66ccb691e', // API key cho MeiliSearch
            environment: 'custom',
            environmentUrls: {
                development: 'http://localhost:8000',
                staging: '',
                production: 'https://production.trackingis.info',
                custom: 'http://103.139.203.10:7700'
            },
            // API riêng cho update operations
            updateApiBaseURL: 'https://production.trackingis.info',
            updateApiKey: ''
        }

        console.log('\n📝 New API Config:')
        console.log('Base URL:', config.apiConfig.baseURL)
        console.log('API Key:', config.apiConfig.apiKey ? '***SET***' : 'NOT SET')
        console.log('Update API Base URL:', config.apiConfig.updateApiBaseURL)

        // Mã hóa và lưu config mới
        const newJsonConfig = JSON.stringify(config, null, 2)
        const newEncrypted = encrypt(newJsonConfig, encryptionKey)

        if (newEncrypted) {
            fs.writeFileSync(configPath, newEncrypted)
            console.log('\n✅ MeiliSearch configuration updated successfully!')
            console.log('\n🔄 Please restart the application to apply changes.')
        } else {
            console.log('\n❌ Failed to encrypt new config')
        }

    } catch (error) {
        console.error('Error fixing MeiliSearch config:', error)
    }
}

fixMeiliConfig() 