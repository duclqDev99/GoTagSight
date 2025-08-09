import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface ApiConfig {
    baseURL: string
    timeout?: number
    username?: string
    password?: string
    apiKey?: string
}

interface AppConfig {
    apiConfig: ApiConfig
    imagePath: string
}

interface OrderDetail {
    id: number
    order_id: number
    origin_id: number
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

const OrderView: React.FC<OrderViewProps> = ({ config, order: propOrder, showImageOnly = false }) => {
    const [order, setOrder] = useState<OrderDetail | null>(propOrder || null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [qcStatus, setQcStatus] = useState('')
    const [qcNotes, setQcNotes] = useState('')
    const [imagePath, setImagePath] = useState<string>('')
    const [imageError, setImageError] = useState<string>('')
    const [fileType, setFileType] = useState<string>('')

    useEffect(() => {
        if (propOrder) {
            setOrder(propOrder)
        }
    }, [propOrder])

    // Load image when order changes
    useEffect(() => {
        if (order && order.task_code_front && config.imagePath) {
            loadImage(order.task_code_front)
        }
    }, [order, config.imagePath])

    const loadImage = async (taskCode: string) => {
        if (!config.imagePath) {
            setImageError('Image path not configured')
            return
        }

        try {
            if (window.electronAPI) {
                // First try exact match
                const extensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ai', 'pdf']
                let foundImage = false

                for (const ext of extensions) {
                    const imageFile = `${config.imagePath}/${taskCode}.${ext}`
                    try {
                        const exists = await window.electronAPI.checkFileExists(imageFile)
                        if (exists) {
                            let imageData
                            if (ext === 'ai' || ext === 'pdf') {
                                // Convert AI/PDF to image
                                imageData = await window.electronAPI.convertFileToImage(imageFile)
                            } else {
                                // Use original file for images
                                imageData = await window.electronAPI.getImageData(imageFile)
                            }

                            if (imageData) {
                                setImagePath(imageData)
                                setFileType(ext)
                                setImageError('')
                                foundImage = true
                                break
                            }
                        }
                    } catch (err) {
                        // Continue to next extension
                    }
                }

                // If exact match not found, try pattern matching
                if (!foundImage) {
                    const files = await window.electronAPI.listFiles(config.imagePath)
                    if (files && files.length > 0) {
                        // Look for files that start with taskCode
                        const matchingFile = files.find(file =>
                            file.toLowerCase().startsWith(taskCode.toLowerCase()) &&
                            /\.(png|jpg|jpeg|gif|bmp|webp|ai|pdf)$/i.test(file)
                        )

                        if (matchingFile) {
                            const imageFile = `${config.imagePath}/${matchingFile}`
                            const fileExt = matchingFile.split('.').pop()?.toLowerCase() || ''

                            let imageData
                            if (fileExt === 'ai' || fileExt === 'pdf') {
                                // Convert AI/PDF to image
                                imageData = await window.electronAPI.convertFileToImage(imageFile)
                            } else {
                                // Use original file for images
                                imageData = await window.electronAPI.getImageData(imageFile)
                            }

                            if (imageData) {
                                setImagePath(imageData)
                                setFileType(fileExt)
                                setImageError('')
                                foundImage = true
                            }
                        }
                    }
                }

                if (!foundImage) {
                    setImageError(`No image found for task code: ${taskCode}`)
                    setImagePath('')
                }
            }
        } catch (err) {
            setImageError('Failed to load image: ' + (err as Error).message)
            setImagePath('')
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

    // If showImageOnly is true, only show the image
    if (showImageOnly) {
        return (
            <div className="image-only-view">
                {imagePath ? (
                    <div className="image-container">
                        {/* Qty badge overlay */}
                        <div className="qty-badge">Qty: {order.quantity || 0}</div>

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
                        <p>Loading image...</p>
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