import React, { useState, useEffect } from 'react'

interface BarTenderConfig {
    enabled: boolean
    method: 'named_pipe' | 'http' | 'file' | 'excel'
    namedPipePath?: string
    httpUrl?: string
    filePath?: string
    excelPath?: string
    templateName?: string
    printQuantity?: number
}

interface BarTenderSettingsProps {
    onClose: () => void
}

const BarTenderSettings: React.FC<BarTenderSettingsProps> = ({ onClose }) => {
    const [config, setConfig] = useState<BarTenderConfig>({
        enabled: false,
        method: 'file',
        filePath: '',
        templateName: 'Default',
        printQuantity: 1
    })
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        if (window.electronAPI) {
            try {
                const savedConfig = await window.electronAPI.getBarTenderConfig()
                if (savedConfig) {
                    setConfig(savedConfig)
                }
            } catch (error) {
                console.error('Failed to load BarTender config:', error)
            }
        }
    }

    const saveConfig = async () => {
        if (window.electronAPI) {
            try {
                setLoading(true)
                const success = await window.electronAPI.setBarTenderConfig(config)
                if (success) {
                    setTestResult({ success: true, message: 'BarTender configuration saved successfully' })
                } else {
                    setTestResult({ success: false, message: 'Failed to save BarTender configuration' })
                }
            } catch (error) {
                setTestResult({ success: false, message: `Error: ${error}` })
            } finally {
                setLoading(false)
            }
        }
    }

    const testConnection = async () => {
        if (window.electronAPI) {
            try {
                setLoading(true)
                const result = await window.electronAPI.testBarTenderConnection()
                setTestResult(result)
            } catch (error) {
                setTestResult({ success: false, message: `Test error: ${error}` })
            } finally {
                setLoading(false)
            }
        }
    }

    const handleInputChange = (field: keyof BarTenderConfig, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }))
    }

    return (
        <div className="settings-overlay">
            <div className="settings-modal">
                <div className="settings-header">
                    <h2>BarTender Integration Settings</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="settings-content">
                    <div className="settings-section">
                        <h3>BarTender Configuration</h3>
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={config.enabled}
                                    onChange={(e) => handleInputChange('enabled', e.target.checked)}
                                />
                                Enable BarTender Integration
                            </label>
                        </div>

                        {config.enabled && (
                            <>
                                <div className="form-group">
                                    <label>Integration Method</label>
                                    <select
                                        value={config.method}
                                        onChange={(e) => handleInputChange('method', e.target.value)}
                                    >
                                        <option value="file">File System</option>
                                        <option value="excel">Excel Export</option>
                                        <option value="named_pipe">Named Pipes (Windows)</option>
                                        <option value="http">HTTP/HTTPS</option>
                                    </select>
                                </div>

                                {config.method === 'file' && (
                                    <div className="form-group">
                                        <label>File Path</label>
                                        <input
                                            type="text"
                                            value={config.filePath || ''}
                                            onChange={(e) => handleInputChange('filePath', e.target.value)}
                                            placeholder="/path/to/print_queue.json"
                                        />
                                    </div>
                                )}

                                {config.method === 'named_pipe' && (
                                    <div className="form-group">
                                        <label>Named Pipe Path</label>
                                        <input
                                            type="text"
                                            value={config.namedPipePath || ''}
                                            onChange={(e) => handleInputChange('namedPipePath', e.target.value)}
                                            placeholder="\\\\.\\pipe\\BarTenderPrint"
                                        />
                                    </div>
                                )}

                                {config.method === 'http' && (
                                    <div className="form-group">
                                        <label>HTTP URL</label>
                                        <input
                                            type="text"
                                            value={config.httpUrl || ''}
                                            onChange={(e) => handleInputChange('httpUrl', e.target.value)}
                                            placeholder="http://localhost:8080/print"
                                        />
                                    </div>
                                )}

                                {config.method === 'excel' && (
                                    <div className="form-group">
                                        <label>Excel File Path</label>
                                        <input
                                            type="text"
                                            value={config.excelPath || ''}
                                            onChange={(e) => handleInputChange('excelPath', e.target.value)}
                                            placeholder="/path/to/bartender_export.xlsx"
                                        />
                                    </div>
                                )}

                                {config.method !== 'excel' && (
                                    <>
                                        <div className="form-group">
                                            <label>Template Name</label>
                                            <input
                                                type="text"
                                                value={config.templateName || ''}
                                                onChange={(e) => handleInputChange('templateName', e.target.value)}
                                                placeholder="Default"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Print Quantity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={config.printQuantity || 1}
                                                onChange={(e) => handleInputChange('printQuantity', parseInt(e.target.value))}
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {testResult && (
                        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                            {testResult.message}
                        </div>
                    )}

                    <div className="settings-actions">
                        <button
                            className="test-btn"
                            onClick={testConnection}
                            disabled={!config.enabled || loading}
                        >
                            {loading ? 'Testing...' : 'Test Connection'}
                        </button>
                        <button
                            className="save-btn"
                            onClick={saveConfig}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Configuration'}
                        </button>
                        <button className="cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BarTenderSettings 