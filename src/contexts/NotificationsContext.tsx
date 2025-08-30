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

import { NotificationPayload } from '@/shared/api/types';
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
        dispatch(loadNotifications({ token, limit: 50 }) as any);
    }, [dispatch, token, user?.id]);

    useEffect(() => {
        if (!token) return;

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
    }, [dispatch, token, user?.id]);

    const value = useMemo<Ctx>(
        () => ({
            state,
            push: (n) => dispatch(pushAction(n)),
            markAllRead: async () => {
                if (!token) return;
                await dispatch(markAllReadThunk({ token }) as any);
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
