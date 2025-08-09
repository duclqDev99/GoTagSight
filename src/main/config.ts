import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { ApiConfig } from './api'

export interface DatabaseConfig {
    host: string
    port: number
    user: string
    password: string
    database: string
    tableName: string
}

export interface BarTenderConfig {
    enabled: boolean
    method: 'named_pipe' | 'http' | 'file' | 'excel'
    namedPipePath?: string
    httpUrl?: string
    filePath?: string
    excelPath?: string
    templateName?: string
    printQuantity?: number
    autoPrint?: boolean
    bartenderPath?: string
    templatePath?: string
    printScriptPath?: string
    printMethod?: 'direct' | 'script'
}

export interface AppConfig {
    database: DatabaseConfig
    apiConfig: ApiConfig // Thêm API config
    imagePath: string
    barTenderConfig: BarTenderConfig
    encryptionKey: string
}

class ConfigManager {
    private configPath: string
    private encryptionKey: string
    private config: AppConfig | null = null

    constructor() {
        this.configPath = path.join(app.getPath('userData'), 'config.encrypted')
        this.encryptionKey = process.env.ENCRYPTION_KEY || 'your-secret-key-change-this'
    }

    // Mã hóa dữ liệu
    private encrypt(text: string): string {
        const algorithm = 'aes-256-cbc'
        const key = crypto.scryptSync(this.encryptionKey, 'salt', 32)
        const iv = crypto.randomBytes(16)

        const cipher = crypto.createCipheriv(algorithm, key, iv)
        let encrypted = cipher.update(text, 'utf8', 'hex')
        encrypted += cipher.final('hex')

        return iv.toString('hex') + ':' + encrypted
    }

    // Giải mã dữ liệu
    private decrypt(encryptedText: string): string {
        const algorithm = 'aes-256-cbc'
        const key = crypto.scryptSync(this.encryptionKey, 'salt', 32)

        const parts = encryptedText.split(':')
        const iv = Buffer.from(parts[0], 'hex')
        const encrypted = parts[1]

        const decipher = crypto.createDecipheriv(algorithm, key, iv)
        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    }

    // Tạo file cấu hình mẫu
    createDefaultConfig(): void {
        const defaultConfig: AppConfig = {
            database: {
                host: '127.0.0.1',
                port: 3306,
                user: 'root',
                password: '',
                database: 'production',
                tableName: 'order_details'
            },
            apiConfig: {
                baseURL: '',
                timeout: 10000,
                username: '',
                password: '',
                environment: 'development',
                environmentUrls: {
                    development: '',
                    staging: '',
                    production: '',
                    custom: ''
                }
            },
            imagePath: '/Users/macvn/Desktop/test-image',
            barTenderConfig: {
                enabled: false,
                method: 'file',
                filePath: path.join(process.cwd(), 'print_queue.json'),
                excelPath: path.join(process.cwd(), 'bartender_export.xlsx'),
                templateName: 'Default',
                printQuantity: 1,
                autoPrint: false,
                bartenderPath: '',
                templatePath: '',
                printScriptPath: '',
                printMethod: 'direct'
            },
            encryptionKey: this.encryptionKey
        }
        this.saveConfig(defaultConfig)
        console.log('Default config created. Please edit the config file.')
    }

    // Lưu cấu hình đã mã hóa
    saveConfig(config: AppConfig): void {
        try {
            const jsonConfig = JSON.stringify(config, null, 2)
            const encrypted = this.encrypt(jsonConfig)
            fs.writeFileSync(this.configPath, encrypted)
            console.log('Config saved successfully')
        } catch (error) {
            console.error('Failed to save config:', error)
        }
    }

    // Đọc cấu hình đã giải mã
    loadConfig(): AppConfig | null {
        try {
            if (!fs.existsSync(this.configPath)) {
                console.log('Config file not found. Creating default config...')
                this.createDefaultConfig()
                // Load config ngay sau khi tạo
                if (fs.existsSync(this.configPath)) {
                    const encrypted = fs.readFileSync(this.configPath, 'utf8')
                    const decrypted = this.decrypt(encrypted)
                    this.config = JSON.parse(decrypted) as AppConfig
                    return this.config
                }
                return null
            }

            const encrypted = fs.readFileSync(this.configPath, 'utf8')
            const decrypted = this.decrypt(encrypted)
            this.config = JSON.parse(decrypted) as AppConfig
            return this.config
        } catch (error) {
            console.error('Failed to load config:', error)
            return null
        }
    }

    // Lấy cấu hình hiện tại
    getConfig(): AppConfig | null {
        return this.loadConfig()
    }

    // Cập nhật cấu hình database
    updateDatabaseConfig(dbConfig: DatabaseConfig): void {
        if (!this.config) {
            this.config = {
                database: dbConfig,
                apiConfig: {
                    baseURL: '',
                    timeout: 10000,
                    username: '',
                    password: '',
                    apiKey: '',
                    environment: 'development',
                    environmentUrls: {
                        development: '',
                        staging: '',
                        production: '',
                        custom: ''
                    }
                },
                imagePath: '',
                barTenderConfig: {
                    enabled: false,
                    method: 'file',
                    filePath: path.join(process.cwd(), 'print_queue.json'),
                    excelPath: path.join(process.cwd(), 'bartender_export.xlsx'),
                    templateName: 'Default',
                    printQuantity: 1,
                    autoPrint: false,
                    bartenderPath: '',
                    templatePath: '',
                    printScriptPath: '',
                    printMethod: 'direct'
                },
                encryptionKey: this.encryptionKey
            }
        } else {
            this.config.database = dbConfig
        }
        this.saveConfig(this.config)
    }

    // Cập nhật cấu hình API
    updateApiConfig(apiConfig: ApiConfig): void {
        if (!this.config) {
            this.config = {
                database: {
                    host: 'localhost',
                    port: 3306,
                    user: '',
                    password: '',
                    database: '',
                    tableName: 'order_details'
                },
                apiConfig: apiConfig,
                imagePath: '',
                barTenderConfig: {
                    enabled: false,
                    method: 'file',
                    filePath: path.join(process.cwd(), 'print_queue.json'),
                    excelPath: path.join(process.cwd(), 'bartender_export.xlsx'),
                    templateName: 'Default',
                    printQuantity: 1,
                    autoPrint: false,
                    bartenderPath: '',
                    templatePath: '',
                    printScriptPath: '',
                    printMethod: 'direct'
                },
                encryptionKey: this.encryptionKey
            }
        } else {
            this.config.apiConfig = apiConfig
        }
        this.saveConfig(this.config)
        console.log('API config saved:', apiConfig)
    }

    // Cập nhật đường dẫn ảnh
    updateImagePath(imagePath: string): void {
        if (!this.config) {
            this.config = this.loadConfig() || {
                database: {
                    host: 'localhost',
                    port: 3306,
                    user: '',
                    password: '',
                    database: '',
                    tableName: 'order_details'
                },
                apiConfig: {
                    baseURL: '',
                    timeout: 10000,
                    username: '',
                    password: '',
                    apiKey: '',
                    environment: 'development',
                    environmentUrls: {
                        development: '',
                        staging: '',
                        production: '',
                        custom: ''
                    }
                },
                imagePath,
                barTenderConfig: {
                    enabled: false,
                    method: 'file',
                    filePath: path.join(process.cwd(), 'print_queue.json'),
                    excelPath: path.join(process.cwd(), 'bartender_export.xlsx'),
                    templateName: 'Default',
                    printQuantity: 1,
                    autoPrint: false,
                    bartenderPath: '',
                    templatePath: '',
                    printScriptPath: '',
                    printMethod: 'direct'
                },
                encryptionKey: this.encryptionKey
            }
        } else {
            this.config.imagePath = imagePath
        }
        this.saveConfig(this.config)
    }

    // Lấy cấu hình database
    getDatabaseConfig(): DatabaseConfig | null {
        const config = this.loadConfig()
        return config?.database || null
    }

    // Lấy đường dẫn ảnh
    getImagePath(): string {
        const config = this.loadConfig()
        return config?.imagePath || ''
    }

    // Kiểm tra cấu hình có hợp lệ không
    validateConfig(): boolean {
        const config = this.loadConfig()
        if (!config) return false

        const db = config.database
        return !!(db.host && db.user && db.database && db.tableName)
    }
}

export const configManager = new ConfigManager() 