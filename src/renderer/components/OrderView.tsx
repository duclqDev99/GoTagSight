import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// Extensions the browser can render natively via safe-image:// protocol
const DIRECT_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'])
// Extensions that need conversion to PNG first
const CONVERT_EXTS = new Set(['ai', 'pdf'])

const toSafeImageUrl = (absPath: string) => {
    const trimmed = absPath.replace(/^\/+/, '')
    const encoded = encodeURIComponent(trimmed).replace(/%2F/g, '/')
    return `safe-image:///${encoded}`
}

// Build HTTP URL pointing to pre-generated WebP thumbnail on nginx server.
// Returns null if thumb server is off or path doesn't sit under configured nasPrefix.
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
    product_type: string
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

interface OrderViewProps {
    config: AppConfig
    order?: OrderDetail
    showImageOnly?: boolean
    // How many items of this same order have been scanned, and how many the order
    // contains in total — used to show "scanned / total" progress in the image panel.
    scannedInOrder?: number
    totalInOrder?: number
}

interface GalleryItem {
    id: string
    name: string
    path: string
    ext: string
    size?: number
    source: 'elasticsearch' | 'filesystem'
}

const OrderView: React.FC<OrderViewProps> = ({ config, order: propOrder, showImageOnly = false, scannedInOrder, totalInOrder }) => {
    const [order, setOrder] = useState<OrderDetail | null>(propOrder || null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [qcStatus, setQcStatus] = useState('')
    const [qcNotes, setQcNotes] = useState('')
    const [imagePath, setImagePath] = useState<string>('')
    const [imageError, setImageError] = useState<string>('')
    const [fileType, setFileType] = useState<string>('')
    const [gallery, setGallery] = useState<GalleryItem[]>([])
    const [activeIndex, setActiveIndex] = useState<number>(0)
    const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false)

    // In-memory cache of converted files: path → data URL (base64 from convertFileToImage)
    const convertCacheRef = useRef<Map<string, string>>(new Map())
    // Raster thumbnail cache: original path → local cached thumb path
    const thumbCacheRef = useRef<Map<string, string>>(new Map())
    // Track which items have been preload-requested so we don't fire twice
    const preloadStartedRef = useRef<Set<string>>(new Set())
    // Generation counter to cancel in-flight preloads when switching orders
    const loadGenRef = useRef<number>(0)
    // Background preload progress
    const [preloadProgress, setPreloadProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 })

    useEffect(() => {
        if (propOrder) {
            setOrder(propOrder)
        }
    }, [propOrder])

    // Extract the prefix portion (before the first dash) — designer files are named
    // by prefix only, so searching by full task code (e.g. "GQV3ZF-30.48x45.72") would
    // bring back files whose names contain the dimensions ("30", "48", "45", "72").
    const extractPrefix = (taskCode: string): string => {
        if (!taskCode) return taskCode
        const dashIdx = taskCode.indexOf('-')
        return dashIdx > 0 ? taskCode.slice(0, dashIdx) : taskCode
    }

    // Load gallery when order changes
    useEffect(() => {
        if (order && order.task_code_front) {
            // Clear caches & cancel in-flight preloads when switching orders
            loadGenRef.current += 1
            convertCacheRef.current.clear()
            thumbCacheRef.current.clear()
            preloadStartedRef.current.clear()
            setPreloadProgress({ done: 0, total: 0 })
            loadGallery(extractPrefix(order.task_code_front))
        }
    }, [order, config.imagePath, config.elasticsearchConfig?.enabled, config.elasticsearchConfig?.baseURL, config.elasticsearchConfig?.index])

    // Load the currently active gallery item's image data
    useEffect(() => {
        const item = gallery[activeIndex]
        if (!item) return
        renderItem(item)
        // Preload neighbors in background so swapping thumbs is instant
        preloadNearby(activeIndex)
    }, [activeIndex, gallery])

    const renderItem = async (item: GalleryItem) => {
        if (!window.electronAPI) return
        setImageError('')
        setIsLoadingImage(true)

        // Fastest path: pre-built WebP from thumb server (nginx). 1 HTTP fetch, no IPC.
        const httpThumb = toThumbUrl(item.path, config.thumbServerConfig)
        if (httpThumb) {
            setImagePath(httpThumb)
            setFileType(item.ext)
            return
        }

        // Fast path: raster file → thumbnail via nativeImage, cached locally, then safe-image
        if (DIRECT_EXTS.has(item.ext)) {
            const cached = thumbCacheRef.current.get(item.path)
            if (cached) {
                setImagePath(toSafeImageUrl(cached))
                setFileType(item.ext)
                return
            }
            try {
                const thumbPath = await window.electronAPI.getImageThumbnail(item.path, 1400)
                if (thumbPath) {
                    thumbCacheRef.current.set(item.path, thumbPath)
                    setImagePath(toSafeImageUrl(thumbPath))
                    setFileType(item.ext)
                } else {
                    // Fallback to original full-res via protocol
                    setImagePath(toSafeImageUrl(item.path))
                    setFileType(item.ext)
                }
            } catch (err: any) {
                setImagePath(toSafeImageUrl(item.path))
                setFileType(item.ext)
            }
            return
        }

        // Slow path: AI / PDF (convert via ImageMagick) — use cache
        if (CONVERT_EXTS.has(item.ext)) {
            const cached = convertCacheRef.current.get(item.path)
            if (cached) {
                setImagePath(cached)
                setFileType(item.ext)
                setIsLoadingImage(false)
                return
            }
            try {
                const data = await window.electronAPI.convertFileToImage(item.path)
                if (data) {
                    convertCacheRef.current.set(item.path, data)
                    setImagePath(data)
                    setFileType(item.ext)
                    setImageError('')
                } else {
                    setImagePath('')
                    setImageError(`Failed to load: ${item.name}`)
                    setIsLoadingImage(false)
                }
            } catch (err: any) {
                setImagePath('')
                setImageError('Failed to load image: ' + (err?.message || err))
                setIsLoadingImage(false)
            }
            return
        }

        // Unknown extension — try safe-image as last resort
        setImagePath(toSafeImageUrl(item.path))
        setFileType(item.ext)
    }

    // Fire-and-forget: preload the next item (and previous) so click = instant.
    const preloadNearby = (fromIndex: number) => {
        const neighbors = [fromIndex + 1, fromIndex - 1].filter(
            (i) => i >= 0 && i < gallery.length
        )
        for (const i of neighbors) {
            const item = gallery[i]
            if (!item) continue
            if (preloadStartedRef.current.has(item.path)) continue
            preloadStartedRef.current.add(item.path)

            if (DIRECT_EXTS.has(item.ext)) {
                // Generate thumbnail on main process in background + prime browser cache
                if (!thumbCacheRef.current.has(item.path) && window.electronAPI) {
                    window.electronAPI
                        .getImageThumbnail(item.path, 1400)
                        .then((thumbPath) => {
                            if (thumbPath) {
                                thumbCacheRef.current.set(item.path, thumbPath)
                                const img = new Image()
                                img.src = toSafeImageUrl(thumbPath)
                            }
                        })
                        .catch(() => {
                            preloadStartedRef.current.delete(item.path)
                        })
                }
            } else if (CONVERT_EXTS.has(item.ext)) {
                if (convertCacheRef.current.has(item.path)) continue
                if (!window.electronAPI) continue
                window.electronAPI
                    .convertFileToImage(item.path)
                    .then((data) => {
                        if (data) convertCacheRef.current.set(item.path, data)
                    })
                    .catch(() => {
                        // Fire-and-forget — ignore errors, user will see real error on click
                        preloadStartedRef.current.delete(item.path)
                    })
            }
        }
    }

    // Background-preload ALL gallery items.
    //
    // Fast lane: thumb server enabled → just create <Image> with HTTP URL,
    //   browser caches automatically. No IPC, no main-process work.
    //
    // Slow lane: thumb server off → fall back to local IPC thumbnail (serial).
    const preloadAll = async (items: GalleryItem[]) => {
        if (items.length === 0) return

        const myGen = loadGenRef.current
        const thumbCfg = config.thumbServerConfig
        const useHttp = !!thumbCfg?.enabled && !!thumbCfg.baseURL && !!thumbCfg.nasPrefix

        // Defer slightly so the active item's request goes through first
        await new Promise((r) => setTimeout(r, 100))
        if (loadGenRef.current !== myGen) return

        const total = items.length
        let done = 1 // active item is rendering
        setPreloadProgress({ done, total })

        if (useHttp) {
            // Fire all images at once — browser handles HTTP cache & connection pooling
            for (const item of items) {
                if (loadGenRef.current !== myGen) return
                if (preloadStartedRef.current.has(item.path)) {
                    if (item !== items[0]) done++
                    continue
                }
                preloadStartedRef.current.add(item.path)
                if (item === items[0]) continue // already rendering
                const url = toThumbUrl(item.path, thumbCfg)
                if (url) {
                    const img = new Image()
                    img.onload = () => {
                        if (loadGenRef.current !== myGen) return
                        done++
                        setPreloadProgress({ done, total })
                    }
                    img.onerror = () => {
                        if (loadGenRef.current !== myGen) return
                        done++
                        setPreloadProgress({ done, total })
                    }
                    img.src = url
                } else {
                    done++
                    setPreloadProgress({ done, total })
                }
            }
            return
        }

        // Fallback: local IPC thumbnail (serial, slow)
        if (!window.electronAPI) return
        const activePath = items[0]?.path
        const fast = items.filter((i) => DIRECT_EXTS.has(i.ext) && i.path !== activePath)
        const slow = items.filter((i) => CONVERT_EXTS.has(i.ext) && i.path !== activePath)
        const queue = [...fast, ...slow]

        const worker = async () => {
            while (queue.length > 0) {
                if (loadGenRef.current !== myGen) return
                const item = queue.shift()
                if (!item) return
                if (preloadStartedRef.current.has(item.path)) {
                    done++
                    setPreloadProgress({ done, total })
                    continue
                }
                preloadStartedRef.current.add(item.path)

                try {
                    if (DIRECT_EXTS.has(item.ext)) {
                        if (!thumbCacheRef.current.has(item.path)) {
                            const thumb = await window.electronAPI!.getImageThumbnail(item.path, 1400)
                            if (loadGenRef.current !== myGen) return
                            if (thumb) {
                                thumbCacheRef.current.set(item.path, thumb)
                                const img = new Image()
                                img.src = toSafeImageUrl(thumb)
                            }
                        }
                    } else if (CONVERT_EXTS.has(item.ext)) {
                        if (!convertCacheRef.current.has(item.path)) {
                            const data = await window.electronAPI!.convertFileToImage(item.path)
                            if (loadGenRef.current !== myGen) return
                            if (data) convertCacheRef.current.set(item.path, data)
                        }
                    }
                } catch (err) {
                    preloadStartedRef.current.delete(item.path)
                }

                done++
                if (loadGenRef.current === myGen) {
                    setPreloadProgress({ done, total })
                }
                await new Promise((r) => setTimeout(r, 0))
            }
        }
        await worker()
    }

    const loadGallery = async (taskCode: string) => {
        if (!window.electronAPI) return

        setGallery([])
        setActiveIndex(0)
        setImagePath('')
        setImageError('')

        const esEnabled = !!config.elasticsearchConfig?.enabled
        const fallbackToFs = config.elasticsearchConfig?.fallbackToFilesystem !== false

        // 1) Try Elasticsearch first
        if (esEnabled) {
            try {
                const res = await window.electronAPI.searchImagesByCode(taskCode)
                if (res?.enabled && res.hits && res.hits.length > 0) {
                    const items: GalleryItem[] = res.hits.map((h) => ({
                        id: h.id,
                        name: h.name,
                        path: h.path,
                        ext: h.ext,
                        size: h.size,
                        source: 'elasticsearch'
                    }))
                    setGallery(items)
                    setActiveIndex(0)
                    preloadAll(items)
                    return
                }
                if (!fallbackToFs) {
                    setImageError(`No results in Elasticsearch for: ${taskCode}`)
                    return
                }
            } catch (err: any) {
                console.error('ES search error:', err)
                if (!fallbackToFs) {
                    setImageError(`ES error: ${err?.message || err}`)
                    return
                }
            }
        }

        // 2) Fallback to local folder scan (existing behavior)
        if (!config.imagePath) {
            setImageError('Image path not configured')
            return
        }

        const fsItems: GalleryItem[] = []
        try {
            const extensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ai', 'pdf']
            for (const ext of extensions) {
                const imageFile = `${config.imagePath}/${taskCode}.${ext}`
                const exists = await window.electronAPI.checkFileExists(imageFile)
                if (exists) {
                    fsItems.push({
                        id: imageFile,
                        name: `${taskCode}.${ext}`,
                        path: imageFile,
                        ext,
                        source: 'filesystem'
                    })
                }
            }

            if (fsItems.length === 0) {
                const files = await window.electronAPI.listFiles(config.imagePath)
                if (files && files.length > 0) {
                    files
                        .filter((file) =>
                            file.toLowerCase().startsWith(taskCode.toLowerCase()) &&
                            /\.(png|jpg|jpeg|gif|bmp|webp|ai|pdf)$/i.test(file)
                        )
                        .forEach((file) => {
                            const ext = (file.split('.').pop() || '').toLowerCase()
                            fsItems.push({
                                id: `${config.imagePath}/${file}`,
                                name: file,
                                path: `${config.imagePath}/${file}`,
                                ext,
                                source: 'filesystem'
                            })
                        })
                }
            }

            if (fsItems.length > 0) {
                setGallery(fsItems)
                setActiveIndex(0)
                preloadAll(fsItems)
            } else {
                setImageError(`No image found for task code: ${taskCode}`)
            }
        } catch (err: any) {
            setImageError('Failed to load image: ' + (err?.message || err))
        }
    }

    const handleQC = async (status: 'pass' | 'fail') => {
        if (!order) return

        setLoading(true)
        try {
            if (window.electronAPI) {
                await window.electronAPI.updateOrderStatus(order.id, status, qcNotes)
                setQcStatus(status)
                setError('')
            } else {
                setError('electronAPI not available - cannot update status')
            }
        } catch (err) {
            setError('Failed to update status: ' + (err as Error).message)
        } finally {
            setLoading(false)
        }
    }





    if (!order) {
        return (
            <div className="order-view">
                <h2>Order Details</h2>
                <p>No order selected. Please scan a barcode first.</p>
            </div>
        )
    }

    // If showImageOnly is true, only show the image + gallery strip
    if (showImageOnly) {
        const activeItem = gallery[activeIndex]
        return (
            <div className="image-only-view">
                {/* Order context — which order this item belongs to + scan progress */}
                <div className="order-context">
                    <div className="order-context-main">
                        <span className="oc-customer" title={order.customer_name || ''}>
                            {order.customer_name || 'Unknown Customer'}
                        </span>
                        {!!order.origin_id && (
                            <span className="oc-origin" title="Order ID">#{order.origin_id}</span>
                        )}
                    </div>
                    <div className="order-context-meta">
                        {order.product_type && (
                            <span className="oc-type" title="Product type">{order.product_type}</span>
                        )}
                        {order.platform && (
                            <span className="oc-platform" title="Platform">{order.platform}</span>
                        )}
                        {!!totalInOrder && totalInOrder > 0 && (
                            <span
                                className={`oc-progress ${(scannedInOrder || 0) >= totalInOrder ? 'complete' : ''}`}
                                title="Items scanned in this order / total items in the order"
                            >
                                {scannedInOrder || 0}/{totalInOrder}
                            </span>
                        )}
                    </div>
                </div>

                {/* Product specifics — only fields that actually carry a value are shown */}
                <div className="order-summary">
                    <span className="summary-chip" title="Quantity">
                        <span className="summary-chip-label">Qty</span>{order.quantity || 0}
                    </span>
                    {order.size_style && (
                        <span className="summary-chip" title="Size Style">
                            <span className="summary-chip-label">Size Style</span>{order.size_style}
                        </span>
                    )}
                    {order.layout_style && (
                        <span className="summary-chip" title="Layout Style">
                            <span className="summary-chip-label">Layout</span>{order.layout_style}
                        </span>
                    )}
                    {order.color && (
                        <span className="summary-chip" title="Color">
                            <span className="summary-chip-label">Color</span>{order.color}
                        </span>
                    )}
                    {order.material && (
                        <span className="summary-chip" title="Material">
                            <span className="summary-chip-label">Material</span>{order.material}
                        </span>
                    )}
                    {order.pack && (
                        <span className="summary-chip" title="Pack">
                            <span className="summary-chip-label">Pack</span>{order.pack}
                        </span>
                    )}
                    {order.condition && (
                        <span className="summary-chip" title="Condition">
                            <span className="summary-chip-label">Condition</span>{order.condition}
                        </span>
                    )}
                </div>

                {!!order.personalization && (
                    <div className="order-personalization" title="Personalization">
                        <span className="op-label">Personalization</span>
                        <span className="op-value">{order.personalization}</span>
                    </div>
                )}

                <div className="gallery-main">
                    {imagePath ? (
                        <div className="image-container">
                            {isLoadingImage && (
                                <div className="image-loading-overlay">
                                    <div className="spinner"></div>
                                    <span>Đang tải ảnh...</span>
                                </div>
                            )}

                            {fileType === 'pdf' ? (
                                <div className="pdf-viewer">
                                    <div className="pdf-preview">
                                        <img
                                            src={imagePath}
                                            alt={`PDF Preview: ${order.product_name_new}`}
                                            className="pdf-preview-image"
                                            onLoad={() => setIsLoadingImage(false)}
                                            onError={() => { setImageError('Failed to convert PDF file'); setIsLoadingImage(false) }}
                                        />
                                    </div>
                                </div>
                            ) : fileType === 'ai' ? (
                                <div className="ai-viewer">
                                    <div className="ai-preview">
                                        <img
                                            src={imagePath}
                                            alt={`AI Preview: ${order.product_name_new}`}
                                            className="ai-preview-image"
                                            onLoad={() => setIsLoadingImage(false)}
                                            onError={() => { setImageError('Failed to convert AI file'); setIsLoadingImage(false) }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={imagePath}
                                    alt={`Product: ${order.product_name_new}`}
                                    className="product-image"
                                    onLoad={() => setIsLoadingImage(false)}
                                    onError={() => { setImageError('Failed to load image'); setIsLoadingImage(false) }}
                                />
                            )}
                        </div>
                    ) : imageError ? (
                        <div className="image-error">
                            <p>{imageError}</p>
                        </div>
                    ) : (
                        <div className="image-loading">
                            <div className="spinner"></div>
                            <p>{isLoadingImage ? 'Đang tải ảnh...' : 'Đang đợi ảnh...'}</p>
                        </div>
                    )}

                    {activeItem && (
                        <div className="gallery-caption" title={activeItem.path}>
                            <span className="gallery-caption-name">{activeItem.name}</span>
                            <span className={`gallery-caption-source ${activeItem.source}`}>
                                {activeItem.source === 'elasticsearch' ? 'ES' : 'LOCAL'}
                            </span>
                        </div>
                    )}
                </div>

                {gallery.length > 1 && (
                    <div className="gallery-strip">
                        <div className="gallery-strip-header">
                            <span>{gallery.length} files found</span>
                            <div className="gallery-strip-meta">
                                {preloadProgress.total > 0 && preloadProgress.done < preloadProgress.total && (
                                    <span className="gallery-preload-badge" title="Đang cache ngầm các ảnh khác">
                                        <span className="spinner"></span>
                                        Cache {preloadProgress.done}/{preloadProgress.total}
                                    </span>
                                )}
                                {preloadProgress.total > 0 && preloadProgress.done === preloadProgress.total && (
                                    <span className="gallery-preload-badge done" title="Tất cả ảnh đã cache">
                                        ✓ Cached
                                    </span>
                                )}
                                <span className="gallery-strip-counter">
                                    {activeIndex + 1} / {gallery.length}
                                </span>
                            </div>
                        </div>
                        <div className="gallery-thumbs">
                            {gallery.map((item, idx) => (
                                <button
                                    key={item.id}
                                    className={`gallery-thumb ${idx === activeIndex ? 'active' : ''}`}
                                    onClick={() => setActiveIndex(idx)}
                                    title={item.path}
                                >
                                    <span className={`gallery-thumb-ext ext-${item.ext}`}>{item.ext}</span>
                                    <span className="gallery-thumb-name">{item.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="order-view">
            <h2>Order Details</h2>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError('')}>✕</button>
                </div>
            )}

            <div className="order-info">
                {/* Image Display */}
                <div className="image-section">
                    <h3>Product Image</h3>
                    {imagePath ? (
                        <div className="image-container">
                            {fileType === 'pdf' ? (
                                <div className="pdf-viewer">
                                    <div className="pdf-preview">
                                        <img
                                            src={imagePath}
                                            alt={`PDF Preview: ${order.product_name_new}`}
                                            className="pdf-preview-image"
                                            onError={() => setImageError('Failed to convert PDF file')}
                                        />
                                        <p className="file-info">PDF File Preview</p>
                                        <button
                                            className="download-btn"
                                            onClick={() => window.open(imagePath, '_blank')}
                                        >
                                            Download Original PDF File
                                        </button>
                                    </div>
                                </div>
                            ) : fileType === 'ai' ? (
                                <div className="ai-viewer">
                                    <div className="ai-preview">
                                        <img
                                            src={imagePath}
                                            alt={`AI Preview: ${order.product_name_new}`}
                                            className="ai-preview-image"
                                            onError={() => setImageError('Failed to convert AI file')}
                                        />
                                        <p className="file-info">AI File Preview</p>
                                        {/* <button
                                            className="download-btn"
                                            onClick={() => window.open(imagePath, '_blank')}
                                        >
                                            Download Original AI File
                                        </button> */}
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={imagePath}
                                    alt={`Product: ${order.product_name_new}`}
                                    className="product-image"
                                    onError={() => setImageError('Failed to load image')}
                                />
                            )}
                        </div>
                    ) : imageError ? (
                        <div className="image-error">
                            <p>{imageError}</p>
                        </div>
                    ) : (
                        <div className="image-loading">
                            <p>Loading image...</p>
                        </div>
                    )}
                </div>

                <div className="info-row">
                    <label>Task Code Front:</label>
                    <span>{order.task_code_front}</span>
                </div>
                <div className="info-row">
                    <label>Task Code Back:</label>
                    <span>{order.task_code_back}</span>
                </div>
                <div className="info-row">
                    <label>Product Name:</label>
                    <span>{order.product_name_new}</span>
                </div>
                <div className="info-row">
                    <label>Layout Style:</label>
                    <span>{order.layout_style}</span>
                </div>
                <div className="info-row">
                    <label>Note:</label>
                    <span>{order.description_task || 'No notes'}</span>
                </div>
            </div>

            <div className="description-section">
                <h3>Task Description</h3>
                <div className="description-content">
                    <div className="description-item">
                        <h4>General Description:</h4>
                        <p>{order.description_task || 'No description available'}</p>
                    </div>
                    <div className="description-item">
                        <h4>Front Description:</h4>
                        <p>{order.description_task_front || 'No front description available'}</p>
                    </div>
                    <div className="description-item">
                        <h4>Back Description:</h4>
                        <p>{order.description_task_back || 'No back description available'}</p>
                    </div>
                    <div className="description-item">
                        <h4>Personalization:</h4>
                        <p>{order.personalization || 'No personalization details'}</p>
                    </div>
                </div>
            </div>

            <div className="link-section">
                <h3>Product Link</h3>
                <a href={order.link} target="_blank" rel="noopener noreferrer" className="product-link">
                    {order.link}
                </a>
            </div>

            <div className="qc-section">
                <h3>Quality Control</h3>
                <div className="qc-controls">
                    <div className="qc-input">
                        <label>Notes:</label>
                        <textarea
                            value={qcNotes}
                            onChange={(e) => setQcNotes(e.target.value)}
                            placeholder="Enter QC notes..."
                            rows={3}
                        />
                    </div>
                    <div className="qc-buttons">
                        <button
                            onClick={() => handleQC('pass')}
                            disabled={loading}
                            className="qc-pass"
                        >
                            Pass
                        </button>
                        <button
                            onClick={() => handleQC('fail')}
                            disabled={loading}
                            className="qc-fail"
                        >
                            Fail
                        </button>
                    </div>
                </div>
                {qcStatus && (
                    <div className={`qc-result ${qcStatus}`}>
                        QC Status: {qcStatus.toUpperCase()}
                    </div>
                )}
            </div>


        </div>
    )
}

export default OrderView 