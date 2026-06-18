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
    // API riêng cho update operations
    updateApiBaseURL?: string
    updateApiKey?: string
}

export interface OrderDetail {
    id: number
    order_id: number
    origin_id: number
    scanTime?: number // Thời gian scan để sắp xếp
    task_code: string
    task_code_front: string
    task_code_back: string
    product_name_new: string
    product_type: string
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
    private updateClient: AxiosInstance
    private config: ApiConfig
    private authToken: string | null = null

    constructor(config: ApiConfig) {
        this.config = config

        // Tạo headers object cho search API
        const headers: any = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'iSuccess-Scan-Barcode/1.0.0'
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

        // Tạo client riêng cho update API
        const updateHeaders: any = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'iSuccess-Scan-Barcode/1.0.0'
        }

        if (config.updateApiKey) {
            const updateToken = config.updateApiKey.startsWith('Bearer ') ? config.updateApiKey : `Bearer ${config.updateApiKey}`
            updateHeaders.Authorization = updateToken
        }
        console.log('config.updateApiBaseURL', config.updateApiBaseURL)
        console.log('config.baseURL', config.baseURL)
        this.updateClient = axios.create({
            baseURL: config.updateApiBaseURL || config.baseURL,
            timeout: config.timeout || 10000,
            headers: updateHeaders,
            validateStatus: (status) => status >= 200 && status < 500,
            withCredentials: false
        })

        console.log('ApiService created with config:', {
            baseURL: config.baseURL,
            updateApiBaseURL: config.updateApiBaseURL,
            hasApiKey: !!config.apiKey,
            hasUpdateApiKey: !!config.updateApiKey,
            hasUsername: !!config.username,
            timeout: config.timeout
        })
    }

    // Method to set authentication token
    setAuthToken(token: string | null) {
        this.authToken = token

        if (token) {
            // Update headers for both clients
            this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
            this.updateClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
            console.log('Authentication token set for API service')
        } else {
            // Remove auth headers
            delete this.client.defaults.headers.common['Authorization']
            delete this.updateClient.defaults.headers.common['Authorization']
            console.log('Authentication token removed from API service')
        }
    }

    hasAuthToken(): boolean {
        return this.authToken !== null && this.authToken.trim() !== ''
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
                            'User-Agent': 'iSuccess-Scan-Barcode/1.0.0'
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
            console.log('=== DEBUG: searchOrders START ===')
            console.log('Task code:', taskCode)
            console.log('Current config baseURL:', this.config.baseURL)
            console.log('Current config apiKey:', this.config.apiKey ? '***SET***' : 'NOT SET')

            // Gán cứng baseURL cho MeiliSearch
            const meiliBaseURL = 'http://103.139.203.10:7700'
            console.log('Hardcoded MeiliSearch baseURL:', meiliBaseURL)

            // Tạo client tạm thời với baseURL MeiliSearch
            const tempClient = axios.create({
                baseURL: meiliBaseURL,
                timeout: this.config.timeout || 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })

            console.log('Temp client created with baseURL:', tempClient.defaults.baseURL)

            // MeiliSearch không cần auth token, chỉ cần API key nếu có
            if (this.config.apiKey) {
                tempClient.defaults.headers.common['Authorization'] = `Bearer ${this.config.apiKey}`
                console.log('MeiliSearch API key set for search')
                console.log('Authorization header set:', `Bearer ${this.config.apiKey.substring(0, 10)}...`)
            } else {
                console.log('⚠️ No API key found in config')
            }

            // Luôn sử dụng MeiliSearch cho search
            const body = {
                q: '',
                filter: `task_code_front_prefix = "${taskCode}"`,
                sort: ['created_at:desc'],
                // Retrieve every field the UI actually displays. The previous short list
                // dropped product_type, price, size/color/material, descriptions and
                // status_code_string, so those rendered empty (and price showed $0).
                attributesToRetrieve: [
                    'id',
                    'order_id',
                    'origin_id',
                    'order_origin_id',
                    'order_platform',
                    'product_id',
                    'product_type',
                    'quantity',
                    'total_items_in_order',
                    'task_code',
                    'task_code_front',
                    'task_code_back',
                    'task_code_front_prefix',
                    'description_task',
                    'description_task_front',
                    'description_task_back',
                    'score_task',
                    'score_task_front',
                    'score_task_back',
                    'status',
                    'status_code_string',
                    'price',
                    'condition',
                    'size_style',
                    'pack',
                    'color',
                    'material',
                    'layout_style',
                    'personalization',
                    'link',
                    'line_in_order',
                    'line_in_quantity',
                    'created_at',
                    'updated_at',
                    'order'
                ],
                hitsPerPage: 10,
                page: 1
            }

            console.log('=== DEBUG: Making MeiliSearch request ===')
            console.log('Endpoint:', '/indexes/order_details/search')
            console.log('Full URL:', `${meiliBaseURL}/indexes/order_details/search`)
            console.log('Request body:', JSON.stringify(body, null, 2))
            console.log('Request headers:', JSON.stringify(tempClient.defaults.headers, null, 2))

            const response = await tempClient.post('/indexes/order_details/search', body)
            const data = response.data
            const hits = Array.isArray(data?.hits) ? data.hits : []

            const transformedOrders: OrderDetail[] = hits.map((item: any) => {
                const order = item.order || {}
                const orderDetail = item.order?.order_details?.[0] || {}

                // order.customer_name is frequently null → fall back to first + last name.
                const fullName = `${order.first_name ?? ''} ${order.last_name ?? ''}`.trim()
                const customerName = order.customer_name || fullName || ''

                // The API has no `product_name_new`; the product label lives in `product_type`
                // (e.g. "Shirt", "Flag", "Mug").
                const productType = item.product_type ?? orderDetail.product_type ?? ''

                // price arrives as a string and may carry a thousands separator ("9,999.99"),
                // which plain parseFloat would truncate at the comma → strip it first.
                const rawPrice = item.price ?? orderDetail.price ?? order.total ?? '0'
                const price = parseFloat(String(rawPrice).replace(/,/g, '')) || 0

                return {
                    id: item.id ?? item.order_id ?? 0,
                    order_id: item.order_id ?? order.id ?? 0,
                    origin_id: order.origin_id ?? item.order_origin_id ?? item.origin_id ?? 0,
                    task_code: item.task_code ?? item.task_code_front ?? '',
                    task_code_front: item.task_code_front ?? '',
                    task_code_back: item.task_code_back ?? '',
                    product_name_new: item.product_name_new ?? productType ?? orderDetail.product_name_new ?? '',
                    product_type: productType,
                    customer_name: customerName,
                    description_task: item.description_task ?? orderDetail.description_task ?? '',
                    description_task_front: item.description_task_front ?? orderDetail.description_task_front ?? '',
                    description_task_back: item.description_task_back ?? orderDetail.description_task_back ?? '',
                    quantity: item.quantity ?? orderDetail.quantity ?? 1,
                    total_quantity: item.total_items_in_order ?? order.total_item ?? order.total_quantity ?? 1,
                    status: item.status ?? order.status ?? '',
                    status_code_string: item.status_code_string ?? orderDetail.status_code_string ?? '',
                    price: price,
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
            // Sử dụng updateClient thay vì client chính
            const client = this.updateClient || this.client
            const response = await client.put(`/orders/${orderId}/status`, { status, notes })
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
            // Sử dụng updateClient thay vì client chính
            const client = this.updateClient || this.client
            const response = await client.put(`/orders/${orderId}/status-code`, { status_code_string: statusCodeString })
            if (response.data && typeof response.data.status === 'boolean') {
                return response.data.status
            }
            return response.status === 200
        } catch (error: any) {
            console.error('Failed to update order status code:', error)
            throw new Error(error.response?.data?.message || error.message)
        }
    }

    async updateOrderStatusCodes(ids: number[], statusCodeString: string): Promise<boolean> {
        try {
            // Gán cứng baseURL cho production
            const baseURL = 'https://production.trackingis.info'

            console.log('=== DEBUG: API Configuration ===')
            console.log('Base URL (HARDCODED):', baseURL)
            console.log('Auth Token exists:', !!this.authToken)
            console.log('Auth Token length:', this.authToken ? this.authToken.length : 0)
            console.log('Auth Token preview:', this.authToken ? `${this.authToken.substring(0, 10)}...` : 'null')

            // Tạo client tạm thời với baseURL gán cứng
            const tempClient = axios.create({
                baseURL: baseURL,
                timeout: this.config.timeout || 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': ''
                }
            })

            // Thêm auth token nếu có
            if (this.authToken) {
                tempClient.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`
                console.log('Authorization header set:', `Bearer ${this.authToken.substring(0, 20)}...`)
            } else {
                console.log('WARNING: No auth token available!')
            }

            // Gửi đúng cấu trúc API như yêu cầu
            const requestData = {
                status_code_string: statusCodeString,
                ids: ids
            }

            console.log('=== DEBUG: Request Details ===')
            console.log('Endpoint:', '/api/v2/order-details/update-status-code')
            console.log('Full URL:', `${baseURL}/api/v2/order-details/update-status-code`)
            console.log('Request Data:', requestData)
            console.log('Status Code String:', statusCodeString)
            console.log('IDs:', ids)
            console.log('Request Headers:', tempClient.defaults.headers)

            const response = await tempClient.post('/api/v2/order-details/update-status-code', requestData)

            console.log('=== DEBUG: Response Details ===')
            console.log('Response Status:', response.status)
            console.log('Response Status Text:', response.statusText)
            console.log('Response Headers:', response.headers)
            console.log('Response Data:', response.data)
            console.log('Response Data Type:', typeof response.data)
            console.log('Response Data Keys:', response.data ? Object.keys(response.data) : 'null/undefined')

            // Kiểm tra response chi tiết hơn
            if (response.data) {
                console.log('Response data exists, checking fields...')

                if (typeof response.data.status === 'boolean') {
                    console.log('Response has boolean status:', response.data.status)
                    return response.data.status
                }

                if (response.data.message) {
                    console.log('Response has message:', response.data.message)
                }

                if (response.data.success !== undefined) {
                    console.log('Response has success field:', response.data.success)
                    return response.data.success
                }

                if (response.data.error) {
                    console.log('Response has error field:', response.data.error)
                    throw new Error(`API Error: ${response.data.error}`)
                }

                // Nếu có data nhưng không có field status/success, kiểm tra nội dung
                if (typeof response.data === 'object' && Object.keys(response.data).length > 0) {
                    console.log('Response has data but no status/success field, checking if it indicates success...')
                    // Nếu response có data và không có error, coi như thành công
                    return true
                }

                // Nếu response.data là string hoặc number, kiểm tra nội dung
                if (typeof response.data === 'string') {
                    console.log('Response data is string:', response.data)
                    // Nếu là string rỗng hoặc "success", coi như thành công
                    if (response.data === '' || response.data.toLowerCase().includes('success')) {
                        return true
                    }
                    // Nếu có chứa "error", coi như thất bại
                    if (response.data.toLowerCase().includes('error')) {
                        throw new Error(`API Error: ${response.data}`)
                    }
                }

                if (typeof response.data === 'number') {
                    console.log('Response data is number:', response.data)
                    // Nếu là số 1 hoặc 200, coi như thành công
                    if (response.data === 1 || response.data === 200) {
                        return true
                    }
                    // Nếu là số 0, coi như thất bại
                    if (response.data === 0) {
                        return false
                    }
                }
            }

            // Kiểm tra HTTP status
            if (response.status >= 200 && response.status < 300) {
                return true
            } else {
                return false
            }
        } catch (error: any) {
            // Tạo error message chi tiết hơn
            let errorMessage = 'Unknown error occurred'

            if (error.response?.data) {
                if (error.response.data.message) {
                    errorMessage = error.response.data.message
                } else if (error.response.data.error) {
                    errorMessage = error.response.data.error
                } else if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data
                } else {
                    errorMessage = `Server error: ${JSON.stringify(error.response.data)}`
                }
            } else if (error.message) {
                errorMessage = error.message
            }

            // Xử lý các lỗi authentication cụ thể
            if (error.response?.status === 401) {
                if (errorMessage.includes('Invalid token') || errorMessage.includes('Unauthorized')) {
                    errorMessage = 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
                }
            } else if (error.response?.status === 403) {
                errorMessage = 'Không có quyền truy cập. Vui lòng kiểm tra quyền hạn.'
            } else if (error.response?.status === 404) {
                errorMessage = 'API endpoint không tồn tại. Vui lòng kiểm tra cấu hình.'
            } else if (error.response?.status >= 500) {
                errorMessage = 'Lỗi server. Vui lòng thử lại sau.'
            }

            throw new Error(errorMessage)
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
    },
    updateApiBaseURL: '',
    updateApiKey: ''
} 