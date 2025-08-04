const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    getOrders: (taskCode) => ipcRenderer.invoke('get-orders', taskCode),
    updateOrderStatus: (orderId, status) => ipcRenderer.invoke('update-order-status', orderId, status),
    getConfig: () => ipcRenderer.invoke('get-config'),
    setConfig: (config) => ipcRenderer.invoke('set-config', config),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    testDatabaseConnection: (dbConfig) => ipcRenderer.invoke('test-database-connection', dbConfig),
    createSampleData: () => ipcRenderer.invoke('create-sample-data')
}) 