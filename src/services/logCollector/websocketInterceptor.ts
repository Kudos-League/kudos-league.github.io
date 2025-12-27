import LogCollectorService from './LogCollectorService';
import type { Socket } from 'socket.io-client';

/**
 * Wrap a Socket.IO socket instance to intercept emit and on events
 */
export function wrapSocketWithInterceptor(socket: Socket): Socket {
    const isDevMode =
        process.env.REACT_APP_BACKEND_URI?.includes('localhost') ||
        process.env.REACT_APP_BACKEND_URI?.includes('api-dev');

    if (!isDevMode) return socket;

    try {
        const service = LogCollectorService.getInstance();
        const socketId = socket.id || 'unknown';

        // Store original emit and on methods
        const originalEmit = socket.emit.bind(socket);
        const originalOn = socket.on.bind(socket);
        const originalOnce = socket.once.bind(socket);

        // Override emit to log outgoing messages
        socket.emit = function (event: string, ...args: any[]) {
            if (service.getEnabled()) {
                try {
                    const payload = args.length === 1 ? args[0] : args;
                    const message = `→ ${event}`;

                    service.addLog({
                        type: 'websocket',
                        message,
                        direction: 'sent',
                        event,
                        payload: serializePayload(payload),
                        socketId,
                    } as any);
                }
                catch (e) {
                    console.error('[LogCollector WebSocket] Failed to log emit:', e);
                }
            }

            // Call original emit
            return originalEmit(event, ...args);
        } as any;

        // Override on to log incoming messages
        socket.on = function (event: string, listener: (...args: any[]) => void) {
            // Create a wrapper that logs before calling the original listener
            const wrappedListener = (...args: any[]) => {
                if (service.getEnabled()) {
                    try {
                        const payload = args.length === 1 ? args[0] : args;
                        const message = `← ${event}`;

                        service.addLog({
                            type: 'websocket',
                            message,
                            direction: 'received',
                            event,
                            payload: serializePayload(payload),
                            socketId,
                        } as any);
                    }
                    catch (e) {
                        console.error('[LogCollector WebSocket] Failed to log on:', e);
                    }
                }

                // Call original listener
                listener.apply(this, args);
            };

            // Call original on with wrapped listener
            return originalOn(event, wrappedListener);
        } as any;

        // Override once similarly
        socket.once = function (event: string, listener: (...args: any[]) => void) {
            const wrappedListener = (...args: any[]) => {
                if (service.getEnabled()) {
                    try {
                        const payload = args.length === 1 ? args[0] : args;
                        const message = `← ${event} (once)`;

                        service.addLog({
                            type: 'websocket',
                            message,
                            direction: 'received',
                            event,
                            payload: serializePayload(payload),
                            socketId,
                        } as any);
                    }
                    catch (e) {
                        console.error('[LogCollector WebSocket] Failed to log once:', e);
                    }
                }

                listener.apply(this, args);
            };

            return originalOnce(event, wrappedListener);
        } as any;

        // Log socket connection/disconnection
        if (service.getEnabled()) {
            originalOn('connect', () => {
                service.addLog({
                    type: 'websocket',
                    message: '✓ Connected',
                    direction: 'received',
                    event: 'connect',
                    socketId: socket.id || 'unknown',
                } as any);
            });

            originalOn('disconnect', (reason: string) => {
                service.addLog({
                    type: 'websocket',
                    message: `✗ Disconnected: ${reason}`,
                    direction: 'received',
                    event: 'disconnect',
                    payload: { reason },
                    socketId: socketId,
                } as any);
            });

            originalOn('connect_error', (error: Error) => {
                service.addLog({
                    type: 'websocket',
                    message: `✗ Connection Error: ${error.message}`,
                    direction: 'received',
                    event: 'connect_error',
                    payload: { error: error.message },
                    socketId: socketId,
                } as any);
            });
        }

        console.log('[LogCollector] WebSocket interceptor initialized');
    }
    catch (e) {
        console.error('[LogCollector] Failed to initialize WebSocket interceptor:', e);
    }

    return socket;
}

/**
 * Serialize WebSocket payload safely
 */
function serializePayload(payload: any): any {
    try {
        // Limit payload size
        const serialized = JSON.stringify(payload);
        if (serialized.length > 10000) {
            return '[Large payload truncated...]';
        }
        return payload;
    }
    catch (e) {
        return '[Serialization error]';
    }
}
