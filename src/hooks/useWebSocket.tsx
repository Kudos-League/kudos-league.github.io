import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getWSSURL } from 'shared/api/config';
import { Events } from 'shared/constants';
import { getMessages, sendDirectMessage, sendMessage } from 'shared/api/actions';
import type { MessageDTO } from 'shared/api/types';

export const useWebSocket = (
    token: string | null,
    messages: MessageDTO[],
    setMessages: React.Dispatch<React.SetStateAction<MessageDTO[]>>
) => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const pollInterval = useRef<NodeJS.Timeout | null>(null);
    const pendingJoins = useRef<Set<number>>(new Set());
    const activeChannelId = useRef<number | null>(null);

    const clearPolling = useCallback(() => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    }, []);

    useEffect(() => {
        if (!token) {
            console.warn('[WebSocket] No token provided, skipping socket connection');
            return;
        }

        if (socketRef.current) return;

        const sock = io(getWSSURL(), {
            path: '/socket.io',
            transports: ['websocket'],
            query: { token }, // TODO: Remove this
            auth: { token },
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000,
            autoConnect: true,
            forceNew: true,
        });

        socketRef.current = sock;

        const handleConnect = () => {
            console.log('[WebSocket] Connected');
            setIsConnected(true);
            clearPolling();

            if (pendingJoins.current.size) {
                Array.from(pendingJoins.current).forEach(id => {
                    sock.emit('joinChannel', { channelID: id });
                });
                pendingJoins.current.clear();
            }

            if (activeChannelId.current != null) {
                sock.emit('joinChannel', { channelID: activeChannelId.current });
            }
        };

        const handleConnectError = (err: unknown) => {
            if (!pollInterval.current) console.error('[WebSocket] Connection error:', err);
            setIsConnected(false);
        };

        const handleDisconnect = (reason: string) => {
            console.warn('[WebSocket] Disconnected:', reason);
            setIsConnected(false);
        };

        const handleNewMessage = (newMessage: MessageDTO) => {
            setMessages(prev => (prev.some(m => m.id === newMessage.id) ? prev : [...prev, newMessage]));
        };

        sock.on('connect', handleConnect);
        sock.on('connect_error', handleConnectError);
        sock.on('disconnect', handleDisconnect);
        sock.on(Events.MESSAGE_CREATE, handleNewMessage);

        return () => {
            console.log('[WebSocket] Cleaning up');
            clearPolling();
            pendingJoins.current.clear();
            activeChannelId.current = null;

            sock.off('connect', handleConnect);
            sock.off('connect_error', handleConnectError);
            sock.off('disconnect', handleDisconnect);
            sock.off(Events.MESSAGE_CREATE, handleNewMessage);

            sock.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [token, clearPolling, setMessages]);

    const actuallyJoin = useCallback((channelID: number, sock: Socket, tokenNonNull: string) => {
        console.log(`[WebSocket] Joining channel ${channelID}`);

        const onJoined = (data: { channelID: number; success: boolean }) => {
            if (data.channelID === channelID && data.success) {
                console.log(`[WebSocket] Successfully joined channel ${channelID}`);
                getMessages(channelID, tokenNonNull).then(list => list?.length && setMessages(list));
            }
        };

        sock.once('joinedChannel', onJoined);
        sock.emit('joinChannel', { channelID });
    }, [setMessages]);

    const startPolling = useCallback((channelID: number, tokenNonNull: string) => {
        clearPolling();
        pollInterval.current = setInterval(async () => {
            try {
                const fresh = await getMessages(channelID, tokenNonNull);
                if (fresh?.length) setMessages(fresh);
            }
            catch (err) {
                console.error('[Polling] Failed to fetch messages:', err);
            }
        }, 1000);
    }, [clearPolling, setMessages]);

    const joinChannel = useCallback((channelID: number) => {
        if (!token) {
            console.warn('[WebSocket] No token available');
            return;
        }

        activeChannelId.current = channelID;
        setMessages([]);

        const sock = socketRef.current;

        const connected = !!sock && (sock.connected || isConnected);

        if (!sock || !connected) {
            console.warn('[WebSocket] Not ready; queue join and start short polling');
            pendingJoins.current.add(channelID);
            startPolling(channelID, token);
            return;
        }

        clearPolling();
        actuallyJoin(channelID, sock, token);
    }, [token, isConnected, setMessages, clearPolling, actuallyJoin, startPolling]);

    const leaveChannel = useCallback((channelID: number) => {
        const sock = socketRef.current;
        if (sock) {
            console.log(`[WebSocket] Leaving channel ${channelID}`);
            sock.emit('leaveChannel', { channelID });
        }
        if (activeChannelId.current === channelID) activeChannelId.current = null;
        pendingJoins.current.delete(channelID);
        clearPolling();
    }, [clearPolling]);

    const send = useCallback(async ({
        channel,
        receiverID,
        content,
    }: {
        channel?: { id: number };
        receiverID?: number;
        content: string;
    }) => {
        if (!token) return;

        try {
            const newMsg = receiverID
                ? await sendDirectMessage(receiverID, { content }, token)
                : await sendMessage({ channelID: channel!.id, content }, token);

            setMessages(prev => (prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]));
        }
        catch (err) {
            console.error('[WebSocket] Failed to send message', err);
        }
    }, [token, setMessages]);

    return {
        socket: socketRef.current,
        messages,
        joinChannel,
        leaveChannel,
        send,
        isConnected: socketRef.current?.connected ?? isConnected,
    };
};