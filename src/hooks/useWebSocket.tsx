import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { Events } from 'shared/constants';
import {
    getMessages,
    sendDirectMessage,
    sendMessage
} from 'shared/api/actions';
import type { MessageDTO, NotificationPayload } from 'shared/api/types';
import { useAuth } from '../contexts/useAuth';
import { getSocket } from './useWebsocketClient';

type UseWebSocketArgs = {
    messages: MessageDTO[];
    setMessages: React.Dispatch<React.SetStateAction<MessageDTO[]>>;
    onNotification?: (n: NotificationPayload) => void;
};

export const useWebSocket = ({
    messages,
    setMessages,
    onNotification
}: UseWebSocketArgs) => {
    const { user, token } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const pollInterval = useRef<NodeJS.Timeout | null>(null);
    const pendingJoins = useRef<Set<number>>(new Set());
    const activeChannelId = useRef<number | null>(null);
    const currentUserId = user?.id ?? null;

    const clearPolling = useCallback(() => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    }, []);

    // inside useWebSocket
    const joinedUserId = useRef<number | null>(null);

    useEffect(() => {
        const sock = socketRef.current;
        if (!sock) return;

        // if we have a user and a live socket, ensure we're in the right user room
        if (currentUserId != null && (sock.connected || isConnected)) {
            if (joinedUserId.current !== currentUserId) {
                // leave previous user room if we switched accounts
                if (
                    joinedUserId.current != null &&
                    joinedUserId.current !== currentUserId
                ) {
                    sock.emit('leaveUser', { userID: joinedUserId.current });
                }
                console.log('[WS] joinUser', currentUserId);
                sock.emit('joinUser', { userID: currentUserId });
                joinedUserId.current = currentUserId;
            }
        }
    }, [currentUserId, isConnected]); // run whenever auth resolves or socket reconnects

    useEffect(() => {
        if (!token) return;

        const sock = getSocket(token);
        socketRef.current = sock;

        const handleConnect = () => {
            setIsConnected(true);
            clearPolling();
            if (currentUserId != null)
                sock.emit('joinUser', { userID: currentUserId });
            if (activeChannelId.current != null)
                sock.emit('joinChannel', {
                    channelID: activeChannelId.current
                });
        };

        const handleConnectError = (err: any) => {
            setIsConnected(false);
            // surface what socket.io gives you
            console.error(
                '[WS] connect_error',
                err?.message,
                err?.description,
                err?.context
            );
        };

        const handleDisconnect = (reason: string) => {
            setIsConnected(false);
            console.warn('[WS] Disconnected:', reason);
        };

        const handleNewMessage = (m: MessageDTO) => {
            setMessages((prev) =>
                prev.some((x) => x.id === m.id) ? prev : [...prev, m]
            );
        };

        // attach listeners ONCE
        if (!(sock as any).__listenersAttached) {
            sock.on('connect', handleConnect);
            sock.on('connect_error', handleConnectError);
            sock.on('disconnect', handleDisconnect);
            sock.on(Events.MESSAGE_CREATE, handleNewMessage);
            (sock as any).__listenersAttached = true;
        }
        else if (sock.connected) {
            // if remounted during Strict Mode and already connected, run post-connect actions
            handleConnect();
        }

        return () => {
            clearPolling();
            pendingJoins.current.clear();
            activeChannelId.current = null;

            // DO NOT disconnect the singleton here
            // Leave listeners attached; they’re idempotent due to the flag above
        };
    }, [token, currentUserId, clearPolling, setMessages, onNotification]);

    const actuallyJoin = useCallback(
        (channelID: number, sock: Socket, tokenNonNull: string) => {
            const onJoined = (data: {
                channelID: number;
                success: boolean;
            }) => {
                if (data.channelID === channelID && data.success) {
                    getMessages(channelID, tokenNonNull).then(
                        (list) => list?.length && setMessages(list)
                    );
                }
            };
            sock.once('joinedChannel', onJoined);
            sock.emit('joinChannel', { channelID });
        },
        [setMessages]
    );

    const startPolling = useCallback(
        (channelID: number, tokenNonNull: string) => {
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
        },
        [clearPolling, setMessages]
    );

    const joinChannel = useCallback(
        (channelID: number) => {
            if (!token) {
                console.warn('[WebSocket] No token available');
                return;
            }

            activeChannelId.current = channelID;
            setMessages([]);

            const sock = socketRef.current;
            const connected = !!sock && (sock.connected || isConnected);

            if (!sock || !connected) {
                pendingJoins.current.add(channelID);
                startPolling(channelID, token);
                return;
            }

            clearPolling();
            actuallyJoin(channelID, sock, token);
        },
        [
            token,
            isConnected,
            setMessages,
            clearPolling,
            actuallyJoin,
            startPolling
        ]
    );

    const leaveChannel = useCallback(
        (channelID: number) => {
            const sock = socketRef.current;
            if (sock) sock.emit('leaveChannel', { channelID });
            if (activeChannelId.current === channelID)
                activeChannelId.current = null;
            pendingJoins.current.delete(channelID);
            clearPolling();
        },
        [clearPolling]
    );

    const send = useCallback(
        async ({
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
                    : await sendMessage(
                        { channelID: channel!.id, content },
                        token
                    );

                setMessages((prev) =>
                    prev.some((m) => m.id === newMsg.id)
                        ? prev
                        : [...prev, newMsg]
                );
            }
            catch (err) {
                console.error('[WebSocket] Failed to send message', err);
            }
        },
        [token, setMessages]
    );

    return {
        socket: socketRef.current,
        messages,
        joinChannel,
        leaveChannel,
        send,
        isConnected: socketRef.current?.connected ?? isConnected
    };
};
