import React, { useState, useEffect } from 'react'
import Scanner from './components/Scanner'
import OrderView from './components/OrderView'
import Settings from './components/Settings'
import BarTenderSettings from './components/BarTenderSettings'
import Notification from './components/Notification'
import './App.css'

interface ApiConfig {
    baseURL: string
    timeout?: number
    username?: string
    password?: string
    apiKey?: string
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

interface AppConfig {
    apiConfig: ApiConfig
    imagePath: string
    barTenderConfig: BarTenderConfig
}

interface OrderDetail {
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

function App() {
    const [config, setConfig] = useState<AppConfig>({
        apiConfig: {
            baseURL: '', // User will configure this
            timeout: 10000,
            username: '',
            password: '',
            apiKey: ''
        },
        imagePath: '/Users/macvn/Desktop/test-image',
        barTenderConfig: {
            enabled: false,
            bartenderPath: '',
            templatePath: '',
            exportFolder: '',
            autoExport: false,
            autoPrint: false,
            printScriptPath: '',
            printMethod: 'direct'
        }
    })

    const [orders, setOrders] = useState<OrderDetail[]>([])
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
    const [totalOrders, setTotalOrders] = useState(0)
    const [groupedOrders, setGroupedOrders] = useState<{ [key: number]: OrderDetail[] }>({})
    const [showSettings, setShowSettings] = useState(false)
    const [showBarTenderSettings, setShowBarTenderSettings] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [isConfigValid, setIsConfigValid] = useState(false)
    const [isLoadingConfig, setIsLoadingConfig] = useState(true)
    const [notifications, setNotifications] = useState<Array<{
        id: string
        message: string
        type: 'success' | 'error' | 'warning' | 'info'
    }>>([])

    // Kiểm tra config có hợp lệ không
    const validateConfig = (config: AppConfig): boolean => {
        return !!(config.apiConfig?.baseURL) // Chỉ cần baseURL là đủ
    }

    useEffect(() => {
        const loadConfig = async () => {
            try {
                if (window.electronAPI) {
                    const loadedConfig: AppConfig = await window.electronAPI.getConfig()
                    if (loadedConfig) {
                        setConfig(loadedConfig)
                        const isValid = validateConfig(loadedConfig)
                        setIsConfigValid(isValid)

                        // Nếu config không hợp lệ, tự động mở Settings
                        if (!isValid) {
                            setShowSettings(true)
                            addNotification('API configuration required. Please configure your API settings.', 'warning')
                        }
                    } else {
                        // Không có config, tự động mở Settings
                        setShowSettings(true)
                        addNotification('No API configuration found. Please configure your API settings.', 'warning')
                    }
                }
            } catch (error) {
                console.error('Failed to load config:', error)
                // Lỗi load config, tự động mở Settings
                setShowSettings(true)
                addNotification('Failed to load configuration. Please configure your API settings.', 'error')
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
    }, [])

    useEffect(() => {
        // Group orders by order_id
        const grouped = orders.reduce((acc, order) => {
            if (!acc[order.order_id]) {
                acc[order.order_id] = []
            }
            acc[order.order_id].push(order)
            return acc
        }, {} as { [key: number]: OrderDetail[] })

        setGroupedOrders(grouped)
    }, [orders])

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
                        const newOrders = [order, ...prev] // Add new order at the beginning
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

        try {
            let successCount = 0
            let failCount = 0

            for (const order of orders) {
                const success = await window.electronAPI.updateOrderStatusCode(order.id, 'C1F1R1P1E1V1I0')
                if (success) {
                    successCount++
                } else {
                    failCount++
                }
            }

            if (successCount > 0) {
                addNotification(`Successfully added ${successCount} orders to inventory${failCount > 0 ? `, ${failCount} failed` : ''}`, 'success')
                // Clear the order list after successful inventory addition
                setOrders([])
                setTotalOrders(0)
                setSelectedOrder(null)
                localStorage.removeItem('scannedOrders')
            } else {
                addNotification('Failed to add orders to inventory', 'error')
            }
        } catch (error) {
            console.error('Error adding orders to inventory:', error)
            addNotification('Error adding orders to inventory', 'error')
        }
    }

    const handleConfigChange = (newConfig: Partial<AppConfig>) => {
        const updatedConfig = { ...config, ...newConfig }
        setConfig(updatedConfig)

        // Validate config
        const isValid = validateConfig(updatedConfig)
        setIsConfigValid(isValid)

        // Save config
        if (window.electronAPI) {
            window.electronAPI.setConfig(updatedConfig)
        }

        // Close settings if config is valid
        if (isValid && showSettings) {
            setShowSettings(false)
            addNotification('Configuration updated successfully!', 'success')
        }
    }

    const handleRemoveOrder = (orderId: number) => {
        setOrders(prev => {
            const newOrders = prev.filter(o => o.id !== orderId)
            saveOrdersToStorage(newOrders)
            setTotalOrders(newOrders.length)

            // If removed order was selected, clear selection
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(null)
            }

            return newOrders
        })
        addNotification('Order removed from list', 'info')
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

            {/* Show Settings if config is invalid or forced open */}
            {(showSettings || !isConfigValid) ? (
                <div className="settings-overlay">
                    <div className="settings-modal">
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
                        <h1 className="app-title">Scan Barcode & Manage Orders</h1>
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
                                <button
                                    className="settings-btn"
                                    onClick={() => setShowSettings(!showSettings)}
                                >
                                    ⚙️ Settings
                                </button>
                                <button
                                    className="settings-btn"
                                    onClick={() => setShowBarTenderSettings(!showBarTenderSettings)}
                                >
                                    🏷️ BarTender
                                </button>
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
                            </div>
                            <div className="panel-content">
                                {Object.entries(groupedOrders).length > 0 ? (
                                    <div className="order-groups">
                                        {Object.entries(groupedOrders).map(([orderId, orderItems]) => {
                                            console.log(groupedOrders)
                                            const firstItem = orderItems[0]
                                            console.log(orderItems)
                                            const totalItems = orderItems.length
                                            const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0)
                                            // total_quantity từ API chứa tổng số items trong đơn hàng (total_items_in_order)
                                            const totalItemsInOrder = firstItem.total_quantity || totalItems || 1

                                            return (
                                                <div key={orderId} className="order-group">
                                                    <div className="order-group-header compact-grid">
                                                        <div className="order-info">
                                                            <h4>Order #{firstItem.origin_id || orderId}</h4>
                                                            <div className="customer-info">
                                                                <strong>{firstItem.customer_name || 'Unknown Customer'}</strong>
                                                            </div>
                                                        </div>
                                                        <div className="order-meta">
                                                            <div className="order-stats">
                                                                <span className="item-count">{totalItems}/{totalItemsInOrder} items</span>
                                                                <span className="quantity-count">Qty: {totalQuantity}</span>
                                                                <span className="platform">{firstItem.platform}</span>
                                                            </div>
                                                            <div className="shipping-info">
                                                                📍 {firstItem.shipping_city}, {firstItem.shipping_state} {firstItem.shipping_zip}
                                                            </div>
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
                                                                    <div className="task-code">
                                                                        <strong>{order.task_code_front}</strong>
                                                                        {order.task_code_back && <span className="back-code">+ {order.task_code_back}</span>}
                                                                    </div>
                                                                    <div className="product-name">{order.product_name_new}</div>
                                                                    <div className="item-details">
                                                                        <span className="quantity">Qty: {order.quantity}</span>
                                                                        <span className="size">{order.size_style}</span>
                                                                        <span className="price">${order.price}</span>
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
                                                                        handleRemoveOrder(order.id)
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
                                        })}
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
        </div>
    )
}

export default App