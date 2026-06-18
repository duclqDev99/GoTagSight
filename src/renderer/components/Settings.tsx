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

interface AppConfig {
    apiConfig: ApiConfig
    imagePath: string
    barTenderConfig: BarTenderConfig
    elasticsearchConfig?: ElasticsearchConfig
}

interface SettingsProps {
    config: AppConfig
    onConfigChange: (newConfig: Partial<AppConfig>) => void
}

const Settings: React.FC<SettingsProps> = ({ config, onConfigChange }) => {
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
    const [isTesting, setIsTesting] = useState(false)

    // Sửa khởi tạo localConfig để sử dụng ApiConfig
    const [localConfig, setLocalConfig] = useState<AppConfig>(() => {
        const safeConfig = config || {}
        return {
            apiConfig: {
                // Fallback defaults so the form is pre-filled on a fresh machine.
                baseURL: safeConfig.apiConfig?.baseURL || 'http://103.139.203.10:7700',
                timeout: safeConfig.apiConfig?.timeout || 10000,
                username: safeConfig.apiConfig?.username || '',
                password: safeConfig.apiConfig?.password || '',
                apiKey: safeConfig.apiConfig?.apiKey || 'cbf33c1c50e471743a3212352244936d4cd4841f781506d19cc9c1a66ccb691e',
                environment: safeConfig.apiConfig?.environment || 'custom',
                environmentUrls: safeConfig.apiConfig?.environmentUrls || {
                    development: 'http://127.0.0.1:8001/api/v2',
                    staging: '',
                    production: 'https://production.trackingis.info',
                    custom: 'http://103.139.203.10:7700'
                },
                updateApiBaseURL: safeConfig.apiConfig?.updateApiBaseURL || '',
                updateApiKey: safeConfig.apiConfig?.updateApiKey || ''
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
            },
            elasticsearchConfig: safeConfig.elasticsearchConfig
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
                    elasticsearchConfig: localConfig.elasticsearchConfig
                })
                onConfigChange({
                    apiConfig: localConfig.apiConfig
                })
                setTestResult({ success: true, message: 'Configuration saved successfully!' })
            }
        } catch (error) {
            setTestResult({ success: false, message: `Failed to save config: ${error}` })
        }
    }

    const testApiConnection = async () => {
        setIsTesting(true)
        setTestResult(null)

        try {
            if (window.electronAPI) {
                // Lưu config hiện tại trước khi test
                await window.electronAPI.setConfig({
                    apiConfig: localConfig.apiConfig,
                    imagePath: localConfig.imagePath
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

                <div className="form-group">
                    <label>Update API Base URL (Optional):</label>
                    <input
                        type="text"
                        value={localConfig.apiConfig.updateApiBaseURL || ''}
                        onChange={(e) => handleInputChange('apiConfig', 'updateApiBaseURL', e.target.value)}
                        placeholder="Enter update API base URL (e.g., http://127.0.0.1:8000/api)"
                    />
                    <small>Leave empty to use the same API for both search and update operations</small>
                </div>

                <div className="form-group">
                    <label>Update API Key (Optional):</label>
                    <input
                        type="password"
                        value={localConfig.apiConfig.updateApiKey || ''}
                        onChange={(e) => handleInputChange('apiConfig', 'updateApiKey', e.target.value)}
                        placeholder="Enter update API Bearer token"
                    />
                    <small>Leave empty to use the same API key for both search and update operations</small>
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

            <div className="form-group" style={{ marginTop: 24 }}>
                <button onClick={handleSave} className="save-config-btn">
                    Lưu cấu hình
                </button>
            </div>
        </div>
    )
}

export default Settings 