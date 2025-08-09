import axios, { AxiosInstance } from 'axios'

export interface ApiConfig {
    baseURL: string
    timeout?: number
    apiKey?: string
    username?: string
    password?: string
    environment?: 'development' | 'staging' | 'production' | 'custom'
    environmentUrls?: {
        development?: string
        staging?: string
        production?: string
        custom?: string
    }
}

export interface OrderDetail {
    id: number
    order_id: number
    origin_id: number
    task_code: string
    task_code_front: string
    task_code_back: string
    product_name_new: string
    customer_name: string
    description_task: string
    description_task_front: string
    description_task_back: string
    quantity: number
    total_quantity: number
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
    // Thông tin thêm cho grouping
    line_in_order: number
    line_in_quantity: number
    shipping_address: string
    shipping_city: string
    shipping_state: string
    shipping_zip: string
    platform: string
}

export class ApiService {
    private client: AxiosInstance
    private config: ApiConfig

    constructor(config: ApiConfig) {
        this.config = config

        // Tạo headers object
        const headers: any = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'GoTagSight/1.0.0'
        }

        // Thêm Bearer token nếu có (chấp nhận nhập có/không có tiền tố Bearer)
        if (config.apiKey && config.apiKey.trim()) {
            const raw = config.apiKey.trim()
            const hasBearerPrefix = /^bearer\s+/i.test(raw)
            const token = hasBearerPrefix ? raw.replace(/^bearer\s+/i, '') : raw
            headers['Authorization'] = `Bearer ${token}`
            // Meilisearch cũng hỗ trợ header X-Meilisearch-API-Key
            headers['X-Meilisearch-API-Key'] = token
            console.log('Setting Authorization header with Bearer token. Token length:', token.length)
        }

        this.client = axios.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 10000,
            headers: headers,
            // Thêm auth nếu có username/password
            ...(config.username && config.password && {
                auth: {
                    username: config.username,
                    password: config.password
                }
            }),
            // Xử lý HTTPS và CORS
            withCredentials: false,
            validateStatus: function (status) {
                return status >= 200 && status < 500 // Accept 2xx, 3xx, 4xx status codes
            }
        })

        console.log('ApiService created with config:', {
            baseURL: config.baseURL,
            hasApiKey: !!config.apiKey,
            hasUsername: !!config.username,
            timeout: config.timeout
        })
    }

    private isMeili(): boolean {
        try {
            const url = new URL(this.config.baseURL)
            // Kiểm tra port 7700 hoặc path chứa /indexes
            return url.port === '7700' || url.pathname.includes('/indexes')
        } catch {
            // Fallback nếu URL parsing thất bại
            return this.config.baseURL.includes(':7700') || this.config.baseURL.includes('/indexes')
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            console.log('Testing API connection to:', this.config.baseURL)

            if (this.isMeili()) {
                try {
                    console.log('Detected Meilisearch, testing /indexes/order_details/search')
                    const response = await this.client.post('/indexes/order_details/search', {
                        q: '',
                        filter: 'task_code_front_prefix = "TEST"',
                        hitsPerPage: 1,
                        page: 1
                    })
                    console.log('Meilisearch test response:', response.status, response.data)
                    return response.status === 200
                } catch (e: any) {
                    console.log('Meilisearch test failed:', e.response?.status, e.response?.data, e.message)

                    // Thử test endpoint health của Meilisearch
                    try {
                        console.log('Trying Meilisearch health endpoint')
                        const healthResponse = await this.client.get('/health')
                        console.log('Meilisearch health response:', healthResponse.status, healthResponse.data)
                        return healthResponse.status === 200
                    } catch (healthError: any) {
                        console.log('Meilisearch health check failed:', healthError.response?.status, healthError.message)
                    }
                }
            } else {
                // Test the actual endpoint we'll be using
                try {
                    console.log('Testing /order-details/search endpoint')
                    const response = await this.client.post('/order-details/search', {
                        task_code: 'TEST',
                        limit: 1
                    })
                    console.log('Search endpoint test response:', response.status, response.data)

                    // If we get a successful response or even a data response, connection is working
                    if (response.status === 200 || response.data) {
                        return true
                    }
                } catch (searchError: any) {
                    console.log('Search endpoint error:', searchError.response?.status, searchError.message)

                    // If we get 401/403, it means server is reachable but needs proper auth
                    if (searchError.response?.status === 401 || searchError.response?.status === 403) {
                        console.log('Server is reachable but requires proper authentication')
                        return false // This means auth is needed
                    }

                    // If we get 422 (validation error), the endpoint exists
                    if (searchError.response?.status === 422) {
                        console.log('Search endpoint exists but validation failed (expected for test)')
                        return true
                    }
                }
            }

            // Try basic endpoints as fallback
            const endpoints = ['/', '/api', '/health']

            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying endpoint: ${endpoint}`)
                    const response = await this.client.get(endpoint, {
                        timeout: this.config.timeout || 10000,
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'User-Agent': 'GoTagSight/1.0.0'
                        }
                    })
                    console.log(`Success with endpoint ${endpoint}:`, response.status)
                    return response.status === 200 || response.status === 204
                } catch (endpointError: any) {
                    console.log(`Failed with endpoint ${endpoint}:`, endpointError.message)
                    // If it's a 401/403, the endpoint exists but needs auth
                    if (endpointError.response?.status === 401 || endpointError.response?.status === 403) {
                        console.log(`Endpoint ${endpoint} requires authentication`)
                        return false // Need proper auth
                    }
                    continue
                }
            }

            return false

        } catch (error: any) {
            console.error('API connection test failed:', error)
            console.error('Error details:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                config: error.config
            })

            return false
        }
    }

    async searchOrders(taskCode: string): Promise<{ orders: OrderDetail[], totalFound: number, validOrders: number }> {
        try {
            console.log('Searching orders with task_code:', taskCode)

            if (this.isMeili()) {
                const body = {
                    q: '',
                    filter: `task_code_front_prefix = "${taskCode}"`,
                    sort: ['created_at:desc'],
                    attributesToRetrieve: [
                        'id',
                        'order_id',
                        'quantity',
                        'order',
                        'origin_id',
                        'task_code_front_prefix',
                        'total_items_in_order',
                        'task_code_front',
                        'task_code_back',
                        'created_at'
                    ],
                    hitsPerPage: 10,
                    page: 1
                }

                const response = await this.client.post('/indexes/order_details/search', body)
                const data = response.data
                const hits = Array.isArray(data?.hits) ? data.hits : []

                const transformedOrders: OrderDetail[] = hits.map((item: any) => {
                    const order = item.order || {}
                    const orderDetail = item.order?.order_details?.[0] || {}

                    console.log('API Debug - item:', JSON.stringify(item, null, 2))
                    console.log('API Debug - order:', JSON.stringify(order, null, 2))
                    console.log('API Debug - origin_id from order:', order.origin_id)
                    console.log('API Debug - origin_id from item:', item.origin_id)

                    return {
                        id: item.id ?? item.order_id ?? 0,
                        order_id: item.order_id ?? order.id ?? 0,
                        origin_id: order.origin_id ?? item.origin_id ?? 0,
                        task_code: item.task_code ?? item.task_code_front ?? '',
                        task_code_front: item.task_code_front ?? '',
                        task_code_back: item.task_code_back ?? '',
                        product_name_new: item.product_name_new ?? orderDetail.product_name_new ?? '',
                        customer_name: order.customer_name ?? '',
                        description_task: item.description_task ?? orderDetail.description_task ?? '',
                        description_task_front: item.description_task_front ?? orderDetail.description_task_front ?? '',
                        description_task_back: item.description_task_back ?? orderDetail.description_task_back ?? '',
                        quantity: item.quantity ?? orderDetail.quantity ?? 1,
                        total_quantity: item.total_items_in_order ?? order.total_item ?? order.total_quantity ?? 1,
                        status: item.status ?? order.status ?? '',
                        status_code_string: item.status_code_string ?? orderDetail.status_code_string ?? '',
                        price: parseFloat(item.price ?? orderDetail.price ?? order.total ?? '0'),
                        score_task: parseFloat(item.score_task ?? orderDetail.score_task ?? '0'),
                        score_task_front: parseFloat(item.score_task_front ?? orderDetail.score_task_front ?? '0'),
                        score_task_back: parseFloat(item.score_task_back ?? orderDetail.score_task_back ?? '0'),
                        condition: item.condition ?? orderDetail.condition ?? '',
                        size_style: item.size_style ?? orderDetail.size_style ?? '',
                        pack: item.pack ?? orderDetail.pack ?? '',
                        color: item.color ?? orderDetail.color ?? '',
                        material: item.material ?? orderDetail.material ?? '',
                        layout_style: item.layout_style ?? orderDetail.layout_style ?? '',
                        personalization: item.personalization ?? orderDetail.personalization ?? '',
                        link: item.link ?? orderDetail.link ?? '',
                        created_at: item.created_at ?? order.created_at ?? '',
                        updated_at: item.updated_at ?? order.updated_at ?? '',
                        line_in_order: item.line_in_order ?? 1,
                        line_in_quantity: item.line_in_quantity ?? 1,
                        shipping_address: order.shipping_address ?? '',
                        shipping_city: order.shipping_city ?? '',
                        shipping_state: order.shipping_state ?? '',
                        shipping_zip: order.shipping_zip ?? '',
                        platform: order.platform ?? ''
                    }
                })

                return {
                    orders: transformedOrders,
                    totalFound: data?.totalHits ?? transformedOrders.length,
                    validOrders: transformedOrders.length
                }
            }

            const response = await this.client.post('/order-details/search', {
                task_code: taskCode,
                limit: 10
            })

            console.log('API Response:', response.data)

            // Handle the new API response format
            if (response.data && response.data.success === true) {
                const orders = response.data.data || []
                console.log('Found orders:', orders.length)

                // Transform the API response to match our OrderDetail interface
                const transformedOrders = orders.map(item => {
                    const orderDetail = item.order?.order_details?.[0] || {}
                    const order = item.order || {}

                    return {
                        id: orderDetail.id || item.order_id,
                        origin_id: order.origin_id || 0,
                        order_id: item.order_id || order.id, // Thêm order_id
                        task_code: orderDetail.task_code || item.task_code_front,
                        task_code_front: orderDetail.task_code_front || item.task_code_front,
                        task_code_back: orderDetail.task_code_back || item.task_code_back,
                        product_name_new: orderDetail.product_name_new || '',
                        customer_name: order.customer_name || '', // Lấy từ order object
                        description_task: orderDetail.description_task || orderDetail.description_task_front || '',
                        description_task_front: orderDetail.description_task_front || '',
                        description_task_back: orderDetail.description_task_back || '',
                        quantity: orderDetail.quantity || 1,
                        total_quantity: order.total_quantity || order.total_item || 1, // Tổng số lượng trong order
                        status: orderDetail.status || order.status || '',
                        status_code_string: orderDetail.status_code_string || '',
                        price: parseFloat(orderDetail.price || order.total || '0'),
                        score_task: parseFloat(orderDetail.score_task || orderDetail.score_task_front || '0'),
                        score_task_front: parseFloat(orderDetail.score_task_front || '0'),
                        score_task_back: parseFloat(orderDetail.score_task_back || '0'),
                        condition: orderDetail.condition || '',
                        size_style: orderDetail.size_style || '',
                        pack: orderDetail.pack || '',
                        color: orderDetail.color || '',
                        material: orderDetail.material || '',
                        layout_style: orderDetail.layout_style || '',
                        personalization: orderDetail.personalization || '',
                        link: orderDetail.link || '',
                        created_at: orderDetail.created_at || order.created_at || '',
                        updated_at: orderDetail.updated_at || order.updated_at || '',
                        // Thông tin thêm cho grouping
                        line_in_order: item.line_in_order || 1,
                        line_in_quantity: item.line_in_quantity || 1,
                        shipping_address: order.shipping_address || '',
                        shipping_city: order.shipping_city || '',
                        shipping_state: order.shipping_state || '',
                        shipping_zip: order.shipping_zip || '',
                        platform: order.platform || ''
                    }
                })

                return {
                    orders: transformedOrders,
                    totalFound: response.data.total || transformedOrders.length,
                    validOrders: transformedOrders.length
                }
            }

            console.log('API response format not recognized')
            return { orders: [], totalFound: 0, validOrders: 0 }

        } catch (error: any) {
            console.error('Failed to search orders:', error)
            console.error('Error response:', error.response?.data)
            return { orders: [], totalFound: 0, validOrders: 0 }
        }
    }

    async getOrders(): Promise<OrderDetail[]> {
        try {
            const response = await this.client.get('/orders')
            if (response.data && typeof response.data.status === 'boolean') {
                return response.data.data || []
            }
            return response.data.data || response.data || []
        } catch (error: any) {
            console.error('Failed to get orders:', error)
            throw new Error(error.response?.data?.message || error.message)
        }
    }

    async getOrderById(id: number): Promise<OrderDetail | null> {
        try {
            const response = await this.client.get(`/orders/${id}`)
            if (response.data && typeof response.data.status === 'boolean') {
                return response.data.data || null
            }
            return response.data.data || response.data || null
        } catch (error: any) {
            console.error('Failed to get order by ID:', error)
            return null
        }
    }

    async updateOrderStatus(orderId: number, status: string, notes?: string): Promise<boolean> {
        try {
            const response = await this.client.put(`/orders/${orderId}/status`, { status, notes })
            if (response.data && typeof response.data.status === 'boolean') {
                return response.data.status
            }
            return response.status === 200
        } catch (error: any) {
            console.error('Failed to update order status:', error)
            throw new Error(error.response?.data?.message || error.message)
        }
    }

    async updateOrderStatusCode(orderId: number, statusCodeString: string): Promise<boolean> {
        try {
            const response = await this.client.put(`/orders/${orderId}/status-code`, { status_code_string: statusCodeString })
            if (response.data && typeof response.data.status === 'boolean') {
                return response.data.status
            }
            return response.status === 200
        } catch (error: any) {
            console.error('Failed to update order status code:', error)
            throw new Error(error.response?.data?.message || error.message)
        }
    }
}

export const defaultApiConfig: ApiConfig = {
    baseURL: '',
    timeout: 10000,
    environment: 'development',
    environmentUrls: {
        development: '',
        staging: '',
        production: '',
        custom: ''
    }
} 