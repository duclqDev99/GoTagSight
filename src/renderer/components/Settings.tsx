import React, { useState } from 'react'

interface ApiConfig {
    baseURL: string
    timeout?: number
    username?: string
    password?: string
    apiKey?: string
    environment?: 'development' | 'staging' | 'production' | 'custom'
    environmentUrls?: {
        development?: string
        staging?: string
        production?: string
        custom?: string
    }
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

interface SettingsProps {
    config: AppConfig
    onConfigChange: (newConfig: Partial<AppConfig>) => void
}

const Settings: React.FC<SettingsProps> = ({ config, onConfigChange }) => {
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
    const [isTesting, setIsTesting] = useState(false)
    const [barTenderConfig, setBarTenderConfig] = useState(config.barTenderConfig || {
        enabled: false,
        bartenderPath: '',
        templatePath: '',
        exportFolder: '',
        autoExport: false,
        autoPrint: false
    })

    // Sửa khởi tạo localConfig để sử dụng ApiConfig
    const [localConfig, setLocalConfig] = useState<AppConfig>(() => {
        const safeConfig = config || {}
        return {
            apiConfig: {
                baseURL: safeConfig.apiConfig?.baseURL || 'http://127.0.0.1:8001/api/v2',
                timeout: safeConfig.apiConfig?.timeout || 10000,
                username: safeConfig.apiConfig?.username || '',
                password: safeConfig.apiConfig?.password || '',
                apiKey: safeConfig.apiConfig?.apiKey || '',
                environment: safeConfig.apiConfig?.environment || 'development',
                environmentUrls: safeConfig.apiConfig?.environmentUrls || {
                    development: 'http://127.0.0.1:8001/api/v2',
                    staging: 'http://staging-api.example.com/api/v2',
                    production: 'http://api.example.com/api/v2'
                }
            },
            imagePath: safeConfig.imagePath || '',
            barTenderConfig: {
                enabled: safeConfig.barTenderConfig?.enabled || false,
                bartenderPath: safeConfig.barTenderConfig?.bartenderPath || '',
                templatePath: safeConfig.barTenderConfig?.templatePath || '',
                exportFolder: safeConfig.barTenderConfig?.exportFolder || '',
                autoExport: safeConfig.barTenderConfig?.autoExport || false,
                autoPrint: safeConfig.barTenderConfig?.autoPrint || false,
                printScriptPath: safeConfig.barTenderConfig?.printScriptPath || '',
                printMethod: safeConfig.barTenderConfig?.printMethod || 'direct'
            }
        }
    })

    const handleInputChange = (section: keyof AppConfig, field: keyof ApiConfig | keyof BarTenderConfig, value: string | number) => {
        setLocalConfig(prev => ({
            ...prev,
            [section]: {
                ...((typeof prev[section] === 'object' && prev[section]) ? prev[section] : {}),
                [field]: value
            }
        }))
    }

    const handleSave = async () => {
        try {
            if (window.electronAPI) {
                await window.electronAPI.setConfig({
                    apiConfig: localConfig.apiConfig,
                    imagePath: localConfig.imagePath,
                    barTenderConfig: localConfig.barTenderConfig
                })
                setTestResult({ success: true, message: 'Configuration saved successfully!' })
            }
        } catch (error) {
            setTestResult({ success: false, message: `Failed to save config: ${error}` })
        }
    }

    const handleApiChange = (field: keyof ApiConfig, value: string | number) => {
        const newApiConfig = {
            ...config.apiConfig,
            [field]: value
        }
        onConfigChange({ apiConfig: newApiConfig })
    }

    const handleImagePathChange = (value: string) => {
        onConfigChange({ imagePath: value })
    }

    const handleBarTenderChange = (field: keyof typeof barTenderConfig, value: any) => {
        const newConfig = { ...barTenderConfig, [field]: value }
        setBarTenderConfig(newConfig)
        onConfigChange({ barTenderConfig: newConfig })
    }

    const testApiConnection = async () => {
        setIsTesting(true)
        setTestResult(null)

        try {
            if (window.electronAPI) {
                // Lưu config hiện tại trước khi test
                await window.electronAPI.setConfig({
                    apiConfig: localConfig.apiConfig,
                    imagePath: localConfig.imagePath,
                    barTenderConfig: localConfig.barTenderConfig
                })

                const result = await window.electronAPI.testApiConnection()
                setTestResult({ success: result, message: result ? 'API connection successful!' : 'API connection failed' })
            } else {
                setTestResult({ success: false, message: 'electronAPI not available' })
            }
        } catch (error) {
            setTestResult({ success: false, message: `Test failed: ${error}` })
        } finally {
            setIsTesting(false)
        }
    }

    const selectImageFolder = async () => {
        try {
            if (window.electronAPI) {
                const selectedPath = await window.electronAPI.selectFolder()
                if (selectedPath) {
                    handleImagePathChange(selectedPath)
                }
            }
        } catch (error) {
            console.error('Failed to select folder:', error)
        }
    }

    const saveConfig = async () => {
        try {
            if (window.electronAPI) {
                await window.electronAPI.setConfig(config)
                setTestResult({ success: true, message: 'Configuration saved successfully!' })
            }
        } catch (error) {
            setTestResult({ success: false, message: `Failed to save config: ${error}` })
        }
    }

    return (
        <div className="settings-container">
            <h2>Settings</h2>

            {/* API Configuration */}
            <div className="settings-section">
                <h3>API Configuration</h3>

                <div className="form-group">
                    <label>Environment:</label>
                    <select
                        value={localConfig.apiConfig.environment || 'development'}
                        onChange={(e) => {
                            const env = e.target.value as 'development' | 'staging' | 'production' | 'custom'
                            const envUrls = localConfig.apiConfig.environmentUrls || {}
                            const nextBase = env === 'custom'
                                ? (envUrls.custom || '')
                                : (envUrls[env] || localConfig.apiConfig.baseURL)
                            setLocalConfig(prev => ({
                                ...prev,
                                apiConfig: {
                                    ...prev.apiConfig,
                                    environment: env,
                                    baseURL: nextBase
                                }
                            }))
                        }}
                        className="environment-select"
                    >
                        <option value="development">Development</option>
                        <option value="staging">Staging</option>
                        <option value="production">Production</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>

                {(localConfig.apiConfig.environment || 'development') !== 'custom' ? (
                    <div className="form-group">
                        <label>Base URL:</label>
                        <input
                            type="text"
                            value={localConfig.apiConfig.baseURL}
                            onChange={(e) => handleInputChange('apiConfig', 'baseURL', e.target.value)}
                            placeholder="Enter your API base URL (e.g., http://127.0.0.1:8000/api)"
                        />
                    </div>
                ) : (
                    <div className="form-group">
                        <label>Custom Base URL:</label>
                        <input
                            type="text"
                            value={(localConfig.apiConfig.environmentUrls?.custom) || ''}
                            onChange={(e) => setLocalConfig(prev => ({
                                ...prev,
                                apiConfig: {
                                    ...prev.apiConfig,
                                    environmentUrls: {
                                        ...(prev.apiConfig.environmentUrls || {}),
                                        custom: e.target.value
                                    },
                                    baseURL: e.target.value
                                }
                            }))}
                            placeholder="https://your-api-domain.com/api/v2"
                        />
                    </div>
                )}

                <div className="form-group">
                    <label>Timeout (ms):</label>
                    <input
                        type="number"
                        value={localConfig.apiConfig.timeout}
                        onChange={(e) => handleInputChange('apiConfig', 'timeout', parseInt(e.target.value))}
                        placeholder="10000"
                    />
                </div>

                <div className="form-group">
                    <label>Username (Optional):</label>
                    <input
                        type="text"
                        value={localConfig.apiConfig.username}
                        onChange={(e) => handleInputChange('apiConfig', 'username', e.target.value)}
                        placeholder="API username"
                    />
                </div>

                <div className="form-group">
                    <label>Password (Optional):</label>
                    <input
                        type="password"
                        value={localConfig.apiConfig.password}
                        onChange={(e) => handleInputChange('apiConfig', 'password', e.target.value)}
                        placeholder="API password"
                    />
                </div>

                <div className="form-group">
                    <label>API Key (Bearer Token):</label>
                    <input
                        type="password"
                        value={localConfig.apiConfig.apiKey}
                        onChange={(e) => handleInputChange('apiConfig', 'apiKey', e.target.value)}
                        placeholder="Enter your Bearer token (e.g., 2c3e90e252e71c8726661d7d3f61ea77...)"
                    />
                </div>

                <div className="database-actions">
                    <button
                        className="test-button"
                        onClick={testApiConnection}
                        disabled={isTesting}
                    >
                        {isTesting ? 'Testing...' : 'Test API Connection'}
                    </button>
                    <button className="save-button" onClick={saveConfig}>
                        Save Configuration
                    </button>
                </div>

                {testResult && (
                    <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                        {testResult.message}
                    </div>
                )}
            </div>

            {/* Image Path Configuration */}
            <div className="settings-section">
                <h3>Image Path Configuration</h3>

                <div className="form-group">
                    <label>Image Directory:</label>
                    <div className="path-input">
                        <input
                            type="text"
                            value={localConfig.imagePath}
                            onChange={(e) => handleImagePathChange(e.target.value)}
                            placeholder="/path/to/images"
                        />
                        <button className="select-button" onClick={selectImageFolder}>
                            Select Folder
                        </button>
                    </div>
                </div>
            </div>

            {/* BarTender Configuration */}
            <div className="settings-section">
                <h3>BarTender Configuration</h3>
                <div className="form-group">
                    <label><input type="checkbox" checked={localConfig.barTenderConfig.enabled} onChange={e => handleInputChange('barTenderConfig', 'enabled', e.target.checked ? 1 : 0)} /> Bật BarTender</label>
                </div>
                <div className="form-group">
                    <label>BarTender Path:</label>
                    <input type="text" value={localConfig.barTenderConfig.bartenderPath} onChange={e => handleInputChange('barTenderConfig', 'bartenderPath', e.target.value)} placeholder="C:\\Program Files (x86)\\Seagull\\BarTender Suite\\bartend.exe" />
                </div>
                <div className="form-group">
                    <label>Template Path (.btw):</label>
                    <input type="text" value={localConfig.barTenderConfig.templatePath} onChange={e => handleInputChange('barTenderConfig', 'templatePath', e.target.value)} placeholder="C:\\...\\Document1.btw" />
                </div>
                <div className="form-group">
                    <label>Export Excel Folder:</label>
                    <input type="text" value={localConfig.barTenderConfig.exportFolder} onChange={e => handleInputChange('barTenderConfig', 'exportFolder', e.target.value)} placeholder="C:\\...\\IN CODE" />
                </div>
                <div className="form-group">
                    <label><input type="checkbox" checked={localConfig.barTenderConfig.autoExport} onChange={e => handleInputChange('barTenderConfig', 'autoExport', e.target.checked ? 1 : 0)} /> Auto Export Excel after scan</label>
                </div>
                <div className="form-group">
                    <label><input type="checkbox" checked={localConfig.barTenderConfig.autoPrint} onChange={e => handleInputChange('barTenderConfig', 'autoPrint', e.target.checked ? 1 : 0)} /> Auto Print after export</label>
                </div>
                <div className="form-group">
                    <label>Print Script Path (PowerShell):</label>
                    <input type="text" value={localConfig.barTenderConfig.printScriptPath || ''} onChange={e => handleInputChange('barTenderConfig', 'printScriptPath', e.target.value)} placeholder="C:\\path\\to\\print-script.ps1" />
                </div>
                <div className="form-group">
                    <label>Print Method:</label>
                    <select
                        value={localConfig.barTenderConfig.printMethod || 'direct'}
                        onChange={e => handleInputChange('barTenderConfig', 'printMethod', e.target.value as 'direct' | 'script')}
                        className="print-method-select"
                    >
                        <option value="direct">Direct Print (Gọi BarTender trực tiếp)</option>
                        <option value="script">Print via Script (Gọi script PowerShell)</option>
                    </select>
                </div>
            </div>

            {/* Help Section */}
            <div className="settings-section">
                <h3>Help</h3>
                <div className="help-content">
                    <h4>API Setup:</h4>
                    <ul>
                        <li>Choose your environment from the dropdown</li>
                        <li><strong>Development:</strong> For local development (e.g., http://127.0.0.1:8000/api)</li>
                        <li><strong>Staging:</strong> For testing environment</li>
                        <li><strong>Production:</strong> For live environment (e.g., https://production.trackingis.info/api)</li>
                        <li><strong>Custom URL:</strong> For custom API endpoints</li>
                        <li>Set appropriate timeout (default: 10000ms)</li>
                        <li><strong>API Key (Bearer Token):</strong> Required for authentication</li>
                        <li>Username/Password: Alternative authentication method</li>
                    </ul>

                    <h4>Authentication:</h4>
                    <ul>
                        <li><strong>Bearer Token:</strong> Most common - enter your API key</li>
                        <li><strong>Basic Auth:</strong> Use username/password if required</li>
                        <li><strong>Priority:</strong> Bearer token takes precedence over basic auth</li>
                    </ul>

                    <h4>Environment URLs:</h4>
                    <ul>
                        <li><strong>Development:</strong> Enter your local API URL</li>
                        <li><strong>Staging:</strong> Enter your staging API URL</li>
                        <li><strong>Production:</strong> Enter your production API URL</li>
                        <li><strong>Custom:</strong> Enter your own API URL</li>
                    </ul>

                    <h4>Image Path:</h4>
                    <ul>
                        <li>Select the folder containing your product images</li>
                        <li>Supported formats: PNG, JPG, JPEG, GIF, BMP, WEBP, AI, PDF</li>
                        <li>Images should match task_code_front from API</li>
                    </ul>

                    <h4>BarTender Setup:</h4>
                    <ul>
                        <li>Ensure BarTender is installed and accessible</li>
                        <li>Use correct BarTender executable path</li>
                        <li>Template file (.btw) should exist and be accessible</li>
                        <li>Export folder should have write permissions</li>
                    </ul>
                </div>
            </div>

            <div className="form-group" style={{ marginTop: 24 }}>
                <button onClick={handleSave} className="save-config-btn">
                    Lưu cấu hình
                </button>
            </div>
        </div>
    )
}

export default Settings 