import { createConnection } from 'net'
import * as fs from 'fs'
import * as path from 'path'
import * as XLSX from 'xlsx'

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
    printMethod?: 'direct' | 'script' // Thêm option chọn method in
}

export class BarTenderIntegration {
    private config: BarTenderConfig

    constructor(config: BarTenderConfig) {
        this.config = config
    }

    async printBarcode(barcodeData: string, orderInfo?: any): Promise<boolean> {
        if (!this.config || !Boolean(this.config.enabled)) {
            console.log('BarTender integration is disabled')
            return false
        }

        try {
            switch (this.config.method) {
                case 'named_pipe':
                    return await this.printViaNamedPipe(barcodeData, orderInfo)
                case 'http':
                    return await this.printViaHttp(barcodeData, orderInfo)
                case 'file':
                    return await this.printViaFile(barcodeData, orderInfo)
                case 'excel':
                    return await this.exportToExcel(barcodeData, orderInfo)
                default:
                    console.error('Unknown BarTender integration method')
                    return false
            }
        } catch (error) {
            console.error('BarTender print error:', error)
            return false
        }
    }

    private async printViaNamedPipe(barcodeData: string, orderInfo?: any): Promise<boolean> {
        return new Promise((resolve) => {
            const client = createConnection(this.config.namedPipePath || '\\\\.\\pipe\\BarTenderPrint', () => {
                const printData = {
                    template: this.config.templateName || 'Default',
                    data: {
                        barcode: barcodeData,
                        orderInfo: orderInfo
                    },
                    quantity: this.config.printQuantity || 1
                }

                client.write(JSON.stringify(printData))
            })

            client.on('data', (data) => {
                const response = data.toString()
                client.end()
                resolve(response.includes('success'))
            })

            client.on('error', (error) => {
                console.error('Named pipe connection error:', error)
                resolve(false)
            })

            // Timeout after 5 seconds
            setTimeout(() => {
                client.end()
                resolve(false)
            }, 5000)
        })
    }

    private async printViaHttp(barcodeData: string, orderInfo?: any): Promise<boolean> {
        try {
            const response = await fetch(this.config.httpUrl || 'http://localhost:8080/print', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    template: this.config.templateName || 'Default',
                    data: {
                        barcode: barcodeData,
                        orderInfo: orderInfo
                    },
                    quantity: this.config.printQuantity || 1
                })
            })

            return response.ok
        } catch (error) {
            console.error('HTTP print error:', error)
            return false
        }
    }

    private async printViaFile(barcodeData: string, orderInfo?: any): Promise<boolean> {
        try {
            const printData = {
                timestamp: new Date().toISOString(),
                template: this.config.templateName || 'Default',
                data: {
                    barcode: barcodeData,
                    orderInfo: orderInfo
                },
                quantity: this.config.printQuantity || 1
            }

            const filePath = this.config.filePath || path.join(process.cwd(), 'print_queue.json')
            const existingData = fs.existsSync(filePath)
                ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
                : []

            existingData.push(printData)
            fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2))

            return true
        } catch (error) {
            console.error('File print error:', error)
            return false
        }
    }

    /**
     * Gọi script PowerShell để in tự động
     */
    private async runPowerShellScript(scriptPath: string, excelPath: string): Promise<boolean> {
        return new Promise((resolve) => {
            try {
                const { spawn } = require('child_process')
                const args = ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, excelPath]
                const process = spawn('powershell.exe', args)
                process.stdout.on('data', (data: Buffer) => {
                    console.log('PowerShell output:', data.toString())
                })
                process.stderr.on('data', (data: Buffer) => {
                    console.error('PowerShell error:', data.toString())
                })
                process.on('close', (code: number) => {
                    if (code === 0) {
                        console.log('PowerShell script completed successfully')
                        resolve(true)
                    } else {
                        console.error('PowerShell script failed with code:', code)
                        resolve(false)
                    }
                })
            } catch (error) {
                console.error('Error running PowerShell script:', error)
                resolve(false)
            }
        })
    }

    public async exportToExcel(barcodeData: string, orderInfo?: any): Promise<boolean> {
        if (!this.config || !Boolean(this.config.enabled)) {
            console.log('BarTender integration is disabled')
            return false
        }

        try {
            // Chỉ export 3 cột: BARCODE, TENKH, SL IN
            const excelData = {
                BARCODE: barcodeData,
                TENKH: orderInfo?.customer_name || '',
                'SL IN': 1
            }

            const filePath = this.config.excelPath || path.join(process.cwd(), 'bartender_export.xlsx')

            // Validate file path
            if (!filePath || filePath.trim() === '') {
                console.error('Excel file path is empty')
                return false
            }

            // Ensure the directory exists
            const dir = path.dirname(filePath)
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
            }

            // Ensure file path ends with .xlsx
            const validPath = filePath.endsWith('.xlsx') ? filePath : filePath + '.xlsx'

            // Check if file exists to read existing data
            let existingData: any[] = []
            if (fs.existsSync(validPath)) {
                try {
                    const workbook = XLSX.readFile(validPath)
                    const sheetName = workbook.SheetNames[0] || 'Sheet1'
                    const worksheet = workbook.Sheets[sheetName]
                    existingData = XLSX.utils.sheet_to_json(worksheet)
                } catch (error) {
                    console.log('Could not read existing Excel file, creating new one')
                }
            }

            // Add new data
            existingData.push(excelData)

            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new()
            const worksheet = XLSX.utils.json_to_sheet(existingData)

            // Set column widths
            const colWidths = [
                { wch: 20 }, // Timestamp
                { wch: 15 }, // Barcode
                { wch: 20 }, // Task Code
                { wch: 20 }, // Task Code Front
                { wch: 20 }, // Task Code Back
                { wch: 30 }, // Product Name
                { wch: 15 }, // Layout Style
                { wch: 10 }, // Quantity
                { wch: 15 }, // Status
                { wch: 12 }, // Price
                { wch: 30 }  // Notes
            ]
            worksheet['!cols'] = colWidths

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'BarTender Data')

            // Write to file
            const xlsPath = validPath.replace(/\.xlsx$/i, '.xls')
            XLSX.writeFile(workbook, xlsPath, { bookType: 'xls' })

            console.log(`Data exported to Excel: ${xlsPath}`)
            console.log('Exported data:', excelData)

            // Kiểm tra method in và thực hiện theo cấu hình
            const printMethod = this.config.printMethod || 'direct'

            if (this.config.autoPrint) {
                if (printMethod === 'direct' && this.config.bartenderPath && this.config.templatePath) {
                    // Gọi BarTender trực tiếp
                    const { exec } = require('child_process')
                    const args = `/F=\"${this.config.templatePath}\" /D=\"${xlsPath}\" /P /X`
                    exec(`\"${this.config.bartenderPath}\" ${args}`, (error, stdout, stderr) => {
                        if (error) {
                            console.error('BarTender print error:', error)
                        } else {
                            console.log('BarTender print success:', stdout)
                        }
                    })
                } else if (printMethod === 'script' && this.config.printScriptPath) {
                    // Gọi script PowerShell
                    await this.runPowerShellScript(this.config.printScriptPath, xlsPath)
                }
            }

            return true
        } catch (error) {
            console.error('Excel export error:', error)
            console.error('Config:', this.config)
            return false
        }
    }

    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            if (this.config.method === 'excel') {
                // For Excel method, test by creating a test file
                const result = await this.exportToExcel('TEST123', { test: true })
                return {
                    success: result,
                    message: result ? 'Excel export test successful' : 'Excel export test failed'
                }
            } else {
                const result = await this.printBarcode('TEST123', { test: true })
                return {
                    success: result,
                    message: result ? 'BarTender connection successful' : 'BarTender connection failed'
                }
            }
        } catch (error) {
            return {
                success: false,
                message: `BarTender test error: ${error}`
            }
        }
    }
} 