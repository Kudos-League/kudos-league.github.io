import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import PropTypes from 'prop-types';

// Notification Context
const NotificationContext = createContext(null);

// Custom hook to use notifications
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

// Notification types
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// SSE connection states
export const SSE_STATES = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error'
};

const Notification = ({ notification, onRemove }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-yellow-50 border-yellow-200',
        info: 'bg-blue-50 border-blue-200'
    };

    return (
        <div className={`flex items-start gap-3 p-4 border rounded-lg shadow-sm transition-all duration-300 ${bgColors[notification.type]}`}>
            {icons[notification.type]}
            <div className="flex-1">
                {notification.title && (
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                )}
                <p className="text-gray-700">{notification.message}</p>
            </div>
            <button
                onClick={() => onRemove(notification.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

Notification.propTypes = {
    notification: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        type: PropTypes.oneOf(['success', 'error', 'warning', 'info']).isRequired,
        title: PropTypes.string,
        message: PropTypes.string.isRequired
    }).isRequired,
    onRemove: PropTypes.func.isRequired
};

// SSE status indicator
const SSEStatus = ({ status, onReconnect }) => {
    const statusConfig = {
        [SSE_STATES.CONNECTING]: { icon: Wifi, color: 'text-yellow-500', text: 'Connecting...' },
        [SSE_STATES.CONNECTED]: { icon: Wifi, color: 'text-green-500', text: 'Connected' },
        [SSE_STATES.DISCONNECTED]: { icon: WifiOff, color: 'text-gray-500', text: 'Disconnected' },
        [SSE_STATES.ERROR]: { icon: WifiOff, color: 'text-red-500', text: 'Connection Error' }
    };

    const config = statusConfig[status];
    const IconComponent = config.icon;

    if (status === SSE_STATES.CONNECTED) return null; // Hide when connected

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center gap-2">
            <IconComponent className={`w-4 h-4 ${config.color}`} />
            <span className="text-sm text-gray-700">{config.text}</span>
            {status === SSE_STATES.DISCONNECTED && (
                <button
                    onClick={onReconnect}
                    className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Reconnect
                </button>
            )}
        </div>
    );
};

SSEStatus.propTypes = {
    status: PropTypes.oneOf(Object.values(SSE_STATES)).isRequired,
    onReconnect: PropTypes.func.isRequired
};

// Notification container
const NotificationContainer = ({ notifications, onRemove }) => {
    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
            {notifications.map((notification) => (
                <Notification
                    key={notification.id}
                    notification={notification}
                    onRemove={onRemove}
                />
            ))}
        </div>
    );
};

NotificationContainer.propTypes = {
    notifications: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            type: PropTypes.oneOf(['success', 'error', 'warning', 'info']).isRequired,
            title: PropTypes.string,
            message: PropTypes.string.isRequired
        })
    ).isRequired,
    onRemove: PropTypes.func.isRequired
};

export const NotificationProvider = ({ children, sseUrl, sseOptions }) => {
    const [notifications, setNotifications] = useState([]);
    const [sseStatus, setSseStatus] = useState(SSE_STATES.DISCONNECTED);
    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const lastEventIdRef = useRef(null);

    const maxReconnectAttempts = sseOptions.maxReconnectAttempts || 5;
    const reconnectInterval = sseOptions.reconnectInterval || 3000;
    const reconnectAttemptsRef = useRef(0);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const addNotification = useCallback((notification) => {
        const id = Date.now() + Math.random();
        const newNotification = {
            id,
            type: NOTIFICATION_TYPES.INFO,
            duration: 5000,
            ...notification
        };

        setNotifications(prev => [...prev, newNotification]);

        // Auto remove after duration
        if (newNotification.duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, newNotification.duration);
        }

        return id;
    }, [removeNotification]);

    const removeAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // SSE message handlers
    const handleSSEMessage = useCallback((event) => {
        try {
            const data = JSON.parse(event.data);
            
            // Store last event ID for reconnection
            if (event.lastEventId) {
                lastEventIdRef.current = event.lastEventId;
            }
            
            // Handle different message types
            switch (data.type || event.type) {
            case 'notification':
                addNotification({
                    type: data.notificationType || NOTIFICATION_TYPES.INFO,
                    title: data.title,
                    message: data.message,
                    duration: data.duration
                });
                break;
                    
            case 'update':
                // Handle data updates
                if (sseOptions.onUpdate) {
                    sseOptions.onUpdate(data.payload || data);
                }
                break;
                    
            case 'heartbeat':
                // Server heartbeat - just update connection status
                setSseStatus(SSE_STATES.CONNECTED);
                break;
                    
            default:
                // Handle custom event types
                if (sseOptions.onMessage) {
                    sseOptions.onMessage(event, data);
                }
            }
        }
        catch (error) {
            console.error('Failed to parse SSE message:', error);
            // Still try to handle as plain text
            if (sseOptions.onMessage) {
                sseOptions.onMessage(event, event.data);
            }
        }
    }, [addNotification, sseOptions]);

    // Connect to SSE
    const connectSSE = useCallback(() => {
        if (!sseUrl) return;

        if (eventSourceRef.current?.readyState === EventSource.OPEN) {
            return; // Already connected
        }

        setSseStatus(SSE_STATES.CONNECTING);

        try {
            // Build URL with auth headers and last event ID
            const url = new URL(sseUrl);
            
            // Add auth token if provided
            if (sseOptions.authToken) {
                url.searchParams.set('token', sseOptions.authToken);
            }
            
            // Add last event ID for resuming
            if (lastEventIdRef.current) {
                url.searchParams.set('lastEventId', lastEventIdRef.current);
            }

            // Create EventSource with optional configuration
            const eventSourceConfig = {
                withCredentials: sseOptions.withCredentials || false
            };

            eventSourceRef.current = new EventSource(url.toString(), eventSourceConfig);

            eventSourceRef.current.onopen = () => {
                setSseStatus(SSE_STATES.CONNECTED);
                reconnectAttemptsRef.current = 0;
                
                if (sseOptions.onConnect) {
                    sseOptions.onConnect();
                }
            };

            // Handle default 'message' events
            eventSourceRef.current.onmessage = handleSSEMessage;

            // Handle custom event types
            if (sseOptions.eventTypes) {
                sseOptions.eventTypes.forEach(eventType => {
                    eventSourceRef.current.addEventListener(eventType, handleSSEMessage);
                });
            }

            eventSourceRef.current.onerror = (error) => {
                console.error('SSE error:', error);
                
                if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
                    setSseStatus(SSE_STATES.DISCONNECTED);
                    
                    // Auto-reconnect with exponential backoff
                    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                        reconnectAttemptsRef.current++;
                        const delay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1);
                        
                        reconnectTimeoutRef.current = setTimeout(() => {
                            connectSSE();
                        }, Math.min(delay, 30000)); // Max 30 seconds
                    }
                    else {
                        setSseStatus(SSE_STATES.ERROR);
                    }
                }
                else {
                    setSseStatus(SSE_STATES.ERROR);
                }
            };

        }
        catch (error) {
            console.error('Failed to create SSE connection:', error);
            setSseStatus(SSE_STATES.ERROR);
        }
    }, [sseUrl, handleSSEMessage, sseOptions, maxReconnectAttempts, reconnectInterval]);

    // Disconnect SSE
    const disconnectSSE = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        
        setSseStatus(SSE_STATES.DISCONNECTED);
        reconnectAttemptsRef.current = 0;
    }, []);

    // Manual reconnect (resets retry count)
    const reconnectSSE = useCallback(() => {
        reconnectAttemptsRef.current = 0;
        disconnectSSE();
        setTimeout(connectSSE, 1000);
    }, [connectSSE, disconnectSSE]);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        if (sseUrl) {
            connectSSE();
        }

        return () => {
            disconnectSSE();
        };
    }, [sseUrl, connectSSE, disconnectSSE]);

    // Convenience methods
    const success = useCallback((message, options = {}) => {
        return addNotification({ ...options, message, type: NOTIFICATION_TYPES.SUCCESS });
    }, [addNotification]);

    const error = useCallback((message, options = {}) => {
        return addNotification({ ...options, message, type: NOTIFICATION_TYPES.ERROR });
    }, [addNotification]);

    const warning = useCallback((message, options = {}) => {
        return addNotification({ ...options, message, type: NOTIFICATION_TYPES.WARNING });
    }, [addNotification]);

    const info = useCallback((message, options = {}) => {
        return addNotification({ ...options, message, type: NOTIFICATION_TYPES.INFO });
    }, [addNotification]);

    const value = {
        // Notification methods
        notifications,
        addNotification,
        removeNotification,
        removeAllNotifications,
        success,
        error,
        warning,
        info,
        
        // SSE methods and state
        sseStatus,
        connectSSE,
        disconnectSSE,
        reconnectSSE,
        lastEventId: lastEventIdRef.current
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <NotificationContainer 
                notifications={notifications} 
                onRemove={removeNotification} 
            />
            <SSEStatus 
                status={sseStatus}
                onReconnect={reconnectSSE}
            />
        </NotificationContext.Provider>
    );
};

NotificationProvider.propTypes = {
    children: PropTypes.node.isRequired,
    sseUrl: PropTypes.string,
    sseOptions: PropTypes.shape({
        maxReconnectAttempts: PropTypes.number,
        reconnectInterval: PropTypes.number,
        withCredentials: PropTypes.bool,
        authToken: PropTypes.string,
        eventTypes: PropTypes.arrayOf(PropTypes.string),
        onConnect: PropTypes.func,
        onUpdate: PropTypes.func,
        onMessage: PropTypes.func
    })
};

export default NotificationProvider;