import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getWSSURL } from 'shared/api/config';
import { Events } from 'shared/constants';
import {
    getMessages,
    sendDirectMessage,
    sendMessage
} from 'shared/api/actions';
import { MessageDTO } from 'shared/api/types';

export const useWebSocket = (
    token: string | null,
    messages: MessageDTO[],
    setMessages: React.Dispatch<React.SetStateAction<MessageDTO[]>>
) => {
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!token) {
            console.warn(
                '[WebSocket] No token provided, skipping socket connection'
            );
            return;
        }

        const newSocket: Socket = io(getWSSURL(), {
            transports: ['websocket', 'polling'],
            query: { token },
            withCredentials: true,
            rejectUnauthorized: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 2000
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('[WebSocket] Connected');
            setIsConnected(true);
            clearPolling();
        });

        newSocket.on('connect_error', (err) => {
            if (!pollInterval?.current)
                console.error('[WebSocket] Connection error:', err);
            setIsConnected(false);
        });

        newSocket.on('disconnect', (reason) => {
            console.warn('[WebSocket] Disconnected:', reason);
            setIsConnected(false);
        });

        newSocket.on('error', (err) => {
            console.error('[WebSocket] Socket error:', err);
        });

        return () => {
            console.log('[WebSocket] Cleaning up');
            newSocket.disconnect();
            clearPolling();
        };
    }, [token]);

    const clearPolling = () => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    };

    const joinChannel = (channelID: number) => {
        if (!token) {
            console.warn('[WebSocket] No token available');
            return;
        }

        setMessages([]);

        if (!socket || !isConnected) {
            console.warn('[WebSocket] Fallback to polling messages every 5s');

            clearPolling();
            pollInterval.current = setInterval(async () => {
                try {
                    const freshMessages = await getMessages(channelID, token);
                    if (freshMessages?.length) setMessages(freshMessages);
                }
                catch (err) {
                    console.error('[Polling] Failed to fetch messages:', err);
                }
            }, 1000);

            return;
        }

        clearPolling();

        console.log(`[WebSocket] Joining channel ${channelID}`);
        socket.emit('joinChannel', { channelID });

        socket.off('joinedChannel');
        socket.on('joinedChannel', (data) => {
            if (data.channelID === channelID && data.success) {
                console.log(
                    `[WebSocket] Successfully joined channel ${channelID}`
                );
            }

            getMessages(channelID, token).then(
                (list) => list?.length && setMessages(list)
            );
        });

        socket.off(Events.MESSAGE_CREATE);
        socket.on(Events.MESSAGE_CREATE, (newMessage: MessageDTO) => {
            console.log(
                `[WebSocket] New message in channel ${channelID}`,
                newMessage
            );
            setMessages((prev) => {
                const exists = prev.some((msg) => msg.id === newMessage.id);
                return exists ? prev : [...prev, newMessage];
            });
        });
    };

    const leaveChannel = (channelID: number) => {
        if (socket) {
            console.log(`[WebSocket] Leaving channel ${channelID}`);
            socket.emit('leaveChannel', { channelID });
        }
        clearPolling();
    };

    const send = async ({
        channel,
        receiverID,
        content
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

            setMessages((prev) => {
                const exists = prev.some((msg) => msg.id === newMsg.id);
                return exists ? prev : [...prev, newMsg];
            });
        }
        catch (err) {
            console.error('[WebSocket] Failed to send message', err);
        }
    };

    return { socket, messages, joinChannel, leaveChannel, send };
};
