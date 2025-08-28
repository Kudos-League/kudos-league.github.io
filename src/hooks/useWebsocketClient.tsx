import { io, Socket } from 'socket.io-client';
import { getWSSURL } from 'shared/api/config';

let socket: Socket | null = null;

export function getSocket(token: string) {
    if (socket) {
        socket.auth = { token };
        if (!socket.connected) socket.connect();
        return socket;
    }
    socket = io(getWSSURL(), {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        query: { token },
        // auth: { token },
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        autoConnect: true
        // forceNew: true,
    });
    return socket;
}
