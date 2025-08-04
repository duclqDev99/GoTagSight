import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    getOrders: (code: string) => ipcRenderer.invoke('get-orders', code),
    updateOrderStatus: (orderId: number, status: string, notes?: string) =>
        ipcRenderer.invoke('update-order-status', orderId, status, notes),
    updateOrderStatusCode: (orderId: number, statusCodeString: string) =>
        ipcRenderer.invoke('update-order-status-code', orderId, statusCodeString),
    getConfig: () => ipcRenderer.invoke('get-config'),
    setConfig: (config: any) => ipcRenderer.invoke('set-config', config),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    testDatabaseConnection: () => ipcRenderer.invoke('test-database-connection'),
    createSampleData: () => ipcRenderer.invoke('create-sample-data'),
    checkFileExists: (filePath: string) => ipcRenderer.invoke('check-file-exists', filePath),
    getImageData: (filePath: string) => ipcRenderer.invoke('get-image-data', filePath),
    listFiles: (dirPath: string) => ipcRenderer.invoke('list-files', dirPath),
    convertFileToImage: (filePath: string) => ipcRenderer.invoke('convert-file-to-image', filePath),
    printBarcode: (barcodeData: string, orderInfo?: any) => ipcRenderer.invoke('print-barcode', barcodeData, orderInfo),
    testBarTenderConnection: () => ipcRenderer.invoke('test-barTender-connection'),
    getBarTenderConfig: () => ipcRenderer.invoke('get-barTender-config'),
    setBarTenderConfig: (config: any) => ipcRenderer.invoke('set-barTender-config', config)
})

declare global {
    interface Window {
        electronAPI: {
            getOrders: (taskCode: string) => Promise<any[]>
            updateOrderStatus: (orderId: number, status: string, notes?: string) => Promise<boolean>
            updateOrderStatusCode: (orderId: number, statusCodeString: string) => Promise<boolean>
            getConfig: () => Promise<any>
            setConfig: (config: any) => Promise<boolean>
            selectFolder: () => Promise<string>
            testDatabaseConnection: (dbConfig: any) => Promise<{ success: boolean, message: string }>
            createSampleData: () => Promise<{ success: boolean, message: string }>
            checkFileExists: (filePath: string) => Promise<boolean>
            getImageData: (filePath: string) => Promise<string | null>
            listFiles: (dirPath: string) => Promise<string[]>
            convertFileToImage: (filePath: string) => Promise<string | null>
        }
    }
} 