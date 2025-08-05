import React, { useState, useEffect } from 'react'
import Scanner from './components/Scanner'
import OrderView from './components/OrderView'
import Settings from './components/Settings'
import BarTenderSettings from './components/BarTenderSettings'
import Notification from './components/Notification'
import './App.css'

interface DatabaseConfig {
    host: string
    port: number
    user: string
    password: string
    database: string
    tableName: string
}

interface AppConfig {
    databaseConfig: DatabaseConfig
    imagePath: string
}

interface OrderDetail {
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

function App() {
    const [config, setConfig] = useState<AppConfig>({
        databaseConfig: {
            host: '127.0.0.1',
            port: 3306,
            user: 'root',
            password: '',
            database: 'production',
            tableName: 'order_details'
        },
        imagePath: '/Users/macvn/Desktop/test-image'
    })

    const [orders, setOrders] = useState<OrderDetail[]>([])
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
    const [totalOrders, setTotalOrders] = useState(0)
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
        return !!(config.databaseConfig?.host &&
            config.databaseConfig?.user &&
            config.databaseConfig?.database &&
            config.databaseConfig?.tableName)
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
                            addNotification('Database configuration required. Please configure your database settings.', 'warning')
                        }
                    } else {
                        // Không có config, tự động mở Settings
                        setShowSettings(true)
                        addNotification('No database configuration found. Please configure your database settings.', 'warning')
                    }
                }
            } catch (error) {
                console.error('Failed to load config:', error)
                // Lỗi load config, tự động mở Settings
                setShowSettings(true)
                addNotification('Failed to load configuration. Please configure your database settings.', 'error')
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
        addNotification(`Scanning barcode: ${code}...`, 'info')

        try {
            const result = await window.electronAPI.getOrders(code)

            if (result.totalFound === 0) {
                addNotification(`No orders found with code: ${code}`, 'error')
                return
            }

            if (result.validOrders === 0) {
                addNotification(`Found ${result.totalFound} order(s) with code: ${code}, but none have valid status (C1F1R1P1E1V0)`, 'warning')
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
                addNotification(`Found ${result.validOrders} valid order(s) with code: ${code}`, 'success')
                // Auto-select the first new order
                if (newOrdersAdded && result.orders.length > 0) {
                    setSelectedOrder(result.orders[0])
                }

                // Auto-print barcode if BarTender is enabled
                if (window.electronAPI) {
                    try {
                        const printResult = await window.electronAPI.printBarcode(code, result.orders[0])
                        if (printResult.success) {
                            addNotification('Barcode printed successfully', 'success')
                        } else {
                            addNotification(`Print failed: ${printResult.message}`, 'warning')
                        }
                    } catch (error) {
                        console.error('Print error:', error)
                        addNotification('Print error occurred', 'error')
                    }
                }
            }
        } catch (error) {
            console.error('Error searching orders:', error)
            addNotification(`Error searching orders: ${error}`, 'error')
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

        // Kiểm tra config mới có hợp lệ không
        const isValid = validateConfig(updatedConfig)
        setIsConfigValid(isValid)

        // Nếu config hợp lệ, đóng Settings
        if (isValid && showSettings) {
            setShowSettings(false)
            addNotification('Database configuration saved successfully!', 'success')
        }
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

                    <div className="scan-section">
                        <Scanner config={config} onOrderScanned={handleOrderScanned} isScanning={isScanning} />
                    </div>

                    <div className="main-content">
                        <div className="panel order-list-panel">
                            <div className="panel-header">
                                <h3>Order List ({orders.length})</h3>
                                <div className="panel-icon">📋</div>
                            </div>
                            <div className="panel-actions">
                                <button
                                    className="inventory-btn"
                                    onClick={handleAddToInventory}
                                    disabled={orders.length === 0}
                                >
                                    📦 Add to Inventory
                                </button>
                                <button
                                    className="clear-storage-btn"
                                    onClick={() => {
                                        localStorage.removeItem('scannedOrders')
                                        addNotification('Storage cleared successfully', 'info')
                                    }}
                                    title="Clear saved data"
                                >
                                    🗄️ Clear Storage
                                </button>
                            </div>
                            <div className="panel-content">
                                {orders.length === 0 ? (
                                    <div className="empty-state">
                                        <p>No orders scanned yet</p>
                                    </div>
                                ) : (
                                    <div className="order-list">
                                        {orders.map((order) => (
                                            <div
                                                key={order.id}
                                                className={`order-item ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                <div className="order-item-main">
                                                    <span className="order-code">{order.task_code}</span>
                                                    <span className="order-name">{order.product_name_new || 'No name'}</span>
                                                </div>
                                                <button
                                                    className="delete-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteOrder(order.id)
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="panel center-panel">
                            <div className="panel-header">
                                <div className="instructions">Click on the row to select, press Space to delete</div>
                                <button className="clear-btn" onClick={handleClearList}>
                                    🗑️ Clear List
                                </button>
                            </div>
                            <div className="panel-content">
                                {selectedOrder ? (
                                    <OrderView config={config} order={selectedOrder} />
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-icon">📦</div>
                                        <p>No orders yet</p>
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