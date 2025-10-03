import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from 'redux_store/store';

import {
    pushOne as pushAction,
    loadNotifications,
    markAllRead as markAllReadThunk
} from 'redux_store/slices/notifications.slice';

import { NotificationPayload, NotificationType } from '@/shared/api/types';
import { pushAlert } from '@/components/common/alertBus';
import { useAuth } from '@/contexts/useAuth';
import { getSocket } from '@/hooks/useWebsocketClient';
import { Events } from '@/shared/constants';

type Ctx = {
    state: { items: NotificationPayload[]; unread: number; loaded: boolean };
    push: (n: NotificationPayload) => void;
    markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<Ctx | null>(null);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
    children
}) => {
    const dispatch = useDispatch();
    const state = useSelector((s: RootState) => s.notifications);
    const { user, token } = useAuth();

    const joinedUserId = useRef<number | null>(null);
    const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

    useEffect(() => {
        if (!token || !user?.id) return;
        dispatch(loadNotifications({ limit: 50 }) as any);
    }, [dispatch, token, user?.id]);

    useEffect(() => {
        if (!token) {
            if (socketRef.current && joinedUserId.current != null) {
                socketRef.current.emit('leaveUser', { userID: joinedUserId.current });
            }
            joinedUserId.current = null;
            socketRef.current = null;
            return;
        }

        const sock = getSocket(token);
        socketRef.current = sock;

        const handleConnect = () => {
            if (user?.id != null && joinedUserId.current !== user.id) {
                if (joinedUserId.current != null)
                    sock.emit('leaveUser', { userID: joinedUserId.current });
                sock.emit('joinUser', { userID: user.id });
                joinedUserId.current = user.id;
            }
        };

        const handleNotification = (n: NotificationPayload) => {
            dispatch(pushAction(n));

            try {
                if (n.type === 'direct-message') {
                    const author = n.message?.author?.username || 'Someone';
                    const text = n.message?.content || '';
                    pushAlert({ type: 'info', message: `New DM from ${author}: ${text}` });
                }
                else if (n.type === 'post-reply') {
                    const text = n.message?.content || '';
                    pushAlert({ type: 'info', message: `New reply on your post: ${text}` });
                }
                else if (n.type === 'past-gift') {
                    pushAlert({ type: 'info', message: `Past gift logged on your profile.` });
                }
                else if (n.type === 'post-auto-close') {
                    const when = (n as any).closedAt || (n as any).closeAt;
                    const msg = when
                        ? `Post #${(n as any).postID} auto-close (${new Date(when).toLocaleString()})`
                        : `Post #${(n as any).postID} auto-close`; 
                    pushAlert({ type: 'warning', message: msg });
                }
                else if (n.type === NotificationType.BUG_REPORT) {
                    pushAlert({ type: 'info', message: 'New bug report submitted.' });
                }
                else if (n.type === NotificationType.SITE_FEEDBACK) {
                    pushAlert({ type: 'info', message: 'New site feedback submitted.' });
                }
            }
            catch {
                // noop
            }
        };

        if (!(sock as any).__notifListenersAttached) {
            sock.on('connect', handleConnect);
            sock.on(Events.NOTIFICATION_CREATE, handleNotification);
            sock.on('notification', handleNotification);
            (sock as any).__notifListenersAttached = true;
        }
        else if (sock.connected) {
            handleConnect();
        }

        return () => {
            sock.off('connect', handleConnect);
            sock.off(Events.NOTIFICATION_CREATE, handleNotification);
            sock.off('notification', handleNotification);
            if (joinedUserId.current != null) {
                sock.emit('leaveUser', { userID: joinedUserId.current });
                joinedUserId.current = null;
            }
        };
    }, [dispatch, token, user?.id]);

    const value = useMemo<Ctx>(
        () => ({
            state,
            push: (n) => dispatch(pushAction(n)),
            markAllRead: async () => {
                await dispatch(markAllReadThunk() as any);
            }
        }),
        [dispatch, state, token]
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
