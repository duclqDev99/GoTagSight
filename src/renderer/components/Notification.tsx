import React, { useEffect } from 'react'

interface NotificationProps {
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    onClose: () => void
    duration?: number
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, duration)

        return () => clearTimeout(timer)
    }, [duration, onClose])

    const getIcon = () => {
        switch (type) {
            case 'success': return '✅'
            case 'error': return '❌'
            case 'warning': return '⚠️'
            case 'info': return 'ℹ️'
            default: return 'ℹ️'
        }
    }

    const getClassName = () => {
        return `notification notification-${type}`
    }

    return (
        <div className={getClassName()}>
            <span className="notification-icon">{getIcon()}</span>
            <span className="notification-message">{message}</span>
        </div>
    )
}

export default Notification 