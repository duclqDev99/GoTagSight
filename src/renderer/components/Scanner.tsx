import React, { useState, useRef, useEffect } from 'react'

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

interface OrderDetail {
    id: number
    task_code: string
    task_code_front: string
    task_code_back: string
    product_name_new: string
    description_task: string
    description_task_front: string
    description_task_back: string
    quantity: number
    status: string
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
}

interface ScannerProps {
    config: AppConfig
    onOrderScanned?: (code: string) => void
    isScanning?: boolean
}

const Scanner: React.FC<ScannerProps> = ({ config, onOrderScanned, isScanning = false }) => {
    const [isCameraScanning, setIsCameraScanning] = useState(false)
    const [manualCode, setManualCode] = useState('')
    const [error, setError] = useState('')
    const videoRef = useRef<HTMLVideoElement>(null)

    const startScanning = () => {
        setIsCameraScanning(true)
        setError('')

        // Initialize Quagga
        if (window.Quagga) {
            window.Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: videoRef.current,
                    constraints: {
                        width: 640,
                        height: 480,
                        facingMode: "environment"
                    },
                },
                decoder: {
                    readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader", "upc_reader", "upc_e_reader", "i2of5_reader"]
                }
            }, (err: any) => {
                if (err) {
                    setError('Failed to start camera: ' + err.message)
                    setIsCameraScanning(false)
                    return
                }

                window.Quagga.start()
            })

            window.Quagga.onDetected((result: any) => {
                const code = result.codeResult.code
                if (code && code.length >= 6) {
                    handleCodeDetected(code)
                }
            })
        } else {
            setError('Quagga library not loaded')
            setIsCameraScanning(false)
        }
    }

    const stopScanning = () => {
        if (window.Quagga) {
            window.Quagga.stop()
        }
        setIsCameraScanning(false)
    }

    const handleCodeDetected = async (code: string) => {
        stopScanning()

        try {
            if (window.electronAPI) {
                // Call callback with the code - let App.tsx handle the search and notifications
                if (onOrderScanned) {
                    onOrderScanned(code)
                }
                // Clear input and focus for next scan
                setManualCode('')
                setError('')
                // Focus back to input after a short delay
                setTimeout(() => {
                    const inputElement = document.querySelector('.code-input') as HTMLInputElement
                    if (inputElement) {
                        inputElement.focus()
                    }
                }, 100)
            } else {
                setError('electronAPI not available - cannot search orders')
            }
        } catch (err) {
            setError('Failed to search orders: ' + (err as Error).message)
            // Clear input and focus for retry
            setManualCode('')
            setTimeout(() => {
                const inputElement = document.querySelector('.code-input') as HTMLInputElement
                if (inputElement) {
                    inputElement.focus()
                }
            }, 100)
        }
    }

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (manualCode.length >= 6) {
            await handleCodeDetected(manualCode)
        } else {
            setError('Code must be at least 6 characters')
            // Focus back to input for retry
            setTimeout(() => {
                const inputElement = document.querySelector('.code-input') as HTMLInputElement
                if (inputElement) {
                    inputElement.focus()
                }
            }, 100)
        }
    }

    useEffect(() => {
        return () => {
            if (window.Quagga) {
                window.Quagga.stop()
            }
        }
    }, [])

    return (
        <div className="scanner-container">
            {/* <h2>Barcode Scanner</h2>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError('')}>✕</button>
                </div>
            )}

            <div className="scanner-controls">
                {!isScanning ? (
                    <button onClick={startScanning} className="scan-button">
                        Start Scanning
                    </button>
                ) : (
                    <button onClick={stopScanning} className="stop-button">
                        Stop Scanning
                    </button>
                )}
            </div>

            <div className="video-container">
                <video ref={videoRef} style={{ display: isScanning ? 'block' : 'none' }} />
                {!isScanning && (
                    <div className="placeholder">
                        Camera will appear here when scanning starts
                    </div>
                )}
            </div> */}

            <div className="manual-input">
                <h3>Or enter code manually:</h3>
                <form onSubmit={handleManualSubmit}>
                    <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        placeholder="Enter code (min 6 characters)"
                        maxLength={20}
                        className="code-input"
                        disabled={isScanning}
                    />
                    <button
                        type="submit"
                        className="submit-button"
                        disabled={isScanning}
                    >
                        {isScanning ? 'Searching...' : 'Search'}
                    </button>
                </form>
                {isScanning && (
                    <div className="loading-indicator">
                        <div className="spinner"></div>
                        <span>Searching for order...</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Scanner 