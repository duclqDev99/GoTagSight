import React, { useEffect, useState } from 'react'

const DIRECT_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'])
const CONVERT_EXTS = new Set(['ai', 'pdf'])

const toSafeImageUrl = (absPath: string) => {
    const trimmed = absPath.replace(/^\/+/, '')
    const encoded = encodeURIComponent(trimmed).replace(/%2F/g, '/')
    return `safe-image:///${encoded}`
}

const toThumbUrl = (
    absPath: string,
    cfg?: { enabled: boolean; baseURL: string; nasPrefix: string; extension: string }
): string | null => {
    if (!cfg?.enabled || !cfg.baseURL || !cfg.nasPrefix) return null
    if (!absPath.startsWith(cfg.nasPrefix)) return null
    const rel = absPath.slice(cfg.nasPrefix.length)
    const ext = cfg.extension || '.webp'
    const encoded = encodeURIComponent(rel + ext).replace(/%2F/g, '/')
    return cfg.baseURL.replace(/\/$/, '') + '/' + encoded
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

interface ImageSettingsProps {
    onClose: () => void
    onSaved?: () => void
}

const DEFAULT_IMAGE_PATH = '/Volumes/Designer ZenE'

const DEFAULT_ES: ElasticsearchConfig = {
    enabled: true,
    baseURL: 'http://172.26.207.206:9200',
    index: 'nas_files',
    username: '',
    password: '',
    searchFields: ['name^3', 'attachment.content', 'path'],
    size: 20,
    timeout: 8000,
    fallbackToFilesystem: true
}

const DEFAULT_THUMB: ThumbServerConfig = {
    enabled: true,
    baseURL: 'http://172.26.207.206:8081/thumbs/',
    nasPrefix: '/Volumes/Designer ZenE/',
    extension: '.webp'
}

const ImageSettings: React.FC<ImageSettingsProps> = ({ onClose, onSaved }) => {
    const [imagePath, setImagePath] = useState<string>(DEFAULT_IMAGE_PATH)
    const [es, setEs] = useState<ElasticsearchConfig>(DEFAULT_ES)
    const [thumbCfg, setThumbCfg] = useState<ThumbServerConfig>(DEFAULT_THUMB)
    const [fullConfig, setFullConfig] = useState<any>(null)
    const [saving, setSaving] = useState(false)
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
    const [isTestingEs, setIsTestingEs] = useState(false)

    useEffect(() => {
        const load = async () => {
            if (!window.electronAPI) return
            try {
                const cfg: any = await window.electronAPI.getConfig()
                if (cfg) {
                    setFullConfig(cfg)
                    setImagePath(cfg.imagePath || DEFAULT_IMAGE_PATH)
                    const savedEs = cfg.elasticsearchConfig || {}
                    setEs({
                        enabled: savedEs.enabled ?? DEFAULT_ES.enabled,
                        baseURL: savedEs.baseURL || DEFAULT_ES.baseURL,
                        index: savedEs.index || DEFAULT_ES.index,
                        username: savedEs.username ?? DEFAULT_ES.username,
                        password: savedEs.password ?? DEFAULT_ES.password,
                        searchFields: (savedEs.searchFields && savedEs.searchFields.length > 0)
                            ? savedEs.searchFields
                            : DEFAULT_ES.searchFields,
                        size: savedEs.size ?? DEFAULT_ES.size,
                        timeout: savedEs.timeout ?? DEFAULT_ES.timeout,
                        fallbackToFilesystem: savedEs.fallbackToFilesystem ?? DEFAULT_ES.fallbackToFilesystem
                    })
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

    const updateEs = (field: keyof ElasticsearchConfig, value: any) => {
        setEs(prev => ({ ...prev, [field]: value }))
    }

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
                elasticsearchConfig: es,
                thumbServerConfig: thumbCfg
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

    const handleTestEs = async () => {
        setIsTestingEs(true)
        setTestResult(null)
        try {
            if (!window.electronAPI) {
                setTestResult({ success: false, message: 'electronAPI không khả dụng.' })
                return
            }
            if (!es.baseURL) {
                setTestResult({ success: false, message: 'Chưa nhập Base URL.' })
                return
            }
            const result = await window.electronAPI.testEsConnection(es)
            setTestResult({
                success: result.success,
                message: result.success
                    ? `Kết nối thành công. Index "${es.index}" có ${result.total ?? 0} documents.`
                    : `${result.message}${result.detail ? ` — ${result.detail}` : ''}`
            })
        } catch (err: any) {
            setTestResult({ success: false, message: `Lỗi: ${err?.message || err}` })
        } finally {
            setIsTestingEs(false)
        }
    }

    // ---- Test image search (bypasses order flow) ---------------------------
    const [probeCode, setProbeCode] = useState<string>('UMAF09')
    const [probeLoading, setProbeLoading] = useState(false)
    const [probeError, setProbeError] = useState<string>('')
    const [probeHits, setProbeHits] = useState<Array<{
        id: string; name: string; path: string; ext: string; score: number; size: number
    }>>([])
    const [probePreview, setProbePreview] = useState<string>('')
    const [probePreviewName, setProbePreviewName] = useState<string>('')
    const [probePreviewLoading, setProbePreviewLoading] = useState(false)
    const [probePreloadProgress, setProbePreloadProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 })
    const probePreloadGenRef = React.useRef<number>(0)
    const probeStartedRef = React.useRef<Set<string>>(new Set())


    const handleProbeSearch = async () => {
        if (!window.electronAPI) return
        if (!probeCode.trim()) {
            setProbeError('Nhập task code để thử.')
            return
        }
        setProbeLoading(true)
        setProbeError('')
        setProbeHits([])
        setProbePreview('')
        setProbePreviewName('')
        // Cancel any in-flight preload from previous search
        probePreloadGenRef.current += 1
        probeStartedRef.current.clear()
        setProbePreloadProgress({ done: 0, total: 0 })

        try {
            const res = await window.electronAPI.searchImagesByCode(probeCode.trim())
            if (!res?.enabled) {
                setProbeError('ES đang tắt. Bật checkbox phía trên rồi Lưu cấu hình trước khi thử.')
                return
            }
            if (res.error) {
                setProbeError(`Lỗi: ${res.error}`)
                return
            }
            if (!res.hits || res.hits.length === 0) {
                setProbeError(`Không có kết quả cho "${probeCode}".`)
                return
            }
            setProbeHits(res.hits)
            handleProbePreview(res.hits[0])
            preloadAllProbeHits(res.hits)
        } catch (err: any) {
            setProbeError(`Lỗi gọi API: ${err?.message || err}`)
        } finally {
            setProbeLoading(false)
        }
    }

    // Background-preload all probe hits.
    // If thumb server is configured: lightweight — just create <Image> per HTTP URL,
    // browser handles cache & connection pooling. No IPC, no main-process work.
    // Otherwise: fall back to local IPC thumbnail (serial).
    const preloadAllProbeHits = async (hits: Array<{ path: string; ext: string }>) => {
        if (hits.length === 0) return

        const myGen = probePreloadGenRef.current
        const useHttp = !!thumbCfg.enabled && !!thumbCfg.baseURL && !!thumbCfg.nasPrefix

        await new Promise((r) => setTimeout(r, 100))
        if (probePreloadGenRef.current !== myGen) return

        const total = hits.length
        let done = 1
        setProbePreloadProgress({ done, total })

        if (useHttp) {
            for (const item of hits) {
                if (probePreloadGenRef.current !== myGen) return
                if (probeStartedRef.current.has(item.path)) continue
                probeStartedRef.current.add(item.path)
                if (item === hits[0]) continue
                const url = toThumbUrl(item.path, thumbCfg)
                if (url) {
                    const img = new Image()
                    img.onload = () => {
                        if (probePreloadGenRef.current !== myGen) return
                        done++
                        setProbePreloadProgress({ done, total })
                    }
                    img.onerror = () => {
                        if (probePreloadGenRef.current !== myGen) return
                        done++
                        setProbePreloadProgress({ done, total })
                    }
                    img.src = url
                } else {
                    done++
                    setProbePreloadProgress({ done, total })
                }
            }
            return
        }

        // Fallback: local IPC
        if (!window.electronAPI) return
        const activePath = hits[0]?.path
        const fast = hits.filter((h) => DIRECT_EXTS.has(h.ext) && h.path !== activePath)
        const slow = hits.filter((h) => CONVERT_EXTS.has(h.ext) && h.path !== activePath)
        const queue = [...fast, ...slow]

        const worker = async () => {
            while (queue.length > 0) {
                if (probePreloadGenRef.current !== myGen) return
                const item = queue.shift()
                if (!item) return
                if (probeStartedRef.current.has(item.path)) {
                    done++
                    setProbePreloadProgress({ done, total })
                    continue
                }
                probeStartedRef.current.add(item.path)

                try {
                    if (DIRECT_EXTS.has(item.ext)) {
                        const thumb = await window.electronAPI!.getImageThumbnail(item.path, 1400)
                        if (probePreloadGenRef.current !== myGen) return
                        if (thumb) {
                            const img = new Image()
                            img.src = toSafeImageUrl(thumb)
                        }
                    } else if (CONVERT_EXTS.has(item.ext)) {
                        await window.electronAPI!.convertFileToImage(item.path)
                        if (probePreloadGenRef.current !== myGen) return
                    }
                } catch {
                    probeStartedRef.current.delete(item.path)
                }

                done++
                if (probePreloadGenRef.current === myGen) {
                    setProbePreloadProgress({ done, total })
                }
                await new Promise((r) => setTimeout(r, 0))
            }
        }
        await worker()
    }

    const handleProbePreview = async (hit: { path: string; ext: string; name: string }) => {
        if (!window.electronAPI) return
        setProbePreview('')
        setProbePreviewName(hit.name)
        setProbePreviewLoading(true)

        // Fastest path: HTTP thumb server (pre-built WebP from nginx)
        const httpThumb = toThumbUrl(hit.path, thumbCfg)
        if (httpThumb) {
            setProbePreview(httpThumb)
            return
        }

        // Fast path: raster → thumbnail (resized via nativeImage, cached on disk), then safe-image
        if (DIRECT_EXTS.has(hit.ext)) {
            try {
                const thumbPath = await window.electronAPI.getImageThumbnail(hit.path, 1400)
                if (thumbPath) {
                    setProbePreview(toSafeImageUrl(thumbPath))
                } else {
                    setProbePreview(toSafeImageUrl(hit.path))
                }
            } catch {
                setProbePreview(toSafeImageUrl(hit.path))
            }
            // Keep loading state true — <img onLoad> will clear it
            return
        }

        // Slow path: AI/PDF — convert then render
        if (CONVERT_EXTS.has(hit.ext)) {
            try {
                const data = await window.electronAPI.convertFileToImage(hit.path)
                if (data) {
                    setProbePreview(data)
                } else {
                    setProbeError(`Không đọc được file: ${hit.path}. Kiểm tra NAS đã mount chưa.`)
                    setProbePreviewLoading(false)
                }
            } catch (err: any) {
                setProbeError(`Lỗi load ảnh: ${err?.message || err}`)
                setProbePreviewLoading(false)
            }
            return
        }

        // Unknown ext — try protocol URL anyway
        setProbePreview(toSafeImageUrl(hit.path))
    }

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>Setting Hình Ảnh</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="settings-container">
                    {/* Local folder fallback */}
                    <div className="settings-section">
                        <h3>Thư mục local (fallback)</h3>
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
                                Dùng khi Elasticsearch tắt hoặc không tìm thấy ảnh.
                            </small>
                        </div>
                    </div>

                    {/* Elasticsearch */}
                    <div className="settings-section">
                        <h3>Elasticsearch (tìm ảnh từ NAS)</h3>

                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={es.enabled}
                                    onChange={(e) => updateEs('enabled', e.target.checked)}
                                />
                                Bật Elasticsearch để tra cứu ảnh
                            </label>
                        </div>

                        <div className="form-group">
                            <label>Base URL:</label>
                            <input
                                type="text"
                                value={es.baseURL}
                                onChange={(e) => updateEs('baseURL', e.target.value)}
                                placeholder="http://172.26.207.206:9200"
                            />
                        </div>

                        <div className="form-group">
                            <label>Tên index:</label>
                            <input
                                type="text"
                                value={es.index}
                                onChange={(e) => updateEs('index', e.target.value)}
                                placeholder="nas_files"
                            />
                        </div>

                        <div className="form-group">
                            <label>Search fields (phân tách bằng dấu phẩy, dùng ^N để boost):</label>
                            <input
                                type="text"
                                value={(es.searchFields || []).join(', ')}
                                onChange={(e) =>
                                    updateEs(
                                        'searchFields',
                                        e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                    )
                                }
                                placeholder="name^3, attachment.content, path"
                            />
                        </div>

                        <div className="form-group">
                            <label>Số kết quả tối đa mỗi lần scan:</label>
                            <input
                                type="number"
                                value={es.size ?? 20}
                                onChange={(e) => updateEs('size', parseInt(e.target.value) || 20)}
                                placeholder="20"
                            />
                        </div>

                        <div className="form-group">
                            <label>Username (tùy chọn):</label>
                            <input
                                type="text"
                                value={es.username || ''}
                                onChange={(e) => updateEs('username', e.target.value)}
                                placeholder="elastic"
                            />
                        </div>

                        <div className="form-group">
                            <label>Password (tùy chọn):</label>
                            <input
                                type="password"
                                value={es.password || ''}
                                onChange={(e) => updateEs('password', e.target.value)}
                                placeholder="để trống nếu cluster mở trong LAN"
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={es.fallbackToFilesystem}
                                    onChange={(e) => updateEs('fallbackToFilesystem', e.target.checked)}
                                />
                                Fallback về thư mục local khi ES không có kết quả
                            </label>
                        </div>

                        <div className="database-actions">
                            <button
                                className="test-button"
                                onClick={handleTestEs}
                                disabled={isTestingEs}
                            >
                                {isTestingEs ? 'Đang test...' : 'Test kết nối ES'}
                            </button>
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
                                Path từ ES bắt đầu bằng prefix này sẽ được map sang URL thumb.
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

                    {/* Probe: thử tìm ảnh với task code bất kỳ, không cần order */}
                    <div className="settings-section">
                        <h3>Thử tìm ảnh (không cần order)</h3>
                        <small style={{ color: 'var(--muted-2)', fontSize: 11.5, display: 'block', marginBottom: 12 }}>
                            Nhập 1 task code đã có trong index ES (ví dụ <code style={{ fontFamily: 'var(--font-mono)' }}>UMAF09</code>) để xác nhận luồng tìm + load ảnh hoạt động.
                            Phải <strong>Lưu cấu hình</strong> trước khi thử.
                        </small>

                        <div className="form-group">
                            <label>Task code:</label>
                            <div className="path-input">
                                <input
                                    type="text"
                                    value={probeCode}
                                    onChange={(e) => setProbeCode(e.target.value.toUpperCase())}
                                    placeholder="UMAF09"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleProbeSearch()
                                    }}
                                />
                                <button
                                    className="select-button"
                                    onClick={handleProbeSearch}
                                    disabled={probeLoading}
                                >
                                    {probeLoading ? 'Đang tìm...' : 'Tìm'}
                                </button>
                            </div>
                        </div>

                        {probeError && (
                            <div className="test-result error" style={{ margin: '8px 0' }}>
                                {probeError}
                            </div>
                        )}

                        {probeHits.length > 0 && (
                            <div className="probe-results">
                                <div className="probe-results-header">
                                    <span>{probeHits.length} file tìm thấy</span>
                                    {probePreloadProgress.total > 0 && probePreloadProgress.done < probePreloadProgress.total && (
                                        <span className="gallery-preload-badge" title="Đang cache ngầm tất cả file">
                                            <span className="spinner"></span>
                                            Cache {probePreloadProgress.done}/{probePreloadProgress.total}
                                        </span>
                                    )}
                                    {probePreloadProgress.total > 0 && probePreloadProgress.done === probePreloadProgress.total && (
                                        <span className="gallery-preload-badge done">✓ Cached</span>
                                    )}
                                </div>
                                <ul className="probe-hits">
                                    {probeHits.map((h) => (
                                        <li
                                            key={h.id}
                                            className={`probe-hit ${probePreviewName === h.name ? 'active' : ''}`}
                                            onClick={() => handleProbePreview(h)}
                                            title={h.path}
                                        >
                                            <span className={`gallery-thumb-ext ext-${h.ext}`}>{h.ext}</span>
                                            <div className="probe-hit-meta">
                                                <div className="probe-hit-name">{h.name}</div>
                                                <div className="probe-hit-path">{h.path}</div>
                                            </div>
                                            <span className="probe-hit-score">
                                                {typeof h.score === 'number' ? h.score.toFixed(1) : '-'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="probe-preview">
                                    {probePreview ? (
                                        <>
                                            {probePreviewLoading && (
                                                <div className="probe-preview-overlay">
                                                    <div className="spinner"></div>
                                                    <span>Đang tải ảnh...</span>
                                                </div>
                                            )}
                                            <img
                                                key={probePreview}
                                                src={probePreview}
                                                alt={probePreviewName}
                                                className="probe-preview-image"
                                                onLoad={() => setProbePreviewLoading(false)}
                                                onError={() => {
                                                    setProbePreviewLoading(false)
                                                    setProbeError(`Không load được ảnh: ${probePreviewName}`)
                                                }}
                                            />
                                        </>
                                    ) : probePreviewLoading ? (
                                        <div className="probe-preview-status">
                                            <div className="spinner"></div>
                                            <span>Đang tìm ảnh...</span>
                                        </div>
                                    ) : (
                                        <div className="probe-preview-status">Click 1 file phía trên để xem preview.</div>
                                    )}
                                </div>
                            </div>
                        )}
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
