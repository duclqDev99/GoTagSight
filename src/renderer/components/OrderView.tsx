import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

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

interface AppConfig {
    apiConfig: ApiConfig
    imagePath: string
    elasticsearchConfig?: ElasticsearchConfig
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
}

interface GalleryItem {
    id: string
    name: string
    path: string
    ext: string
    size?: number
    source: 'elasticsearch' | 'filesystem'
}

const OrderView: React.FC<OrderViewProps> = ({ config, order: propOrder, showImageOnly = false }) => {
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

    useEffect(() => {
        if (propOrder) {
            setOrder(propOrder)
        }
    }, [propOrder])

    // Load gallery when order changes
    useEffect(() => {
        if (order && order.task_code_front) {
            loadGallery(order.task_code_front)
        }
    }, [order, config.imagePath, config.elasticsearchConfig?.enabled, config.elasticsearchConfig?.baseURL, config.elasticsearchConfig?.index])

    // Load the currently active gallery item's image data
    useEffect(() => {
        const item = gallery[activeIndex]
        if (!item) return
        renderItem(item)
    }, [activeIndex, gallery])

    const renderItem = async (item: GalleryItem) => {
        if (!window.electronAPI) return
        setIsLoadingImage(true)
        setImageError('')
        try {
            const needsConvert = item.ext === 'ai' || item.ext === 'pdf'
            const data = needsConvert
                ? await window.electronAPI.convertFileToImage(item.path)
                : await window.electronAPI.getImageData(item.path)
            if (data) {
                setImagePath(data)
                setFileType(item.ext)
                setImageError('')
            } else {
                setImagePath('')
                setImageError(`Failed to load: ${item.name}`)
            }
        } catch (err: any) {
            setImagePath('')
            setImageError('Failed to load image: ' + (err?.message || err))
        } finally {
            setIsLoadingImage(false)
        }
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
                <div className="gallery-main">
                    {imagePath ? (
                        <div className="image-container">
                            <div className="qty-badge">Qty: {order.quantity || 0}</div>
                            <div className="size-badge">Size: {order.size_style || ''}</div>

                            {fileType === 'pdf' ? (
                                <div className="pdf-viewer">
                                    <div className="pdf-preview">
                                        <img
                                            src={imagePath}
                                            alt={`PDF Preview: ${order.product_name_new}`}
                                            className="pdf-preview-image"
                                            onError={() => setImageError('Failed to convert PDF file')}
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
                                            onError={() => setImageError('Failed to convert AI file')}
                                        />
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
                            <p>{isLoadingImage ? 'Loading image...' : 'Waiting for image...'}</p>
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
                            <span className="gallery-strip-counter">
                                {activeIndex + 1} / {gallery.length}
                            </span>
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