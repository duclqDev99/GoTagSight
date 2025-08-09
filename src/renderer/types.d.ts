declare global {
    interface Window {
        electronAPI: {
            getOrders: (code: string) => Promise<{ orders: OrderDetail[], totalFound: number, validOrders: number }>
            updateOrderStatus: (orderId: number, status: string, notes?: string) => Promise<boolean>
            updateOrderStatusCode: (orderId: number, statusCodeString: string) => Promise<boolean>
            getConfig: () => Promise<any>
            setConfig: (config: any) => Promise<void>
            selectFolder: () => Promise<string>
            testDatabaseConnection: () => Promise<boolean>
            testApiConnection: () => Promise<boolean>
            createSampleData: () => Promise<void>
            checkFileExists: (filePath: string) => Promise<boolean>
            getImageData: (filePath: string) => Promise<string | null>
            listFiles: (dirPath: string) => Promise<string[]>
            convertFileToImage: (filePath: string) => Promise<string | null>
            printBarcode: (barcodeData: string, orderInfo?: any) => Promise<{ success: boolean; message: string }>
            testBarTenderConnection: () => Promise<{ success: boolean; message: string }>
            getBarTenderConfig: () => Promise<any>
            setBarTenderConfig: (config: any) => Promise<boolean>
            exportOrderToExcel: (order: any, exportFolder: string) => Promise<any>
        }
        Quagga: any
    }
    interface BarTenderConfig {
        enabled: boolean
        bartenderPath: string
        templatePath: string
        exportFolder: string
        autoExport: boolean
        autoPrint: boolean
        printScriptPath?: string
        printMethod?: 'direct' | 'script'
    }
}

export { } 