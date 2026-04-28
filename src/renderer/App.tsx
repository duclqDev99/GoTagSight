import React, { useState, useEffect, useRef } from 'react'
import Scanner from './components/Scanner'
import OrderView from './components/OrderView'
import Settings from './components/Settings'
import BarTenderSettings from './components/BarTenderSettings'
import ImageSettings from './components/ImageSettings'
import Notification from './components/Notification'
import Login from './components/Login'
import logoUrl from '../../images/logo/logo-warehouse.png'
import './App.css'

interface ApiConfig {
    baseURL: string
    timeout?: number
    username?: string
    password?: string
    apiKey?: string
    // API riêng cho update operations
    updateApiBaseURL?: string
    updateApiKey?: string
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

interface ElasticsearchConfig {
    enabled: boolean
    baseURL: string
    index: string
    username?: string
    password?: string
    searchFields?: string[]
    size?: number
    timeout?: number
    fallbackToFilesystem: boolean
}

interface ThumbServerConfig {
    enabled: boolean
    baseURL: string
    nasPrefix: string
    extension: string
}

interface AppConfig {
    apiConfig: ApiConfig
    imagePath: string
    barTenderConfig: BarTenderConfig
    elasticsearchConfig?: ElasticsearchConfig
    thumbServerConfig?: ThumbServerConfig
}

interface OrderDetail {
    id: number
    order_id: number
    origin_id: number
    scanTime?: number // Thời gian scan để sắp xếp
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

function App() {
    const [config, setConfig] = useState<AppConfig>({
        apiConfig: {
            baseURL: '', // User will configure this
            timeout: 10000,
            username: '',
            password: '',
            apiKey: ''
        },
        imagePath: '/Volumes/Designer ZenE',
        barTenderConfig: {
            enabled: false,
            bartenderPath: '',
            templatePath: '',
            exportFolder: '',
            autoExport: false,
            autoPrint: false,
            printScriptPath: '',
            printMethod: 'direct'
        },
        elasticsearchConfig: {
            enabled: true,
            baseURL: 'http://172.26.207.206:9200',
            index: 'nas_files',
            searchFields: ['name^3', 'attachment.content', 'path'],
            size: 20,
            timeout: 8000,
            fallbackToFilesystem: true
        },
        thumbServerConfig: {
            enabled: true,
            baseURL: 'http://172.26.207.206:8081/thumbs/',
            nasPrefix: '/Volumes/Designer ZenE/',
            extension: '.webp'
        }
    })

    const [orders, setOrders] = useState<OrderDetail[]>([])
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
    const [totalOrders, setTotalOrders] = useState(0)
    const [groupedOrders, setGroupedOrders] = useState<{ [key: number]: OrderDetail[] }>({})
    const [showSettings, setShowSettings] = useState(false)
    const [showBarTenderSettings, setShowBarTenderSettings] = useState(false)
    const [showImageSettings, setShowImageSettings] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const userMenuRef = useRef<HTMLDivElement>(null)
    const [isScanning, setIsScanning] = useState(false)
    // Order search uses hardcoded Meilisearch URL — no apiConfig.baseURL gate.
    // Settings is now optional, opened manually from the user menu.
    const isConfigValid = true
    const [isLoadingConfig, setIsLoadingConfig] = useState(true)
    const [notifications, setNotifications] = useState<Array<{
        id: string
        message: string
        type: 'success' | 'error' | 'warning' | 'info'
    }>>([])

    // Authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [authToken, setAuthToken] = useState<string | null>(null)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const loadConfig = async () => {
            try {
                if (window.electronAPI) {
                    const loadedConfig: AppConfig = await window.electronAPI.getConfig()
                    if (loadedConfig) {
                        setConfig(loadedConfig)
                    }
                }
            } catch (error) {
                console.error('Failed to load config:', error)
                addNotification('Failed to load configuration.', 'error')
            } finally {
                setIsLoadingConfig(false)
            }
        }

        loadConfig()

        // Load saved orders from localStorage
        const savedOrders = localStorage.getItem('scannedOrders')
        if (savedOrders) {
            try {
                const parsedOrders = JSON.parse(savedOrders)
                setOrders(parsedOrders)
                setTotalOrders(parsedOrders.length)
            } catch (error) {
                console.error('Failed to parse saved orders:', error)
            }
        }

        // Check authentication status
        const token = localStorage.getItem('authToken')
        const savedUser = localStorage.getItem('user')

        if (token && savedUser) {
            try {
                const userData = JSON.parse(savedUser)
                setAuthToken(token)
                setUser(userData)
                setIsAuthenticated(true)
            } catch (error) {
                console.error('Failed to parse user data:', error)
                // Clear invalid data
                localStorage.removeItem('authToken')
                localStorage.removeItem('user')
            }
        }
    }, [])

    useEffect(() => {
        // Group orders by order_id and sort by scan time
        const grouped = orders.reduce((acc, order) => {
            if (!acc[order.order_id]) {
                acc[order.order_id] = []
            }
            acc[order.order_id].push(order)
            return acc
        }, {} as { [key: number]: OrderDetail[] })

        // Sort each group by scan time (newest first)
        Object.keys(grouped).forEach(orderId => {
            const orderGroup = grouped[parseInt(orderId)]
            if (orderGroup && Array.isArray(orderGroup)) {
                orderGroup.sort((a, b) => {
                    const timeA = a.scanTime || 0
                    const timeB = b.scanTime || 0
                    return timeB - timeA // Newest first
                })
            }
        })

        setGroupedOrders(grouped)
    }, [orders])

    // Event listener cho phím Space để xóa item đang selected
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Chỉ xử lý khi nhấn phím Space, có item được selected và không có input nào đang focus
            if (event.code === 'Space' && selectedOrder) {
                event.preventDefault() // Ngăn scroll trang

                // Xác nhận xóa item đang selected
                if (window.confirm(`Bạn có chắc muốn xóa item "${selectedOrder.task_code_front}"?`)) {
                    handleRemoveOrder(selectedOrder.id)
                }
            }
        }

        // Thêm event listener
        document.addEventListener('keydown', handleKeyPress)

        // Cleanup khi component unmount
        return () => {
            document.removeEventListener('keydown', handleKeyPress)
        }
    }, [selectedOrder]) // Chỉ re-run khi selectedOrder thay đổi

    // Close user menu on outside click
    useEffect(() => {
        if (!showUserMenu) return
        const onDown = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false)
            }
        }
        document.addEventListener('mousedown', onDown)
        return () => document.removeEventListener('mousedown', onDown)
    }, [showUserMenu])

    // Derive a friendly display name + initials from the user object.
    const getDisplayName = (): string => {
        if (!user) return 'User'
        return (
            user.name ||
            user.full_name ||
            user.fullName ||
            user.username ||
            (typeof user.email === 'string' ? user.email.split('@')[0] : '') ||
            'User'
        )
    }
    const getUserEmail = (): string => (user && typeof user.email === 'string' ? user.email : '')
    const getInitials = (): string => {
        const name = getDisplayName()
        const parts = name.trim().split(/\s+/)
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        return name.slice(0, 2).toUpperCase()
    }

    const addNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
        const id = Date.now().toString()
        setNotifications(prev => [...prev, { id, message, type }])
    }

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    const saveOrdersToStorage = (ordersList: OrderDetail[]) => {
        try {
            localStorage.setItem('scannedOrders', JSON.stringify(ordersList))
        } catch (error) {
            console.error('Failed to save orders to localStorage:', error)
        }
    }

    const handleOrderScanned = async (code: string) => {
        if (!window.electronAPI) return

        setIsScanning(true)
        // Bỏ notification scanning base

        try {
            const result = await window.electronAPI.getOrders(code)

            if (result.totalFound === 0) {
                addNotification(`Không tìm thấy đơn hàng với mã: ${code}`, 'error')
                return
            }

            if (result.validOrders === 0) {
                addNotification(`Tìm thấy ${result.totalFound} đơn hàng với mã: ${code}, nhưng không có đơn hàng nào có trạng thái hợp lệ (C1F1R1P1E1V0)`, 'warning')
                return
            }

            // Kiểm tra xem mã đã được scan chưa
            const existingOrders = result.orders.filter(order =>
                orders.find(o => o.id === order.id)
            )

            if (existingOrders.length > 0) {
                // Có đơn hàng đã được scan trước đó
                const existingOrder = existingOrders[0]
                addNotification(`Mã đơn hàng ${code} đã được scan trước đó!`, 'warning')
                return
            }

            // Add valid orders to the list
            let newOrdersAdded = false
            result.orders.forEach(order => {
                if (!orders.find(o => o.id === order.id)) {
                    setOrders(prev => {
                        const orderWithScanTime = { ...order, scanTime: Date.now() }
                        const newOrders = [orderWithScanTime, ...prev] // Add new order at the beginning
                        saveOrdersToStorage(newOrders)
                        return newOrders
                    })
                    setTotalOrders(prev => prev + 1)
                    newOrdersAdded = true
                }
            })

            if (result.validOrders > 0) {
                addNotification(`Tìm thấy ${result.validOrders} đơn hàng hợp lệ với mã: ${code}`, 'success')
                // Auto-select the first new order
                if (newOrdersAdded && result.orders.length > 0) {
                    setSelectedOrder(result.orders[0])
                }

                // Auto-print barcode if BarTender is enabled
                if (window.electronAPI) {
                    try {
                        const printResult = await window.electronAPI.printBarcode(code, result.orders[0])
                        // if (printResult.success) {
                        //     addNotification('Barcode printed successfully', 'success')
                        // } else {
                        //     addNotification(`Print failed: ${printResult.message}`, 'warning')
                        // }
                    } catch (error) {
                        console.error('Print error:', error)
                        addNotification('Print error occurred', 'error')
                    }
                }

                if (
                    config.barTenderConfig &&
                    config.barTenderConfig.autoExport &&
                    window.electronAPI &&
                    typeof window.electronAPI.exportOrderToExcel === 'function'
                ) {
                    try {
                        await window.electronAPI.exportOrderToExcel(result.orders[0], config.barTenderConfig.exportFolder)
                        addNotification('Đã export file Excel tự động!', 'success')
                    } catch (error) {
                        addNotification('Lỗi khi export Excel tự động', 'error')
                    }
                }
            }
        } catch (error) {
            console.error('Error searching orders:', error)
            addNotification(`Lỗi tìm kiếm đơn hàng: ${error}`, 'error')
        } finally {
            setIsScanning(false)
        }
    }

    const handleClearList = () => {
        setOrders([])
        setSelectedOrder(null)
        setTotalOrders(0)
        localStorage.removeItem('scannedOrders')
    }

    const handleDeleteOrder = (orderId: number) => {
        setOrders(prev => {
            const newOrders = prev.filter(o => o.id !== orderId)
            saveOrdersToStorage(newOrders)

            // If we're deleting the selected order, select the first remaining order
            if (selectedOrder?.id === orderId) {
                if (newOrders.length > 0) {
                    setSelectedOrder(newOrders[0])
                } else {
                    setSelectedOrder(null)
                }
            }

            return newOrders
        })
        setTotalOrders(prev => prev - 1)
    }

    const handleAddToInventory = async () => {
        if (!window.electronAPI || orders.length === 0) return

        console.log('=== DEBUG: Add to Inventory ===')
        console.log('Orders count:', orders.length)
        console.log('Current auth token:', authToken ? `${authToken.substring(0, 20)}...` : 'null')
        console.log('Is authenticated:', isAuthenticated)

        try {
            // Lấy tất cả IDs từ orders
            const orderIds = orders.map(order => order.id)

            console.log('Adding orders to inventory:', {
                count: orderIds.length,
                ids: orderIds,
                statusCodeString: 'C1F1R1P1E1V1I0'
            })

            // Kiểm tra token trước khi gọi API
            if (!authToken) {
                throw new Error('Không có token authentication. Vui lòng đăng nhập lại.')
            }

            // Sử dụng API mới để update tất cả orders cùng lúc
            const success = await window.electronAPI.updateOrderStatusCodes(orderIds, 'C1F1R1P1E1V1I0')

            console.log('API call result:', success)

            if (success) {
                addNotification(`Successfully added ${orderIds.length} orders to inventory`, 'success')
                // Clear the order list after successful inventory addition
                setOrders([])
                setTotalOrders(0)
                setSelectedOrder(null)
                localStorage.removeItem('scannedOrders')
            } else {
                addNotification('Failed to add orders to inventory - API returned false', 'error')
            }
        } catch (error: any) {
            console.error('=== DEBUG: Add to Inventory Error ===')
            console.error('Error adding orders to inventory:', error)

            // Hiển thị thông tin chi tiết về lỗi
            let errorMessage = 'Error adding orders to inventory'

            if (error.message) {
                if (error.message.includes('No handler registered')) {
                    errorMessage = 'IPC handler not found - please restart the application'
                } else if (error.message.includes('Network Error')) {
                    errorMessage = 'Network connection error - please check your internet connection'
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Request timeout - server is not responding'
                } else if (error.message.includes('Token không hợp lệ') || error.message.includes('Invalid token')) {
                    errorMessage = 'Token đã hết hạn. Vui lòng đăng nhập lại.'
                    // Tự động logout khi token hết hạn
                    setTimeout(() => {
                        handleLogout()
                    }, 2000)
                } else if (error.message.includes('401') || error.message.includes('403')) {
                    errorMessage = 'Authentication error - please login again'
                    // Tự động logout khi có lỗi authentication
                    setTimeout(() => {
                        handleLogout()
                    }, 2000)
                } else if (error.message.includes('500')) {
                    errorMessage = 'Server error - please try again later'
                } else {
                    errorMessage = `API Error: ${error.message}`
                }
            }

            addNotification(errorMessage, 'error')
        }
    }

    const handleConfigChange = (newConfig: Partial<AppConfig>) => {
        const updatedConfig = { ...config, ...newConfig }
        setConfig(updatedConfig)

        if (window.electronAPI) {
            window.electronAPI.setConfig(updatedConfig)
        }

        if (showSettings) {
            setShowSettings(false)
            addNotification('Configuration updated successfully!', 'success')
        }
    }

    const handleRemoveOrder = (orderId: number) => {
        // Tìm order bị xóa để hiển thị thông tin
        const orderToRemove = orders.find(o => o.id === orderId)

        setOrders(prev => {
            const newOrders = prev.filter(o => o.id !== orderId)
            saveOrdersToStorage(newOrders)
            setTotalOrders(newOrders.length)

            // If removed order was selected, try to select another order
            if (selectedOrder?.id === orderId) {
                // Tìm order khác trong cùng group để select
                const sameGroupOrders = newOrders.filter(o => o.order_id === selectedOrder.order_id)
                if (sameGroupOrders.length > 0) {
                    setSelectedOrder(sameGroupOrders[0])
                } else {
                    // Nếu không có order nào trong group, select order đầu tiên
                    setSelectedOrder(newOrders.length > 0 ? newOrders[0] : null)
                }
            }

            return newOrders
        })

        // Hiển thị notification với thông tin chi tiết
        const orderInfo = orderToRemove ? `${orderToRemove.task_code_front} (${orderToRemove.customer_name})` : 'Unknown order'
        //focus to scanner
        const inputElement = document.querySelector('.code-input') as HTMLInputElement
        if (inputElement) {
            inputElement.focus()
        }
        addNotification(`Đã xóa: ${orderInfo}`, 'info')
    }

    // Authentication handlers
    const handleLoginSuccess = async (token: string, userData: any) => {
        console.log('=== DEBUG: Login Success ===')
        console.log('Token received:', token ? `${token.substring(0, 20)}...` : 'null')
        console.log('User data:', userData)

        // Clear old data first
        setAuthToken(null)
        setUser(null)
        setIsAuthenticated(false)
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')

        // Set new data
        setAuthToken(token)
        setUser(userData)
        setIsAuthenticated(true)

        // Save to localStorage first
        localStorage.setItem('authToken', token)
        localStorage.setItem('user', JSON.stringify(userData))
        console.log('✅ Token saved to localStorage')

        // Set auth token in main process
        if (window.electronAPI) {
            try {
                console.log('🔄 Setting token in main process...')
                const success = await window.electronAPI.setAuthToken(token)
                console.log('✅ Token set in main process:', success)

                if (!success) {
                    console.error('❌ Failed to set token in main process')
                    addNotification('Cảnh báo: Token không được cập nhật trong main process', 'warning')
                }
            } catch (error) {
                console.error('❌ Failed to set token in main process:', error)
                addNotification('Lỗi: Không thể cập nhật token trong main process', 'error')
            }
        } else {
            console.error('❌ window.electronAPI not available')
            addNotification('Lỗi: Electron API không khả dụng', 'error')
        }

        // Verify token is set correctly
        setTimeout(async () => {
            try {
                if (window.electronAPI) {
                    // Test API call to verify token works
                    const testResult = await window.electronAPI.updateOrderStatusCodes([484875], 'C1F1R1P1E1V1I0')
                    console.log('✅ Token verification test result:', testResult)
                }
            } catch (error) {
                console.error('❌ Token verification test failed:', error)
            }
        }, 1000)

        addNotification('Đăng nhập thành công!', 'success')
    }

    const handleLoginError = (error: string) => {
        addNotification(`Đăng nhập thất bại: ${error}`, 'error')
    }

    const handleLogout = async () => {
        setAuthToken(null)
        setUser(null)
        setIsAuthenticated(false)
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')

        // Clear auth token in main process
        if (window.electronAPI) {
            await window.electronAPI.setAuthToken(null)
        }

        addNotification('Đã đăng xuất', 'info')
    }

    return (
        <div className="App">
            {/* Loading state */}
            {isLoadingConfig && (
                <div className="loading-overlay">
                    <div className="loading-content">
                        <div className="spinner"></div>
                        <p>Loading configuration...</p>
                    </div>
                </div>
            )}

            {/* Show Login if not authenticated */}
            {!isAuthenticated ? (
                <Login
                    onLoginSuccess={handleLoginSuccess}
                    onLoginError={handleLoginError}
                />
            ) : (
                <>
                    {/* Show Settings if config is invalid or forced open */}
                    {(showSettings || !isConfigValid) ? (
                        <div
                            className="settings-overlay"
                            onClick={isConfigValid ? () => setShowSettings(false) : undefined}
                        >
                            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="settings-header">
                                    <h2>Database Configuration Required</h2>
                                    {isConfigValid && (
                                        <button
                                            className="close-btn"
                                            onClick={() => setShowSettings(false)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                <Settings
                                    config={config}
                                    onConfigChange={handleConfigChange}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="app-header">
                                <h1 className="app-title">
                                    <img src={logoUrl} alt="" className="app-logo" />
                                    iSuccess Scan Barcode
                                </h1>
                                <div className="header-controls">
                                    <div className="total-orders">Total orders: {totalOrders}</div>
                                    <div className="header-buttons">
                                        <button
                                            className="action-btn"
                                            onClick={handleAddToInventory}
                                            disabled={orders.length === 0}
                                            title="Add all orders to inventory"
                                        >
                                            📦 Add to Inventory
                                        </button>
                                        <button
                                            className="action-btn"
                                            onClick={handleClearList}
                                            disabled={orders.length === 0}
                                            title="Clear all orders from list"
                                        >
                                            🗑️ Clear List
                                        </button>
                                        <div className="user-menu" ref={userMenuRef}>
                                            <button
                                                className={`user-menu-trigger ${showUserMenu ? 'open' : ''}`}
                                                onClick={() => setShowUserMenu(v => !v)}
                                                title={getUserEmail() || getDisplayName()}
                                            >
                                                <span className="user-avatar">{getInitials()}</span>
                                                <span className="user-name">{getDisplayName()}</span>
                                                <svg className="user-menu-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </button>

                                            {showUserMenu && (
                                                <div className="user-menu-dropdown">
                                                    <div className="user-menu-info">
                                                        <div className="user-menu-info-name">{getDisplayName()}</div>
                                                        {getUserEmail() && (
                                                            <div className="user-menu-info-email">{getUserEmail()}</div>
                                                        )}
                                                    </div>
                                                    <div className="user-menu-section">
                                                        <button
                                                            className="user-menu-item"
                                                            onClick={() => { setShowImageSettings(true); setShowUserMenu(false) }}
                                                        >
                                                            <span className="user-menu-icon">🖼️</span>
                                                            <span>Hình ảnh</span>
                                                        </button>
                                                        <button
                                                            className="user-menu-item"
                                                            onClick={() => { setShowSettings(true); setShowUserMenu(false) }}
                                                        >
                                                            <span className="user-menu-icon">⚙️</span>
                                                            <span>Cấu hình API</span>
                                                        </button>
                                                        <button
                                                            className="user-menu-item"
                                                            onClick={() => { setShowBarTenderSettings(true); setShowUserMenu(false) }}
                                                        >
                                                            <span className="user-menu-icon">🏷️</span>
                                                            <span>BarTender</span>
                                                        </button>
                                                    </div>
                                                    <div className="user-menu-divider"></div>
                                                    <button
                                                        className="user-menu-item user-menu-item-danger"
                                                        onClick={() => { setShowUserMenu(false); handleLogout() }}
                                                        title="Đăng xuất"
                                                    >
                                                        <span className="user-menu-icon">🚪</span>
                                                        <span>Đăng xuất</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="scan-section">
                                <Scanner config={config} onOrderScanned={handleOrderScanned} isScanning={isScanning} />
                            </div>

                            <div className="main-content">
                                {/* Left Panel: Order List */}
                                <div className="panel order-list-panel">
                                    <div className="panel-header">
                                        <h3>Order List ({orders.length})</h3>
                                        <div className="panel-icon">📋</div>
                                        {selectedOrder && (
                                            <div className="keyboard-hint">
                                                💡 Nhấn <kbd>Space</kbd> để xóa item đang chọn
                                            </div>
                                        )}
                                    </div>
                                    <div className="panel-content">
                                        {Object.entries(groupedOrders).length > 0 ? (
                                            <div className="order-groups">
                                                {Object.entries(groupedOrders)
                                                    .sort(([, itemsA], [, itemsB]) => {
                                                        // Sort groups by the newest scan time of any item in the group
                                                        if (!Array.isArray(itemsA) || !Array.isArray(itemsB)) {
                                                            return 0
                                                        }
                                                        const maxTimeA = Math.max(...itemsA.map(item => item.scanTime || 0))
                                                        const maxTimeB = Math.max(...itemsB.map(item => item.scanTime || 0))
                                                        return maxTimeB - maxTimeA // Newest first
                                                    })
                                                    .map(([orderId, orderItems]) => {
                                                        if (!Array.isArray(orderItems) || orderItems.length === 0) {
                                                            return null
                                                        }
                                                        const firstItem = orderItems[0]
                                                        if (!firstItem) {
                                                            return null
                                                        }
                                                        const totalItems = orderItems.length
                                                        const totalQuantity = orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
                                                        // total_quantity từ API chứa tổng số items trong đơn hàng (total_items_in_order)
                                                        const totalItemsInOrder = firstItem?.total_quantity || totalItems || 1

                                                        return (
                                                            <div key={orderId} className="order-group">
                                                                <div className="order-group-header compact-grid">
                                                                    <div className="order-info">
                                                                        <h5>#{firstItem.origin_id || orderId} - {firstItem.customer_name || 'Unknown Customer'}</h5>
                                                                    </div>
                                                                    <div className="order-meta">
                                                                        <div className="order-stats">
                                                                            <span className="item-count">{totalItems}/{totalItemsInOrder} items</span>
                                                                            {/* <span className="quantity-count">Qty: {totalQuantity}</span> */}
                                                                            <span className="platform">{firstItem.platform}</span>
                                                                        </div>
                                                                        {/* <div className="shipping-info">
                                                                            📍 {firstItem.shipping_city}, {firstItem.shipping_state} {firstItem.shipping_zip}
                                                                        </div> */}
                                                                    </div>
                                                                </div>

                                                                <div className="order-items">
                                                                    {orderItems.map((order) => (
                                                                        <div
                                                                            key={order.id}
                                                                            className={`order-item ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                                                                            onClick={() => setSelectedOrder(order)}
                                                                        >
                                                                            <div className="item-info">
                                                                                {/* <div className="task-code">
                                                                        <strong>{order.task_code_front}</strong>
                                                                        {order.task_code_back && <span className="back-code">+ {order.task_code_back}</span>}
                                                                    </div>
                                                                    <div className="product-name">{order.product_name_new}</div> */}
                                                                                <div className="item-details">
                                                                                    <span className="task-code">Task Code: {order.task_code_front}</span>
                                                                                    <span className="quantity">Qty: {order.quantity}</span>
                                                                                    <span className="price">${order.price}</span>
                                                                                    <span className="status-code">{order.status_code_string}</span>
                                                                                </div>
                                                                                {/* <div className="status-info">
                                                                        <span className={`status ${order.status}`}>{order.status}</span>
                                                                        <span className="status-code">{order.status_code_string}</span>
                                                                    </div> */}
                                                                            </div>
                                                                            <button
                                                                                className="remove-order"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    // Xác nhận trước khi xóa
                                                                                    if (window.confirm(`Bạn có chắc muốn xóa item "${order.task_code_front}"?`)) {
                                                                                        handleRemoveOrder(order.id)
                                                                                    }
                                                                                }}
                                                                                title="Remove order from list"
                                                                            >
                                                                                🗑️
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                    .filter(Boolean)}
                                            </div>
                                        ) : (
                                            <div className="empty-state">
                                                <div className="empty-icon">📦</div>
                                                <p>No orders scanned yet</p>
                                                <p>Scan a barcode to get started</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Panel: Order Details & Image */}
                                <div className="panel image-panel">
                                    <div className="panel-header">
                                        <h3>Product Image</h3>
                                        <div className="panel-icon">🖼️</div>
                                    </div>
                                    <div className="panel-content">
                                        {selectedOrder ? (
                                            <OrderView config={config} order={selectedOrder} showImageOnly={true} />
                                        ) : (
                                            <div className="empty-state">
                                                <div className="empty-icon">📦</div>
                                                <p>Select an order to view image</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {showBarTenderSettings && (
                                <BarTenderSettings onClose={() => setShowBarTenderSettings(false)} />
                            )}

                            {showImageSettings && (
                                <ImageSettings
                                    onClose={() => setShowImageSettings(false)}
                                    onSaved={async () => {
                                        if (window.electronAPI) {
                                            const loaded: AppConfig = await window.electronAPI.getConfig()
                                            if (loaded) setConfig(loaded)
                                        }
                                    }}
                                />
                            )}
                        </>
                    )}

                    <div className="app-footer">
                        <p>Design and Developed by the Dev Department at iSuccess Company.</p>
                    </div>

                    {/* Notification Container */}
                    <div className="notification-container">
                        {notifications.map(notification => (
                            <Notification
                                key={notification.id}
                                message={notification.message}
                                type={notification.type}
                                onClose={() => removeNotification(notification.id)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default App