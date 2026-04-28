import React, { useState } from 'react'
import logoUrl from '../../../images/logo/logo-warehouse.png'
import './Login.css'

interface LoginProps {
    onLoginSuccess: (token: string, user: any) => void
    onLoginError: (error: string) => void
}

interface LoginForm {
    email: string
    password: string
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onLoginError }) => {
    const [formData, setFormData] = useState<LoginForm>({
        email: '',
        password: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [debugInfo, setDebugInfo] = useState('')

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // Clear error when user starts typing
        if (error) setError('')
        if (debugInfo) setDebugInfo('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.email || !formData.password) {
            setError('Vui lòng nhập đầy đủ email và mật khẩu')
            return
        }

        setIsLoading(true)
        setError('')
        setDebugInfo('')

        try {
            // Sử dụng VITE_AUTH_ENDPOINT nếu có, nếu không thì tạo từ VITE_API_BASE_URL
            const fullUrl = import.meta.env.VITE_AUTH_ENDPOINT ||
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v2/auth/login`

            console.log('Đang đăng nhập với:', {
                url: fullUrl,
                email: formData.email,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })

            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                    // Removed X-CSRF-TOKEN header as it might not be needed
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            })

            console.log('Response status:', response.status)
            console.log('Response headers:', Object.fromEntries(response.headers.entries()))

            const data = await response.json()
            console.log('Response data:', data)

            if (response.ok) {
                // Login successful
                const token = data.token || data.access_token || data.accessToken || data.data?.token
                const user = data.user || data.data?.user || data.data || {}

                console.log('Extracted token:', token)
                console.log('Extracted user:', user)

                if (token) {
                    // Save token to localStorage
                    localStorage.setItem('authToken', token)
                    localStorage.setItem('user', JSON.stringify(user))

                    onLoginSuccess(token, user)
                } else {
                    const debugMsg = `Server response không chứa token. Response keys: ${Object.keys(data).join(', ')}`
                    console.error(debugMsg)
                    setDebugInfo(debugMsg)
                    throw new Error('Token không hợp lệ từ server')
                }
            } else {
                // Login failed
                const errorMessage = data.message || data.error || data.errors?.email?.[0] || data.errors?.password?.[0] || 'Đăng nhập thất bại'
                console.error('Login failed:', data)
                throw new Error(errorMessage)
            }
        } catch (err: any) {
            console.error('Login error:', err)
            let errorMessage = 'Lỗi kết nối server'

            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra URL và kết nối mạng.'
            } else if (err.message) {
                errorMessage = err.message
            }

            setError(errorMessage)
            onLoginError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="login-container">
            {/* Left pane: branding + warehouse-themed decoration */}
            <aside className="login-hero">
                <div className="login-hero-bg" aria-hidden="true">
                    <svg className="login-hero-pattern" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="800" height="800" fill="url(#grid)" />
                        {/* Stacked boxes silhouette */}
                        <g fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5">
                            <rect x="80" y="500" width="140" height="110" />
                            <rect x="80" y="390" width="140" height="110" />
                            <rect x="220" y="500" width="140" height="110" />
                            <rect x="150" y="280" width="140" height="110" />
                        </g>
                        {/* Right side stack */}
                        <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5">
                            <rect x="560" y="540" width="120" height="90" />
                            <rect x="560" y="450" width="120" height="90" />
                            <rect x="680" y="540" width="120" height="90" />
                        </g>
                        {/* Barcode lines */}
                        <g fill="rgba(255,255,255,0.06)">
                            <rect x="540" y="120" width="3" height="60" />
                            <rect x="546" y="120" width="6" height="60" />
                            <rect x="556" y="120" width="2" height="60" />
                            <rect x="562" y="120" width="4" height="60" />
                            <rect x="570" y="120" width="3" height="60" />
                            <rect x="577" y="120" width="7" height="60" />
                            <rect x="588" y="120" width="2" height="60" />
                            <rect x="594" y="120" width="5" height="60" />
                            <rect x="603" y="120" width="3" height="60" />
                            <rect x="610" y="120" width="2" height="60" />
                            <rect x="616" y="120" width="6" height="60" />
                            <rect x="626" y="120" width="3" height="60" />
                        </g>
                    </svg>
                </div>

                <div className="login-hero-content">
                    <div className="login-hero-brand">
                        <img src={logoUrl} alt="" className="login-hero-logo" />
                        <div className="login-hero-text">
                            <h1>iSuccess</h1>
                            <span>Scan Barcode</span>
                        </div>
                    </div>

                    <p className="login-hero-tagline">
                        Quét, quản lý đơn hàng và kiểm kho — tối ưu cho đội vận hành.
                    </p>

                    <ul className="login-hero-bullets">
                        <li>Tích hợp Elasticsearch tra cứu ảnh từ NAS</li>
                        <li>In barcode trực tiếp qua BarTender</li>
                        <li>Quản lý trạng thái đơn theo thời gian thực</li>
                    </ul>

                    <div className="login-hero-meta">
                        <span>v1.0.0</span>
                        <span className="login-hero-meta-dot">·</span>
                        <span>© 2024 iSuccess Company</span>
                    </div>
                </div>
            </aside>

            {/* Right pane: login form */}
            <main className="login-card">
                <div className="login-header">
                    <h2 className="login-title">Đăng nhập</h2>
                    <p className="login-subtitle">Nhập thông tin để tiếp tục.</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Nhập email của bạn"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mật khẩu</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Nhập mật khẩu"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            <span className="error-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    {debugInfo && (
                        <div className="debug-info">
                            <span className="debug-icon">🔍</span>
                            {debugInfo}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner"></span>
                                Đang đăng nhập...
                            </>
                        ) : (
                            'Đăng nhập'
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Phiên bản 1.0.0</p>
                    <p>© 2024 iSuccess Company</p>
                </div>
            </main>
        </div>
    )
}

export default Login 