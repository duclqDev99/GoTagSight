import React, { useEffect, useState } from 'react'

interface ThumbServerConfig {
    enabled: boolean
    baseURL: string
    nasPrefix: string
    extension: string
}

interface ImageSettingsProps {
    onClose: () => void
    onSaved?: () => void
}

const DEFAULT_IMAGE_PATH = '/Volumes/Designer ZenE'

const DEFAULT_THUMB: ThumbServerConfig = {
    enabled: true,
    baseURL: 'http://172.26.207.206:8081/thumbs/',
    nasPrefix: '/Volumes/',
    extension: '.webp'
}

const ImageSettings: React.FC<ImageSettingsProps> = ({ onClose, onSaved }) => {
    const [imagePath, setImagePath] = useState<string>(DEFAULT_IMAGE_PATH)
    const [thumbCfg, setThumbCfg] = useState<ThumbServerConfig>(DEFAULT_THUMB)
    const [fullConfig, setFullConfig] = useState<any>(null)
    const [saving, setSaving] = useState(false)
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

    useEffect(() => {
        const load = async () => {
            if (!window.electronAPI) return
            try {
                const cfg: any = await window.electronAPI.getConfig()
                if (cfg) {
                    setFullConfig(cfg)
                    setImagePath(cfg.imagePath || DEFAULT_IMAGE_PATH)
                    const savedThumb = cfg.thumbServerConfig || {}
                    setThumbCfg({
                        enabled: savedThumb.enabled ?? DEFAULT_THUMB.enabled,
                        baseURL: savedThumb.baseURL || DEFAULT_THUMB.baseURL,
                        nasPrefix: savedThumb.nasPrefix || DEFAULT_THUMB.nasPrefix,
                        extension: savedThumb.extension || DEFAULT_THUMB.extension
                    })
                }
            } catch (err) {
                console.error('Failed to load image settings:', err)
            }
        }
        load()
    }, [])

    const updateThumb = (field: keyof ThumbServerConfig, value: any) => {
        setThumbCfg(prev => ({ ...prev, [field]: value }))
    }

    const handleSelectFolder = async () => {
        try {
            if (window.electronAPI) {
                const selected = await window.electronAPI.selectFolder()
                if (selected) setImagePath(selected)
            }
        } catch (err) {
            console.error('Select folder failed:', err)
        }
    }

    const handleSave = async () => {
        if (!window.electronAPI) return
        setSaving(true)
        setTestResult(null)
        try {
            const nextConfig = {
                ...(fullConfig || {}),
                imagePath,
                thumbServerConfig: thumbCfg,
                // Elasticsearch is intentionally kept disabled — images load from the
                // thumbnail server / local folder only.
                elasticsearchConfig: { ...(fullConfig?.elasticsearchConfig || {}), enabled: false }
            }
            await window.electronAPI.setConfig(nextConfig)
            setFullConfig(nextConfig)
            setTestResult({ success: true, message: 'Đã lưu cấu hình hình ảnh.' })
            if (onSaved) onSaved()
        } catch (err: any) {
            setTestResult({ success: false, message: `Lưu thất bại: ${err?.message || err}` })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>Setting Hình Ảnh</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="settings-container">
                    {/* Local folder */}
                    <div className="settings-section">
                        <h3>Thư mục local</h3>
                        <div className="form-group">
                            <label>Đường dẫn thư mục chứa ảnh:</label>
                            <div className="path-input">
                                <input
                                    type="text"
                                    value={imagePath}
                                    onChange={(e) => setImagePath(e.target.value)}
                                    placeholder="/Volumes/Designer hoặc /path/to/images"
                                />
                                <button className="select-button" onClick={handleSelectFolder}>
                                    Chọn
                                </button>
                            </div>
                            <small style={{ color: 'var(--muted-2)', fontSize: 11.5 }}>
                                Dùng khi không lấy được ảnh từ Thumbnail Server.
                            </small>
                        </div>
                    </div>

                    {/* Thumbnail server (HTTP) — pre-rendered WebP from nginx */}
                    <div className="settings-section">
                        <h3>Thumbnail Server (WebP)</h3>
                        <small style={{ color: 'var(--muted-2)', fontSize: 11.5, display: 'block', marginBottom: 12 }}>
                            Khi bật, app lấy WebP đã render sẵn từ HTTP server thay vì đọc file gốc trên NAS.
                            Nhanh hơn nhiều, không tốn IPC, không cần ImageMagick.
                        </small>

                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={thumbCfg.enabled}
                                    onChange={(e) => updateThumb('enabled', e.target.checked)}
                                />
                                Bật Thumbnail Server
                            </label>
                        </div>

                        <div className="form-group">
                            <label>Base URL:</label>
                            <input
                                type="text"
                                value={thumbCfg.baseURL}
                                onChange={(e) => updateThumb('baseURL', e.target.value)}
                                placeholder="http://172.26.207.206:8081/thumbs/"
                            />
                        </div>

                        <div className="form-group">
                            <label>NAS prefix (sẽ bị strip khỏi path):</label>
                            <input
                                type="text"
                                value={thumbCfg.nasPrefix}
                                onChange={(e) => updateThumb('nasPrefix', e.target.value)}
                                placeholder="/Volumes/Designer ZenE/"
                            />
                            <small style={{ color: 'var(--muted-2)', fontSize: 11, display: 'block', marginTop: 4 }}>
                                Path bắt đầu bằng prefix này sẽ được map sang URL thumb.
                            </small>
                        </div>

                        <div className="form-group">
                            <label>Đuôi file thumb:</label>
                            <input
                                type="text"
                                value={thumbCfg.extension}
                                onChange={(e) => updateThumb('extension', e.target.value)}
                                placeholder=".webp"
                            />
                        </div>

                        <div className="form-group">
                            <small style={{ color: 'var(--muted-2)', fontSize: 11.5 }}>
                                Ví dụ map: <br />
                                <code style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{thumbCfg.nasPrefix}foo/bar.psd</code>
                                {' → '}
                                <code style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>
                                    {thumbCfg.baseURL.replace(/\/$/, '')}/foo/bar.psd{thumbCfg.extension}
                                </code>
                            </small>
                        </div>
                    </div>

                    {testResult && (
                        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                            {testResult.message}
                        </div>
                    )}

                    <div className="settings-actions">
                        <button className="cancel-btn" onClick={onClose}>Đóng</button>
                        <button className="save-btn" onClick={handleSave} disabled={saving}>
                            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ImageSettings
