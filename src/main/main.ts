import { app, BrowserWindow, ipcMain, dialog, protocol, nativeImage } from 'electron'
import * as crypto from 'crypto'
import * as path from 'path'
import * as fs from 'fs'
// import { dbManager } from './database'
import { configManager, DatabaseConfig } from './config'
import { BarTenderIntegration } from './barTenderIntegration'
import { ApiService } from './api'

let mainWindow: BrowserWindow | null = null
let apiService: ApiService | null = null

// Register custom protocol as privileged BEFORE app is ready — bypass CORS/CSP,
// allow <img src="safe-image://..."> to stream files directly from disk without base64.
protocol.registerSchemesAsPrivileged([
    {
        scheme: 'safe-image',
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            stream: true,
            bypassCSP: true
        }
    }
])

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../assets/icon.png')
    })

    // Load the app
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
    if (isDev && mainWindow) {
        // Wait a bit for Vite dev server to start
        setTimeout(() => {
            if (mainWindow) {
                // Try different ports in case 3000 is busy
                const ports = [3000, 3001, 3002, 3003, 3004, 3005]
                let currentPort = 0

                const tryLoadURL = () => {
                    if (currentPort >= ports.length) {
                        console.error('Could not connect to Vite dev server')
                        return
                    }

                    const port = ports[currentPort]
                    const url = `http://localhost:${port}`

                    if (mainWindow) {
                        mainWindow.loadURL(url).catch(() => {
                            currentPort++
                            setTimeout(tryLoadURL, 500)
                        })
                    }
                }

                tryLoadURL()
                if (mainWindow) {
                    mainWindow.webContents.openDevTools()
                }
            }
        }, 2000)
    } else if (mainWindow) {
        mainWindow.loadFile(path.join(__dirname, '../dist/renderer/src/renderer/index.html'))
    }

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

app.whenReady().then(() => {
    // safe-image://<encoded-absolute-path> → stream local file directly
    protocol.registerFileProtocol('safe-image', (request, callback) => {
        try {
            const raw = request.url.replace(/^safe-image:\/\//, '')
            // Strip optional leading slash that the URL parser inserts for host-less schemes
            const noLeadSlash = raw.startsWith('/') ? raw.slice(1) : raw
            const decoded = decodeURIComponent(noLeadSlash)
            // Paths coming from ES are absolute (e.g. /Volumes/...). Ensure leading slash.
            const absPath = decoded.startsWith('/') ? decoded : '/' + decoded
            callback({ path: absPath })
        } catch (err) {
            console.error('safe-image protocol error:', err)
            callback({ error: -2 })
        }
    })

    createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// IPC handlers for API operations
ipcMain.handle('get-orders', async (event, taskCode: string) => {
    try {
        const config = configManager.getConfig()
        if (!config || !config.apiConfig) {
            return { orders: [], totalFound: 0, validOrders: 0 }
        }

        // Create or update API service
        if (!apiService) {
            apiService = new ApiService(config.apiConfig)
        }

        const result = await apiService.searchOrders(taskCode)
        return result
    } catch (error) {
        console.error('Failed to get orders:', error)
        return { orders: [], totalFound: 0, validOrders: 0 }
    }
})

// Authentication handlers
ipcMain.handle('set-auth-token', async (event, token: string | null) => {
    try {
        console.log('=== DEBUG: Setting auth token in main process ===')
        console.log('Token received:', token ? `${token.substring(0, 20)}...` : 'null')

        const config = configManager.getConfig()
        if (!config || !config.apiConfig) {
            console.error('No config or apiConfig found')
            return false
        }

        // Always create a new API service instance to ensure clean state
        console.log('Creating new ApiService instance')
        apiService = new ApiService(config.apiConfig)

        // Set authentication token
        apiService.setAuthToken(token)
        console.log('✅ Token set successfully in ApiService')

        // Verify token is set
        if (apiService.hasAuthToken()) {
            console.log('✅ Token verification: Token is properly set')
        } else {
            console.error('❌ Token verification: Token is not set')
            return false
        }

        return true
    } catch (error) {
        console.error('Failed to set auth token:', error)
        return false
    }
})

ipcMain.handle('update-order-status', async (event, orderId: number, status: string, notes?: string) => {
    try {
        const config = configManager.getConfig()
        if (!config || !config.apiConfig) {
            return false
        }

        const apiService = new ApiService(config.apiConfig)
        return await apiService.updateOrderStatus(orderId, status, notes)
    } catch (error) {
        console.error('Failed to update order status:', error)
        return false
    }
})

ipcMain.handle('update-order-status-code', async (event, orderId: number, statusCodeString: string) => {
    try {
        const config = configManager.getConfig()
        if (!config || !config.apiConfig) {
            return false
        }

        const apiService = new ApiService(config.apiConfig)
        return await apiService.updateOrderStatusCode(orderId, statusCodeString)
    } catch (error) {
        console.error('Failed to update order status code:', error)
        return false
    }
})

ipcMain.handle('update-order-status-codes', async (event, ids: number[], statusCodeString: string) => {
    try {
        console.log('=== DEBUG: update-order-status-codes called ===')
        console.log('IDs:', ids)
        console.log('Status code string:', statusCodeString)

        const config = configManager.getConfig()
        if (!config || !config.apiConfig) {
            console.error('No config or apiConfig found')
            return false
        }

        // Ensure API service exists and has token
        if (!apiService) {
            console.log('Creating new ApiService instance')
            apiService = new ApiService(config.apiConfig)
        } else {
            console.log('Using existing ApiService instance')
        }

        // Check if token is set
        if (!apiService.hasAuthToken()) {
            console.error('❌ No auth token set in ApiService')
            return false
        }

        console.log('✅ Calling ApiService.updateOrderStatusCodes')
        const result = await apiService.updateOrderStatusCodes(ids, statusCodeString)
        console.log('API call result:', result)
        return result
    } catch (error) {
        console.error('Failed to update order status codes:', error)
        return false
    }
})

ipcMain.handle('get-config', async () => {
    const config = configManager.getConfig()
    return {
        imagePath: configManager.getImagePath(),
        databaseConfig: configManager.getDatabaseConfig(),
        apiConfig: config?.apiConfig || null,
        barTenderConfig: config?.barTenderConfig || null,
        elasticsearchConfig: configManager.getElasticsearchConfig(),
        thumbServerConfig: configManager.getThumbServerConfig()
    }
})

ipcMain.handle('set-config', async (_event, config: any) => {
    try {
        if (config.imagePath !== undefined) {
            configManager.updateImagePath(config.imagePath)
        }
        if (config.databaseConfig) {
            configManager.updateDatabaseConfig(config.databaseConfig)
        }
        if (config.apiConfig) {
            configManager.updateApiConfig(config.apiConfig)
        }
        if (config.elasticsearchConfig) {
            configManager.updateElasticsearchConfig(config.elasticsearchConfig)
        }
        if (config.thumbServerConfig) {
            configManager.updateThumbServerConfig(config.thumbServerConfig)
        }
        return true
    } catch (error) {
        console.error('Failed to save config:', error)
        return false
    }
})

ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ['openDirectory']
    })
    return result.filePaths[0] || ''
})

ipcMain.handle('test-database-connection', async () => {
    try {
        const config = configManager.getConfig()
        console.log('Config for API test:', config?.apiConfig)

        if (!config || !config.apiConfig) {
            console.log('No API config found')
            return false
        }

        if (!config.apiConfig.baseURL) {
            console.log('Base URL is empty')
            return false
        }

        console.log('Creating ApiService with config:', config.apiConfig)
        const apiService = new ApiService(config.apiConfig)
        const result = await apiService.testConnection()
        console.log('API test result:', result)
        return result
    } catch (error) {
        console.error('Failed to test API connection:', error)
        return false
    }
})

// ipcMain.handle('create-sample-data', async (event) => {
//     try {
//         const connected = await dbManager.connect()
//         if (connected) {
//             await dbManager.createSampleData()
//             return { success: true, message: 'Sample data created successfully' }
//         }
//         return { success: false, message: 'Failed to connect to database' }
//     } catch (error) {
//         console.error('Failed to create sample data:', error)
//         return { success: false, message: `Error: ${error}` }
//     }
// })

ipcMain.handle('validate-config', async () => {
    return configManager.validateConfig()
})

ipcMain.handle('check-file-exists', async (event, filePath: string) => {
    try {
        const fs = require('fs')
        return fs.existsSync(filePath)
    } catch (error) {
        console.error('Failed to check file exists:', error)
        return false
    }
})

ipcMain.handle('get-image-data', async (event, filePath: string) => {
    try {
        const fs = require('fs')
        const path = require('path')

        if (!fs.existsSync(filePath)) {
            return null
        }

        const imageBuffer = fs.readFileSync(filePath)
        const base64Data = imageBuffer.toString('base64')
        const ext = path.extname(filePath).toLowerCase()

        let mimeType = 'image/png'
        if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg'
        else if (ext === '.gif') mimeType = 'image/gif'
        else if (ext === '.bmp') mimeType = 'image/bmp'
        else if (ext === '.webp') mimeType = 'image/webp'
        else if (ext === '.ai') mimeType = 'application/postscript'
        else if (ext === '.pdf') mimeType = 'application/pdf'

        return `data:${mimeType};base64,${base64Data}`
    } catch (error) {
        console.error('Failed to get image data:', error)
        return null
    }
})

ipcMain.handle('get-image-thumbnail', async (_event, filePath: string, maxDim: number = 1200) => {
    try {
        // Async stat — does not block event loop while SMB responds
        const stat = await fs.promises.stat(filePath).catch(() => null)
        if (!stat) return null

        // Cache key = hash of (path + mtime + maxDim) so edits invalidate it.
        const hash = crypto
            .createHash('sha1')
            .update(`${filePath}|${stat.mtimeMs}|${maxDim}`)
            .digest('hex')
        const cacheDir = path.join(app.getPath('userData'), 'thumbs')
        await fs.promises.mkdir(cacheDir, { recursive: true }).catch(() => {})
        const cachePath = path.join(cacheDir, `${hash}.jpg`)

        // Hot path: cache hit → return immediately, no SMB read
        const cacheHit = await fs.promises.access(cachePath).then(() => true).catch(() => false)
        if (cacheHit) return cachePath

        // Async read — biggest win: SMB transfer no longer blocks event loop
        const buffer = await fs.promises.readFile(filePath)

        // Decode/resize/encode are sync but operate in-memory & are fast for normal images
        const img = nativeImage.createFromBuffer(buffer)
        if (img.isEmpty()) {
            // Can't decode (e.g. .psd) → fall back to original file path
            return filePath
        }
        const size = img.getSize()
        const scale = Math.min(1, maxDim / Math.max(size.width, size.height))
        const resized = scale < 1
            ? img.resize({
                width: Math.round(size.width * scale),
                height: Math.round(size.height * scale),
                quality: 'good'
            })
            : img
        await fs.promises.writeFile(cachePath, resized.toJPEG(85))
        return cachePath
    } catch (error) {
        console.error('Failed to get image thumbnail:', error)
        return null
    }
})

ipcMain.handle('get-thumb-cache-stats', async () => {
    try {
        const cacheDir = path.join(app.getPath('userData'), 'thumbs')
        if (!fs.existsSync(cacheDir)) return { count: 0, totalBytes: 0, dir: cacheDir }
        let count = 0
        let totalBytes = 0
        const files = fs.readdirSync(cacheDir)
        for (const f of files) {
            try {
                const stat = fs.statSync(path.join(cacheDir, f))
                if (stat.isFile()) {
                    count++
                    totalBytes += stat.size
                }
            } catch { }
        }
        return { count, totalBytes, dir: cacheDir }
    } catch (error: any) {
        return { count: 0, totalBytes: 0, error: error?.message || String(error) }
    }
})

ipcMain.handle('clear-thumb-cache', async () => {
    try {
        const cacheDir = path.join(app.getPath('userData'), 'thumbs')
        if (!fs.existsSync(cacheDir)) return { success: true, deleted: 0, freedBytes: 0 }
        let deleted = 0
        let freedBytes = 0
        const files = fs.readdirSync(cacheDir)
        for (const f of files) {
            const fp = path.join(cacheDir, f)
            try {
                const stat = fs.statSync(fp)
                if (stat.isFile()) {
                    fs.unlinkSync(fp)
                    freedBytes += stat.size
                    deleted++
                }
            } catch { }
        }
        return { success: true, deleted, freedBytes }
    } catch (error: any) {
        return { success: false, error: error?.message || String(error), deleted: 0, freedBytes: 0 }
    }
})

ipcMain.handle('list-files', async (event, dirPath: string) => {
    try {
        const fs = require('fs')
        const path = require('path')

        if (!fs.existsSync(dirPath)) {
            return []
        }

        const files = fs.readdirSync(dirPath)
        return files.filter(file => {
            const ext = path.extname(file).toLowerCase()
            return ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.ai', '.pdf'].includes(ext)
        })
    } catch (error) {
        console.error('Failed to list files:', error)
        return []
    }
})

ipcMain.handle('convert-file-to-image', async (event, filePath: string) => {
    try {
        const fs = require('fs')
        const path = require('path')
        const { exec } = require('child_process')
        const { promisify } = require('util')
        const execAsync = promisify(exec)

        if (!fs.existsSync(filePath)) {
            return null
        }

        const ext = path.extname(filePath).toLowerCase()
        const outputPath = filePath.replace(ext, '_preview.png')

        let command = ''

        if (ext === '.ai' || ext === '.pdf') {
            // Convert AI/PDF to PNG using ImageMagick 7+
            command = `magick "${filePath}[0]" -resize 800x600 "${outputPath}"`
        } else {
            return null
        }

        try {
            await execAsync(command)

            if (fs.existsSync(outputPath)) {
                const imageBuffer = fs.readFileSync(outputPath)
                const base64Data = imageBuffer.toString('base64')

                // Clean up temporary file
                fs.unlinkSync(outputPath)

                return `data:image/png;base64,${base64Data}`
            }
        } catch (convertError) {
            console.error('Conversion failed:', convertError)
            return null
        }

        return null
    } catch (error) {
        console.error('Failed to convert file to image:', error)
        return null
    }
})

// BarTender Integration IPC handlers
ipcMain.handle('print-barcode', async (event, barcodeData: string, orderInfo?: any) => {
    try {
        const config = configManager.getConfig()
        console.log('BarTender config:', config?.barTenderConfig)

        if (!config || !config.barTenderConfig || !Boolean(config.barTenderConfig.enabled)) {
            return { success: false, message: 'BarTender integration is disabled' }
        }

        const barTender = new BarTenderIntegration(config.barTenderConfig)
        const success = await barTender.printBarcode(barcodeData, orderInfo)

        return {
            success,
            message: success ? 'Print command sent successfully' : 'Failed to send print command'
        }
    } catch (error) {
        console.error('BarTender print error:', error)
        return { success: false, message: `Print error: ${error}` }
    }
})

ipcMain.handle('test-barTender-connection', async () => {
    try {
        const config = configManager.getConfig()
        if (!config || !config.barTenderConfig.enabled) {
            return { success: false, message: 'BarTender integration is disabled' }
        }

        const barTender = new BarTenderIntegration(config.barTenderConfig)
        return await barTender.testConnection()
    } catch (error) {
        console.error('BarTender test error:', error)
        return { success: false, message: `Test error: ${error}` }
    }
})

// BarTender config IPC handlers
ipcMain.handle('get-barTender-config', async () => {
    try {
        const config = configManager.getConfig()
        return config?.barTenderConfig || null
    } catch (error) {
        console.error('Failed to get BarTender config:', error)
        return null
    }
})

ipcMain.handle('set-barTender-config', async (event, barTenderConfig: any) => {
    try {
        const config = configManager.getConfig()
        if (config) {
            config.barTenderConfig = barTenderConfig
            configManager.saveConfig(config)
            return true
        }
        return false
    } catch (error) {
        console.error('Failed to set BarTender config:', error)
        return false
    }
})

ipcMain.handle('test-es-connection', async (_event, esConfig: any) => {
    try {
        if (!esConfig || !esConfig.baseURL) {
            return { success: false, message: 'Base URL is required' }
        }
        const index = esConfig.index || 'nas_files'
        const url = `${String(esConfig.baseURL).replace(/\/$/, '')}/${index}/_search?size=1`
        const headers: any = { 'Content-Type': 'application/json' }
        if (esConfig.username && esConfig.password) {
            headers['Authorization'] = 'Basic ' + Buffer.from(`${esConfig.username}:${esConfig.password}`).toString('base64')
        }

        const controller = new AbortController()
        const timeoutMs = typeof esConfig.timeout === 'number' ? esConfig.timeout : 8000
        const timer = setTimeout(() => controller.abort(), timeoutMs)

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ query: { match_all: {} } }),
                signal: controller.signal
            })
            clearTimeout(timer)

            if (!res.ok) {
                const text = await res.text().catch(() => '')
                return { success: false, message: `ES responded ${res.status}`, detail: text?.slice(0, 200) }
            }
            const json: any = await res.json()
            const total = json?.hits?.total?.value ?? 0
            return { success: true, message: `Connected. Index "${index}" has ${total} documents.`, total }
        } catch (err: any) {
            clearTimeout(timer)
            return { success: false, message: `Connection failed: ${err?.message || err}` }
        }
    } catch (error: any) {
        return { success: false, message: `Error: ${error?.message || error}` }
    }
})

ipcMain.handle('search-images-by-code', async (_event, code: string) => {
    try {
        const config = configManager.getConfig() as any
        const esConfig = config?.elasticsearchConfig
        if (!esConfig || !esConfig.enabled || !esConfig.baseURL || !esConfig.index) {
            return { enabled: false, hits: [] }
        }

        const renderableExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ai', 'pdf']
        const fields = Array.isArray(esConfig.searchFields) && esConfig.searchFields.length > 0
            ? esConfig.searchFields
            : ['name^3', 'attachment.content', 'path']
        const size = typeof esConfig.size === 'number' && esConfig.size > 0 ? esConfig.size : 20

        const url = `${esConfig.baseURL.replace(/\/$/, '')}/${esConfig.index}/_search?_source_excludes=attachment.content`
        const body = {
            size,
            query: {
                multi_match: {
                    query: code,
                    fields
                }
            }
        }

        const headers: any = { 'Content-Type': 'application/json' }
        if (esConfig.username && esConfig.password) {
            headers['Authorization'] = 'Basic ' + Buffer.from(`${esConfig.username}:${esConfig.password}`).toString('base64')
        }

        const controller = new AbortController()
        const timeoutMs = typeof esConfig.timeout === 'number' ? esConfig.timeout : 8000
        const timer = setTimeout(() => controller.abort(), timeoutMs)

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: controller.signal
            })
            clearTimeout(timer)

            if (!res.ok) {
                const text = await res.text().catch(() => '')
                console.error('ES search failed:', res.status, text)
                return { enabled: true, hits: [], error: `ES ${res.status}` }
            }

            const json: any = await res.json()
            const rawHits = json?.hits?.hits || []
            const hits = rawHits
                .map((h: any) => {
                    const src = h._source || {}
                    const ext = String(src.ext || '').toLowerCase()
                    return {
                        id: h._id as string,
                        score: h._score as number,
                        name: src.name as string,
                        path: src.path as string,
                        ext,
                        size: src.size as number,
                        mtime: src.mtime as number,
                        dir: src.dir as string
                    }
                })
                .filter((h: any) => h.path && renderableExts.includes(h.ext))

            return { enabled: true, hits }
        } catch (err: any) {
            clearTimeout(timer)
            console.error('ES search error:', err?.message || err)
            return { enabled: true, hits: [], error: err?.message || String(err) }
        }
    } catch (error: any) {
        console.error('search-images-by-code failed:', error)
        return { enabled: false, hits: [], error: error?.message || String(error) }
    }
})

ipcMain.handle('export-order-to-excel', async (event, order, exportFolder) => {
    try {
        const config = configManager.getConfig()
        if (!config || !config.barTenderConfig) {
            return { success: false, message: 'BarTender config not found' }
        }
        // Ghi đè exportFolder nếu truyền vào
        const barTenderConfig = { ...config.barTenderConfig, excelPath: exportFolder }
        const barTender = new BarTenderIntegration(barTenderConfig)
        const success = await barTender.exportToExcel(order.task_code_front || order.task_code, order)
        return { success }
    } catch (error) {
        console.error('Export to Excel error:', error)
        return { success: false, message: error?.message || error }
    }
})