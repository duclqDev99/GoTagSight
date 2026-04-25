import React, { useState } from 'react'
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
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <span className="logo-icon">🏷️</span>
                        <h1>iSuccess Scan Barcode</h1>
                    </div>
                    <p className="login-subtitle">Đăng nhập để tiếp tục</p>
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
            </div>
        </div>
    )
}

export default Login 