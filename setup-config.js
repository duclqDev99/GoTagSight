#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Encryption key - CHANGE THIS TO YOUR OWN SECRET KEY!
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-super-secret-key-change-this';

function encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

function saveConfig(config) {
    const configPath = path.join(__dirname, 'src/config.encrypted');
    const jsonConfig = JSON.stringify(config, null, 2);
    const encrypted = encrypt(jsonConfig);

    try {
        // Tạo thư mục nếu chưa có
        const dir = path.dirname(configPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(configPath, encrypted);
        console.log('✅ Configuration saved successfully!');
        console.log('📁 Config file location:', configPath);
    } catch (error) {
        console.error('❌ Failed to save config:', error);
    }
}

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setupConfig() {
    console.log('🔧 GoTagSight Database Configuration Setup');
    console.log('==========================================\n');

    console.log('⚠️  IMPORTANT: Change the ENCRYPTION_KEY in setup-config.js for production use!\n');

    // Database configuration
    console.log('📊 Database Configuration:');
    const host = await question('Host (default: localhost): ') || 'localhost';
    const port = parseInt(await question('Port (default: 3306): ') || '3306');
    const user = await question('Username: ');
    const password = await question('Password: ');
    const database = await question('Database name: ');
    const tableName = await question('Table name (default: order_details): ') || 'order_details';

    // Image path
    console.log('\n📁 Image Configuration:');
    const imagePath = await question('Image folder path: ');

    // Create config object
    const config = {
        database: {
            host,
            port,
            user,
            password,
            database,
            tableName
        },
        imagePath,
        encryptionKey: ENCRYPTION_KEY
    };

    // Show summary
    console.log('\n📋 Configuration Summary:');
    console.log('========================');
    console.log(`Host: ${host}`);
    console.log(`Port: ${port}`);
    console.log(`User: ${user}`);
    console.log(`Database: ${database}`);
    console.log(`Table: ${tableName}`);
    console.log(`Image Path: ${imagePath}`);
    console.log('');

    const confirm = await question('Save this configuration? (y/N): ');

    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
        saveConfig(config);
        console.log('\n🎉 Configuration setup complete!');
        console.log('🚀 You can now run: npm run dev');
    } else {
        console.log('\n❌ Configuration cancelled.');
    }

    rl.close();
}

// Security warning
console.log('🔒 SECURITY WARNING:');
console.log('====================');
console.log('1. Change the ENCRYPTION_KEY in this file before production use');
console.log('2. Keep your config file secure and do not commit it to version control');
console.log('3. Use environment variables for sensitive data in production');
console.log('');

setupConfig().catch(console.error); 