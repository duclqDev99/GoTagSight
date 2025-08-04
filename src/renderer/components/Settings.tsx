import React, { useState } from 'react'

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

interface SettingsProps {
    config: AppConfig
    onConfigChange: (newConfig: Partial<AppConfig>) => void
}

const Settings: React.FC<SettingsProps> = ({ config, onConfigChange }) => {
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
    const [isTesting, setIsTesting] = useState(false)

    const handleDatabaseChange = (field: keyof DatabaseConfig, value: string | number) => {
        const newDatabaseConfig = {
            ...config.databaseConfig,
            [field]: value
        }
        onConfigChange({ databaseConfig: newDatabaseConfig })
    }

    const handleImagePathChange = (value: string) => {
        onConfigChange({ imagePath: value })
    }

    const testDatabaseConnection = async () => {
        setIsTesting(true)
        setTestResult(null)

        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.testDatabaseConnection()
                setTestResult({ success: result, message: result ? 'Connection successful!' : 'Connection failed' })
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

            {/* Database Configuration */}
            <div className="settings-section">
                <h3>Database Configuration</h3>

                <div className="form-group">
                    <label>Host:</label>
                    <input
                        type="text"
                        value={config.databaseConfig.host}
                        onChange={(e) => handleDatabaseChange('host', e.target.value)}
                        placeholder="localhost"
                    />
                </div>

                <div className="form-group">
                    <label>Port:</label>
                    <input
                        type="number"
                        value={config.databaseConfig.port}
                        onChange={(e) => handleDatabaseChange('port', parseInt(e.target.value))}
                        placeholder="3306"
                    />
                </div>

                <div className="form-group">
                    <label>Username:</label>
                    <input
                        type="text"
                        value={config.databaseConfig.user}
                        onChange={(e) => handleDatabaseChange('user', e.target.value)}
                        placeholder="root"
                    />
                </div>

                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type="password"
                        value={config.databaseConfig.password}
                        onChange={(e) => handleDatabaseChange('password', e.target.value)}
                        placeholder="Enter password"
                    />
                </div>

                <div className="form-group">
                    <label>Database:</label>
                    <input
                        type="text"
                        value={config.databaseConfig.database}
                        onChange={(e) => handleDatabaseChange('database', e.target.value)}
                        placeholder="production"
                    />
                </div>

                <div className="form-group">
                    <label>Table Name:</label>
                    <input
                        type="text"
                        value={config.databaseConfig.tableName}
                        onChange={(e) => handleDatabaseChange('tableName', e.target.value)}
                        placeholder="order_details"
                    />
                </div>

                <div className="database-actions">
                    <button
                        className="test-button"
                        onClick={testDatabaseConnection}
                        disabled={isTesting}
                    >
                        {isTesting ? 'Testing...' : 'Test Connection'}
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
                            value={config.imagePath}
                            onChange={(e) => handleImagePathChange(e.target.value)}
                            placeholder="/path/to/images"
                        />
                        <button className="select-button" onClick={selectImageFolder}>
                            Select Folder
                        </button>
                    </div>
                </div>
            </div>

            {/* Help Section */}
            <div className="settings-section">
                <h3>Help</h3>
                <div className="help-content">
                    <h4>Database Setup:</h4>
                    <ul>
                        <li>Ensure MySQL server is running</li>
                        <li>Use correct host (usually localhost or 127.0.0.1)</li>
                        <li>Default port is 3306</li>
                        <li>Make sure the database and table exist</li>
                    </ul>

                    <h4>Image Path:</h4>
                    <ul>
                        <li>Select the folder containing your product images</li>
                        <li>Supported formats: PNG, JPG, JPEG, GIF, BMP, WEBP, AI, PDF</li>
                        <li>Images should match task_code_front from database</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default Settings 