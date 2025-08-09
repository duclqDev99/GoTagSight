import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
// import { dbManager } from './database'
import { configManager, DatabaseConfig } from './config'
import { BarTenderIntegration } from './barTenderIntegration'
import { ApiService } from './api'

let mainWindow: BrowserWindow | null = null

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

app.whenReady().then(createWindow)

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

        const apiService = new ApiService(config.apiConfig)
        const result = await apiService.searchOrders(taskCode)
        return result
    } catch (error) {
        console.error('Failed to get orders:', error)
        return { orders: [], totalFound: 0, validOrders: 0 }
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

ipcMain.handle('get-config', async () => {
    const config = configManager.getConfig()
    return {
        imagePath: configManager.getImagePath(),
        databaseConfig: configManager.getDatabaseConfig(),
        apiConfig: config?.apiConfig || null
    }
})

ipcMain.handle('set-config', async (event, config: any) => {
    try {
        if (config.imagePath) {
            configManager.updateImagePath(config.imagePath)
        }
        if (config.databaseConfig) {
            configManager.updateDatabaseConfig(config.databaseConfig)
        }
        if (config.apiConfig) {
            configManager.updateApiConfig(config.apiConfig)
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