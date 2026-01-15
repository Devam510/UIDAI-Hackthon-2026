import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    type: 'success' | 'warning' | 'error' | 'info';
}

const NotificationDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            title: 'Forecast Model Trained',
            message: 'Forecast model successfully trained for Maharashtra',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            read: false,
            type: 'success'
        },
        {
            id: '2',
            title: 'High Anomaly Detected',
            message: 'Unusual patterns detected in Bihar - requires investigation',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            read: false,
            type: 'warning'
        },
        {
            id: '3',
            title: 'Biometric Risk Alert',
            message: 'Severe biometric risk detected in Lucknow district',
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            read: true,
            type: 'error'
        }
    ]);

    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const getTypeColor = (type: Notification['type']) => {
        switch (type) {
            case 'success': return 'text-green-400';
            case 'warning': return 'text-orange-400';
            case 'error': return 'text-red-400';
            case 'info': return 'text-blue-400';
        }
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-[9999]">
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    onClick={() => markAsRead(notification.id)}
                                    className={`p-4 border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors ${!notification.read ? 'bg-slate-700/30' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 ${getTypeColor(notification.type)}`}>
                                            <Bell size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="text-sm font-medium text-white truncate">
                                                    {notification.title}
                                                </h4>
                                                {!notification.read && (
                                                    <span className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-1"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {formatTimestamp(notification.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
