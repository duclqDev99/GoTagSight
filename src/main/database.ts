import mysql from 'mysql2/promise'
import * as fs from 'fs'
import * as path from 'path'
import { configManager, DatabaseConfig } from './config'

export interface OrderDetail {
    id: number
    task_code: string
    task_code_front: string
    task_code_back: string
    product_name_new: string
    description_task: string
    description_task_front: string
    description_task_back: string
    quantity: number
    status: string
    status_code_string: string
    price: number
    score_task: number
    score_task_front: number
    score_task_back: number
    condition: string
    size_style: string
    pack: string
    color: string
    material: string
    layout_style: string
    personalization: string
    link: string
    created_at: string
    updated_at: string
}

export class DatabaseManager {
    private connection: mysql.Connection | null = null
    private config: DatabaseConfig | null = null

    async connect(config?: DatabaseConfig): Promise<boolean> {
        try {
            // Sử dụng config từ file hoặc parameter
            this.config = config || configManager.getDatabaseConfig()

            if (!this.config) {
                console.error('No database configuration found')
                return false
            }

            this.connection = await mysql.createConnection({
                host: this.config.host,
                port: this.config.port,
                user: this.config.user,
                password: this.config.password,
                database: this.config.database
            })

            // Test connection
            await this.connection.ping()
            console.log('MySQL Database connected successfully')
            return true
        } catch (error) {
            console.error('Failed to connect to MySQL database:', error)
            return false
        }
    }

    async searchOrders(taskCode: string): Promise<{ orders: OrderDetail[], totalFound: number, validOrders: number }> {
        if (!this.connection) {
            throw new Error('Database not connected')
        }

        if (!this.config) {
            throw new Error('Database configuration not found')
        }

        try {
            const searchTerm = `${taskCode}%`

            // First, get all matching orders regardless of status
            const allOrdersQuery = `
                SELECT 
                    id, 
                    task_code, 
                    task_code_front, 
                    task_code_back,
                    product_name_new,
                    description_task,
                    description_task_front,
                    description_task_back,
                    quantity, 
                    status, 
                    status_code_string,
                    price,
                    score_task,
                    score_task_front,
                    score_task_back,
                    \`condition\`,
                    size_style,
                    pack,
                    color,
                    material,
                    layout_style,
                    personalization,
                    link,
                    created_at,
                    updated_at
                FROM ${this.config.tableName}
                WHERE (task_code LIKE ? OR task_code_front LIKE ? OR task_code_back LIKE ?)
                ORDER BY id DESC
            `
            const [allRows] = await this.connection.execute(allOrdersQuery, [searchTerm, searchTerm, searchTerm])
            const allOrders = allRows as OrderDetail[]

            // Filter for valid status
            const validOrders = allOrders.filter(order => order.status_code_string === 'C1F1R1P1E1V0')

            return {
                orders: validOrders,
                totalFound: allOrders.length,
                validOrders: validOrders.length
            }
        } catch (error) {
            console.error('Failed to search orders:', error)
            throw error
        }
    }

    async updateOrderStatus(orderId: number, status: string, notes?: string): Promise<boolean> {
        if (!this.connection) {
            throw new Error('Database not connected')
        }

        if (!this.config) {
            throw new Error('Database configuration not found')
        }

        try {
            // Update status and add notes to seller_note if provided
            let query = `UPDATE ${this.config.tableName} SET status = ?`
            let params = [status]

            if (notes) {
                query += `, seller_note = CONCAT(COALESCE(seller_note, ''), '\n', ?)`
                params.push(`[QC ${status.toUpperCase()}] ${notes}`)
            }

            query += ` WHERE id = ?`
            params.push(orderId.toString())

            const [result] = await this.connection.execute(query, params)

            console.log(`Updated order ${orderId} status to ${status}`)
            return true
        } catch (error) {
            console.error('Failed to update order status:', error)
            return false
        }
    }

    async updateOrderStatusCode(orderId: number, statusCodeString: string): Promise<boolean> {
        if (!this.connection) {
            throw new Error('Database not connected')
        }

        if (!this.config) {
            throw new Error('Database configuration not found')
        }

        try {
            const query = `UPDATE ${this.config.tableName} SET status_code_string = ? WHERE id = ?`
            const [result] = await this.connection.execute(query, [statusCodeString, orderId])

            console.log(`Updated order ${orderId} status_code_string to ${statusCodeString}`)
            return true
        } catch (error) {
            console.error('Failed to update order status_code_string:', error)
            return false
        }
    }

    async getOrderById(orderId: number): Promise<OrderDetail | null> {
        if (!this.connection) {
            throw new Error('Database not connected')
        }

        if (!this.config) {
            throw new Error('Database configuration not found')
        }

        try {
            const query = `
                SELECT 
                    id, 
                    task_code, 
                    task_code_front, 
                    task_code_back,
                    product_name_new,
                    description_task,
                    description_task_front,
                    description_task_back,
                    quantity, 
                    status, 
                    price,
                    score_task,
                    score_task_front,
                    score_task_back,
                    condition,
                    size_style,
                    pack,
                    color,
                    material,
                    layout_style,
                    personalization,
                    link,
                    created_at,
                    updated_at
                FROM ${this.config.tableName}
                WHERE id = ?
            `

            const [rows] = await this.connection.execute(query, [orderId])
            const results = rows as OrderDetail[]
            return results.length > 0 ? results[0] : null
        } catch (error) {
            console.error('Failed to get order by ID:', error)
            throw error
        }
    }

    async createSampleData(): Promise<void> {
        if (!this.connection) {
            throw new Error('Database not connected')
        }

        if (!this.config) {
            throw new Error('Database configuration not found')
        }

        try {
            // Insert sample data into existing table
            const insertSampleData = `
                INSERT IGNORE INTO ${this.config.tableName} 
                (task_code, task_code_front, task_code_back, product_name_new, 
                 description_task, description_task_front, description_task_back,
                 quantity, status, price, score_task, score_task_front, score_task_back,
                 \`condition\`, size_style, pack, color, material, layout_style, 
                 personalization, link) 
                VALUES 
                ('ABC123', 'ABC123', 'ABC123B', 'iPhone 15 Pro Custom Case', 
                 'Custom iPhone 15 Pro case with personalized design', 
                 'Front design with customer name and logo', 
                 'Back design with custom pattern',
                 10, 'pending', 29.99, 4.5, 4.8, 4.2, 'New', 'iPhone 15 Pro', 
                 'Single', 'Black', 'Silicone', 'Minimalist', 
                 'Customer name: John Doe, Logo: Company XYZ',
                 'https://example.com/product/iphone15pro-case'),
                ('DEF456', 'DEF456', 'DEF456B', 'MacBook Air M2 Custom Sleeve', 
                 'Custom MacBook Air M2 sleeve with embroidered design', 
                 'Front embroidery with company logo', 
                 'Back design with custom text',
                 5, 'pending', 49.99, 4.7, 4.9, 4.5, 'New', 'MacBook Air M2 13"', 
                 'Single', 'Gray', 'Neoprene', 'Professional', 
                 'Company: TechCorp, Logo: TechCorp Logo',
                 'https://example.com/product/macbook-air-sleeve')
            `

            await this.connection.execute(insertSampleData)
            console.log('Sample data created successfully')
        } catch (error) {
            console.error('Failed to create sample data:', error)
            throw error
        }
    }

    async testConnection(): Promise<boolean> {
        if (!this.connection) {
            return false
        }

        try {
            await this.connection.ping()
            return true
        } catch (error) {
            console.error('Database connection test failed:', error)
            return false
        }
    }

    async getTableStructure(): Promise<any[]> {
        if (!this.connection) {
            throw new Error('Database not connected')
        }

        try {
            const query = 'DESCRIBE order_details'
            const [rows] = await this.connection.execute(query)
            return rows as any[]
        } catch (error) {
            console.error('Failed to get table structure:', error)
            throw error
        }
    }

    disconnect(): void {
        if (this.connection) {
            this.connection.end()
            this.connection = null
        }
        this.config = null
    }

    getConfig(): DatabaseConfig | null {
        return this.config
    }
}

export const dbManager = new DatabaseManager() 