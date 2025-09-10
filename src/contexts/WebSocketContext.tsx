import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode
} from 'react';
import { Socket } from 'socket.io-client';
import { Events } from 'shared/constants';
import {
    getMessages,
    sendDirectMessage,
    sendMessage
} from 'shared/api/actions';
import type { MessageDTO, NotificationPayload } from 'shared/api/types';
import { useAuth } from './useAuth';
import { pushAlert } from '@/components/common/alertBus';
import { getSocket } from '@/hooks/useWebsocketClient';

type Ctx = {
    socket: Socket | null;
    messages: MessageDTO[];
    setMessages: React.Dispatch<React.SetStateAction<MessageDTO[]>>;
    joinChannel: (channelID: number) => void;
    leaveChannel: (channelID: number) => void;
    send: (args: {
        channel?: { id: number };
        receiverID?: number;
        content: string;
        replyToMessageID?: number;
    }) => Promise<void>;
    isConnected: boolean;
    isConnecting: boolean;
    connectingText: string | null;
    snoozeConnectingOverlay: () => void;
};

const WebSocketContext = createContext<Ctx | null>(null);

export function WebSocketProvider({
    children,
    onNotification
}: {
    children: ReactNode;
    onNotification?: (n: NotificationPayload) => void;
}) {
    const { user, token } = useAuth();
    const socketRef = useRef<Socket | null>(null);

    const [messages, setMessages] = useState<MessageDTO[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    // Overlay state
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectingText, setConnectingText] = useState<string | null>(null);
    const [overlaySnoozed, setOverlaySnoozed] = useState(false);

    const pollInterval = useRef<NodeJS.Timeout | null>(null);
    const pendingJoins = useRef<Set<number>>(new Set());
    const activeChannelId = useRef<number | null>(null);
    const joinedUserId = useRef<number | null>(null);

    const currentUserId = user?.id ?? null;

    const clearPolling = useCallback(() => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    }, []);

    useEffect(() => {
        const sock = socketRef.current;
        if (!sock) return;

        if (currentUserId != null && (sock.connected || isConnected)) {
            if (joinedUserId.current !== currentUserId) {
                if (
                    joinedUserId.current != null &&
                    joinedUserId.current !== currentUserId
                ) {
                    sock.emit('leaveUser', { userID: joinedUserId.current });
                }
                sock.emit('joinUser', { userID: currentUserId });
                joinedUserId.current = currentUserId;
            }
        }
    }, [currentUserId, isConnected]);

    useEffect(() => {
        if (!token) {
            setIsConnected(false);
            setIsConnecting(false);
            setConnectingText(null);
            return;
        }

        setOverlaySnoozed(false);
        setIsConnecting(true);
        setConnectingText('Connecting to chat...');

        const sock = getSocket(token);
        socketRef.current = sock;

        const handleConnect = () => {
            setIsConnected(true);
            setIsConnecting(false);
            setConnectingText(null);
            clearPolling();

            if (currentUserId != null)
                sock.emit('joinUser', { userID: currentUserId });
            if (activeChannelId.current != null)
                sock.emit('joinChannel', {
                    channelID: activeChannelId.current
                });

            for (const ch of Array.from(pendingJoins.current)) {
                sock.emit('joinChannel', { channelID: ch });
            }
            pendingJoins.current.clear();
        };

        const handleConnectError = (err: any) => {
            setIsConnected(false);
            setIsConnecting(true);
            setConnectingText('Connection failed. Retrying...');
            console.error(
                '[WS] connect_error',
                err?.message,
                err?.description,
                err?.context
            );
        };

        const handleDisconnect = (reason: string) => {
            setIsConnected(false);
            setIsConnecting(true);
            setConnectingText('Reconnecting...');
            setOverlaySnoozed(false);
            console.warn('[WS] Disconnected:', reason);
        };

        const handleNewMessage = (m: MessageDTO | undefined | null) => {
            if (!m || typeof (m as any) !== 'object' || m.id == null) return;
            setMessages((prev) => {
                const idx = prev.findIndex((x) => x?.id === m.id);
                const enriched: MessageDTO = {
                    ...(m as any),
                    author:
                        (m as any).author ||
                        ((currentUserId != null &&
                            ((m as any).authorID === currentUserId ||
                                (m as any).author?.id === currentUserId))
                            ? (user as any)
                            : undefined),
                    authorID:
                        (m as any).authorID ??
                        (m as any).author?.id ??
                        (currentUserId != null &&
                        ((m as any).author?.id === currentUserId ||
                            (m as any).authorID === currentUserId)
                            ? currentUserId
                            : undefined)
                } as MessageDTO;

                if (idx === -1) {
                    return [...prev, enriched];
                }

                const existing = prev[idx];
                const merged: MessageDTO = {
                    ...existing,
                    ...enriched,
                    author: existing.author || enriched.author,
                    authorID: existing.authorID ?? enriched.authorID
                } as MessageDTO;
                const copy = [...prev];
                copy[idx] = merged;
                return copy;
            });
        };

        const handleKudosUpdate = (p: { delta: number; total: number } | null | undefined) => {
            if (!p || typeof p.delta !== 'number' || typeof p.total !== 'number') return;
            const sign = p.delta >= 0 ? '+' : '';
            pushAlert({ type: 'success', message: `You ${p.delta >= 0 ? 'gained' : 'lost'} ${sign}${p.delta} kudos. Total: ${p.total}` });
        };

        if (!(sock as any).__listenersAttached) {
            sock.on('connect', handleConnect);
            sock.on('connect_error', handleConnectError);
            sock.on('disconnect', handleDisconnect);
            sock.on(Events.MESSAGE_CREATE, handleNewMessage);
            sock.on(Events.KUDOS_UPDATE, handleKudosUpdate);
            (sock as any).__listenersAttached = true;
        }
        else if (sock.connected) {
            handleConnect();
        }

        return () => {
            clearPolling();
            pendingJoins.current.clear();
        };
    }, [token, currentUserId, clearPolling]);

    const actuallyJoin = useCallback(
        (channelID: number, sock: Socket, tokenNonNull: string) => {
            const onJoined = (data: {
                channelID: number;
                success: boolean;
            }) => {
                if (data.channelID === channelID && data.success) {
                    getMessages(channelID, tokenNonNull).then((list) => {
                        if (Array.isArray(list)) {
                            const cleaned = list.filter(Boolean);
                            setMessages(cleaned);
                        }
                    });
                }
            };
            sock.once('joinedChannel', onJoined);
            sock.emit('joinChannel', { channelID });
        },
        []
    );

    const startPolling = useCallback(
        (channelID: number, tokenNonNull: string) => {
            clearPolling();
            pollInterval.current = setInterval(async () => {
                try {
                    const fresh = await getMessages(channelID, tokenNonNull);
                    if (Array.isArray(fresh)) {
                        setMessages(fresh.filter(Boolean));
                    }
                }
                catch (err) {
                    console.error('[Polling] Failed to fetch messages:', err);
                }
            }, 1000);
        },
        [clearPolling]
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
        [token, isConnected, clearPolling, actuallyJoin, startPolling]
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
            content,
            replyToMessageID
        }: {
            channel?: { id: number };
            receiverID?: number;
            content: string;
            replyToMessageID?: number;
        }) => {
            if (!token) return;
            try {
                const newMsg = receiverID
                    ? await sendDirectMessage(
                        receiverID,
                        {
                            content,
                            ...(replyToMessageID ? { replyToMessageID } : {})
                        },
                        token
                    )
                    : await sendMessage(
                        {
                            channelID: channel!.id,
                            content,
                            ...(replyToMessageID ? { replyToMessageID } : {})
                        },
                        token
                    );

                if (!newMsg || (newMsg as any).id == null) return;
                const withAuthor: MessageDTO = {
                    ...(newMsg as any),
                    author: (newMsg as any).author || user || undefined,
                    authorID:
                        (newMsg as any).authorID ??
                        user?.id ??
                        (newMsg as any).author?.id
                } as MessageDTO;
                setMessages((prev) =>
                    prev.some((m) => m?.id === withAuthor.id)
                        ? prev
                        : [...prev, withAuthor]
                );
            }
            catch (err) {
                console.error('[WebSocket] Failed to send message', err);
            }
        },
        [token]
    );

    const snoozeConnectingOverlay = useCallback(() => {
        setOverlaySnoozed(true);
    }, []);

    const connectingVisible = isConnecting && !overlaySnoozed;

    const safeSetMessages: React.Dispatch<React.SetStateAction<MessageDTO[]>> =
        useCallback((updater: React.SetStateAction<MessageDTO[]>) => {
            setMessages((prev) => {
                const next =
                    typeof updater === 'function'
                        ? (updater as (p: MessageDTO[]) => MessageDTO[])(prev)
                        : updater;
                return Array.isArray(next) ? next.filter(Boolean) : [];
            });
        }, []);

    const value = useMemo<Ctx>(
        () => ({
            socket: socketRef.current,
            messages,
            setMessages: safeSetMessages,
            joinChannel,
            leaveChannel,
            send,
            isConnected,
            isConnecting: connectingVisible,
            connectingText,
            snoozeConnectingOverlay
        }),
        [
            messages,
            joinChannel,
            leaveChannel,
            send,
            isConnected,
            connectingVisible,
            connectingText,
            snoozeConnectingOverlay,
            safeSetMessages
        ]
    );

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocketContext(): Ctx {
    const ctx = useContext(WebSocketContext);
    if (!ctx)
        throw new Error(
            'useWebSocketContext must be used within WebSocketProvider'
        );
    return ctx;
}
