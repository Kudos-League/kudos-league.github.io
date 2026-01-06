import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from 'redux_store/store';
import { useQueryClient } from '@tanstack/react-query';

import {
    pushOne as pushAction,
    loadNotifications,
    acknowledgeAll as acknowledgeAllThunk,
    markNotificationActed
} from 'redux_store/slices/notifications.slice';

import { NotificationRecord, NotificationType } from '@/shared/api/types';
import { pushAlert } from '@/components/common/alertBus';
import { useAuth } from '@/contexts/useAuth';
import { getSocket } from '@/hooks/useWebsocketClient';
import { Events } from '@/shared/constants';
import { useDataCache } from '@/contexts/DataCacheContext';

type Ctx = {
    state: { items: NotificationRecord[]; unread: number; loaded: boolean };
    push: (n: NotificationRecord) => void;
    acknowledgeAll: () => Promise<void>;
    markActed: (id: number) => Promise<void>;
    hasNewNotifications: boolean;
    clearNewNotifications: () => void;
};

const NotificationsContext = createContext<Ctx | null>(null);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
    children
}) => {
    const dispatch = useDispatch();
    const state = useSelector((s: RootState) => s.notifications);
    const { user, token, logout } = useAuth();
    const queryClient = useQueryClient();
    const { invalidateHandshake, invalidatePost } = useDataCache();
    const [hasNewNotifications, setHasNewNotifications] = React.useState(false);

    const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
    const autoActTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
    const debug = useMemo(() =>
        (...args: unknown[]) => console.debug('[NotificationsContext]', ...args),
    []);

    useEffect(() => () => {
        autoActTimers.current.forEach((timer) => clearTimeout(timer));
        autoActTimers.current.clear();
    }, []);

    useEffect(() => {
        if (!token || !user?.id) return;
        debug('loading notifications', { userID: user.id });
        dispatch(loadNotifications({ limit: 50 }) as any);
    }, [dispatch, token, user?.id]);

    useEffect(() => {
        if (!token) {
            socketRef.current = null;
            return;
        }

        const sock = getSocket(token);
        socketRef.current = sock;
        debug('socket obtained', { connected: sock.connected });

        const handleConnect = () => {
            debug('socket connect event', {
                connected: sock.connected,
                id: sock.id,
                userID: user?.id
            });
        };

        const handleDisconnect = (reason: string) => {
            debug('socket disconnected', { reason, id: sock.id });
        };

        const handleConnectError = (err: Error) => {
            debug('socket connect error', { message: err.message });
        };

        const handleReconnect = (attempt: number) => {
            debug('socket reconnecting', { attempt });
        };

        const handleJoinedUser = (payload: unknown) => {
            debug('received joinedUser ack', payload);
        };

        const handleAny = (event: string, payload: unknown) => {
            if (event === 'pong' || event === 'ping') return;
            debug('socket event received', { event, payload });
        };

        const handleNotification = async (incoming: NotificationRecord) => {
            const normalized: NotificationRecord = {
                ...incoming,
                isRead: incoming.isRead ?? false,
                isActedOn: incoming.isActedOn ?? false,
                createdAt: incoming.createdAt ?? new Date().toISOString()
            };
            debug('received notification', {
                id: (normalized as any).id,
                type: normalized.type,
                postID: 'postID' in normalized ? normalized.postID : undefined,
                from: 'message' in normalized ? normalized.message?.author?.id : undefined,
                isRead: normalized.isRead,
                isActedOn: normalized.isActedOn
            });
            dispatch(pushAction(normalized));
            console.log('[NotificationsContext] Notification dispatched to Redux store');

            // Set flag to show "new notifications" banner
            setHasNewNotifications(true);

            // Invalidate notification history query to show new notifications
            queryClient.invalidateQueries({ queryKey: ['notifications', 'history'] });

            // Invalidate handshake/post cache for handshake-related notifications
            if (
                normalized.type === NotificationType.HANDSHAKE_CREATED ||
                normalized.type === NotificationType.HANDSHAKE_ACCEPTED ||
                normalized.type === NotificationType.HANDSHAKE_COMPLETED ||
                normalized.type === NotificationType.HANDSHAKE_CANCELLED
            ) {
                const handshakeID = 'handshakeID' in normalized ? normalized.handshakeID : undefined;
                const postID = 'postID' in normalized ? normalized.postID : undefined;

                if (handshakeID) {
                    invalidateHandshake(handshakeID);
                }
                if (postID) {
                    invalidatePost(postID);
                }
            }

            // Invalidate event cache for event-related notifications
            if (normalized.type === NotificationType.EVENT_USER_JOINED) {
                const eventID = 'eventID' in normalized ? normalized.eventID : undefined;
                if (eventID) {
                    queryClient.invalidateQueries({ queryKey: ['event', eventID] });
                    queryClient.invalidateQueries({ queryKey: ['events'] });
                }
            }

            try {
                if (normalized.type === 'direct-message') {
                    const author = normalized.message?.author?.username || normalized.message?.author?.displayName || 'Someone';
                    const text = normalized.message?.content || '';
                    pushAlert({ type: 'info', message: `New DM from ${author}: ${text}` });
                }
                else if (normalized.type === 'post-reply') {
                    const text = normalized.message?.content || '';
                    pushAlert({ type: 'info', message: `New reply on your post: ${text}` });
                }
                else if (normalized.type === 'event-reply') {
                    const text = normalized.message?.content || '';
                    pushAlert({ type: 'info', message: `New comment on your event: ${text}` });
                }
                else if (normalized.type === 'past-gift') {
                    pushAlert({ type: 'info', message: `Past gift logged on your profile.` });
                }
                else if (normalized.type === 'post-auto-close') {
                    const when = (normalized as any).closedAt || (normalized as any).closeAt;
                    const msg = when
                        ? `Post #${(normalized as any).postID} auto-close (${new Date(when).toLocaleString()})`
                        : `Post #${(normalized as any).postID} auto-close`;
                    pushAlert({ type: 'warning', message: msg });
                }
                else if (normalized.type === NotificationType.BUG_REPORT) {
                    pushAlert({ type: 'info', message: 'New bug report submitted.' });
                }
                else if (normalized.type === NotificationType.SITE_FEEDBACK) {
                    pushAlert({ type: 'info', message: 'New site feedback submitted.' });
                }
                else if (normalized.type === NotificationType.HANDSHAKE_CREATED) {
                    const user = 'user' in normalized ? (normalized as any).user
                        : 'sender' in normalized ? (normalized as any).sender
                            : null;
                    const username = user?.username || user?.displayName || 'Someone';
                    pushAlert({ type: 'info', message: `${username} wants to help with your post!` });
                }
                else if (normalized.type === NotificationType.HANDSHAKE_ACCEPTED) {
                    const user = 'user' in normalized ? (normalized as any).user
                        : 'sender' in normalized ? (normalized as any).sender
                            : null;
                    const username = user?.username || user?.displayName || 'They';
                    pushAlert({ type: 'success', message: `${username} accepted your help offer!` });
                }
                else if (normalized.type === NotificationType.HANDSHAKE_COMPLETED) {
                    pushAlert({ type: 'success', message: 'Help completed!' });
                }
                else if (normalized.type === NotificationType.HANDSHAKE_CANCELLED) {
                    const noShow = 'noShowReported' in normalized ? normalized.noShowReported : false;
                    const msg = noShow
                        ? 'Help cancelled due to no-show.'
                        : 'Help cancelled.';
                    pushAlert({ type: 'warning', message: msg });
                }
                else if (normalized.type === NotificationType.EVENT_USER_JOINED) {
                    const user = 'user' in normalized ? normalized.user : null;
                    const username = user?.username || user?.displayName || 'Someone';
                    console.log('[NotificationsContext] EVENT_USER_JOINED received!', {
                        notification: normalized,
                        username,
                        eventID: 'eventID' in normalized ? normalized.eventID : undefined,
                        userID: 'userID' in normalized ? normalized.userID : undefined,
                        hasUser: 'user' in normalized && !!normalized.user
                    });
                    pushAlert({ type: 'info', message: `${username} joined your event!` });
                }
                else if ((normalized as any).type === NotificationType.USER_BANNED || (normalized as any).type === 'user-banned') {
                    const banEnd = (normalized as any).banEndDate || (normalized as any).payload?.banEndDate;
                    const until = banEnd ? ` until ${new Date(banEnd).toLocaleString()}` : '';
                    pushAlert({ type: 'danger', message: `Your account has been banned${until}. You will be logged out.` });

                    try {
                        if (typeof logout === 'function') {
                            await logout();
                        }
                    }
                    catch (err) {
                        console.error('Error logging out after ban notification', err);
                    }

                    try {
                        const url = new URL(window.location.href);
                        url.pathname = '/login';
                        url.searchParams.set('banned', '1');
                        if (banEnd) url.searchParams.set('banEndDate', String(banEnd));
                        window.location.href = url.toString();
                    }
                    catch (err) {
                        window.location.href = '/login?banned=1' + (banEnd ? `&banEndDate=${encodeURIComponent(String(banEnd))}` : '');
                    }
                }
            }
            catch {
                // noop
            }
        };

        if (!(sock as any).__notifListenersAttached) {
            sock.on('connect', handleConnect);
            sock.on('disconnect', handleDisconnect);
            sock.on('connect_error', handleConnectError);
            sock.on('reconnect', handleReconnect);
            sock.on('joinedUser', handleJoinedUser);
            sock.on(Events.NOTIFICATION_CREATE, handleNotification);
            (sock as any).onAny?.(handleAny);
            (sock as any).__notifListenersAttached = true;
            debug('attached socket listeners');
        }
        else if (sock.connected) {
            debug('socket already connected');
            handleConnect();
        }

        return () => {
            debug('tearing down socket listeners');
            sock.off('connect', handleConnect);
            sock.off('disconnect', handleDisconnect);
            sock.off('connect_error', handleConnectError);
            sock.off('reconnect', handleReconnect);
            sock.off('joinedUser', handleJoinedUser);
            sock.off(Events.NOTIFICATION_CREATE, handleNotification);
            (sock as any).offAny?.(handleAny);
            (sock as any).__notifListenersAttached = false;
        };
    }, [dispatch, token, user?.id, queryClient, invalidateHandshake, invalidatePost, logout]);

    useEffect(() => {
        const timers = autoActTimers.current;
        const eligible = state.items.filter((item) => item.isRead && !item.isActedOn);
        const eligibleIds = new Set(eligible.map((item) => item.id));

        for (const [id, timer] of Array.from(timers.entries())) {
            if (!eligibleIds.has(id)) {
                clearTimeout(timer);
                timers.delete(id);
                debug('cleared auto-act timer', { id });
            }
        }

        eligible.forEach((item) => {
            if (!timers.has(item.id)) {
                debug('scheduling auto-act timer', { id: item.id });
                const timer = setTimeout(() => {
                    debug('auto-acting notification', { id: item.id });
                    dispatch(markNotificationActed(item.id) as any)
                        .catch((err: unknown) => {
                            console.error('Failed to auto-act notification', err);
                        })
                        .finally(() => {
                            autoActTimers.current.delete(item.id);
                        });
                }, 3 * 60 * 1000);
                timers.set(item.id, timer);
            }
        });
    }, [dispatch, debug, state.items]);

    const value = useMemo<Ctx>(
        () => ({
            state,
            push: (n) =>
                dispatch(
                    pushAction({
                        ...n,
                        isRead: n.isRead ?? false,
                        isActedOn: n.isActedOn ?? false
                    })
                ),
            acknowledgeAll: async () => {
                debug('acknowledgeAll triggered');
                await dispatch(acknowledgeAllThunk() as any);
                // Invalidate notifications history query to update the UI
                queryClient.invalidateQueries({ queryKey: ['notifications', 'history'] });
                debug('acknowledgeAll completed');
            },
            markActed: async (id) => {
                debug('markActed triggered', { id });
                await dispatch(markNotificationActed(id) as any);
                // Invalidate to update the UI
                queryClient.invalidateQueries({ queryKey: ['notifications', 'history'] });
                debug('markActed completed', { id });
            },
            hasNewNotifications,
            clearNewNotifications: () => {
                setHasNewNotifications(false);
                queryClient.invalidateQueries({ queryKey: ['notifications', 'history'] });
            }
        }),
        [debug, dispatch, state, queryClient, hasNewNotifications]
    );

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    );
};

export function useNotifications() {
    const ctx = useContext(NotificationsContext);
    if (!ctx)
        throw new Error(
            'useNotifications must be used inside NotificationsProvider'
        );
    return ctx;
}
