import { io, Socket } from 'socket.io-client';
import { getWSSURL } from 'shared/api/config';
import { wrapSocketWithInterceptor } from '@/services/logCollector/websocketInterceptor';

let socket: Socket | null = null;
let socketToken: string | null = null;

function applySocketAuth(sock: Socket, token: string) {
    sock.auth = { token };
    (sock.io.opts as any).query = {
        ...((sock.io.opts as any).query ?? {}),
        token
    };
}

export function getSocket(token: string) {
    if (socket) {
        const tokenChanged = socketToken !== token;
        applySocketAuth(socket, token);
        socketToken = token;

        if (tokenChanged && socket.connected) {
            socket.disconnect().connect();
        }
        else if (!socket.connected) {
            socket.connect();
        }

        return socket;
    }
    socket = io(getWSSURL(), {
        path: '/socket.io',
        transports: ['polling', 'websocket'],
        tryAllTransports: true,
        query: { token },
        auth: { token },
        withCredentials: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        autoConnect: true
        // forceNew: true,
    });

    // Wrap with dev tools interceptor (only in dev mode)
    socket = wrapSocketWithInterceptor(socket);
    socketToken = token;

    return socket;
}
