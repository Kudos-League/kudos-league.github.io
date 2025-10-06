import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { NotificationRecord, NotificationType } from '@/shared/api/types';
import { apiGet, apiMutate } from '@/shared/api/apiClient';

type Key = string;
const keyFallback = (n: NotificationRecord) => {
    const ts = (n as any).createdAt ?? '';
    switch (n.type) {
    case NotificationType.DIRECT_MESSAGE:
        return `dm:${n.message?.id ?? 'unknown'}:${ts}`;
    case NotificationType.POST_REPLY:
        return `post:${'postID' in n ? n.postID : 'unknown'}:${ts}`;
    default:
        return `${(n as any).type}:${JSON.stringify(n)}:${ts}`;
    }
};

const keyOf = (n: NotificationRecord): Key =>
    n.id != null ? `id:${n.id}` : keyFallback(n);

const dedupe = (
    existing: NotificationRecord[],
    incoming: NotificationRecord[]
) => {
    const merged = new Map<Key, NotificationRecord>();

    for (const item of existing) {
        merged.set(keyOf(item), item);
    }

    for (const item of incoming) {
        const key = keyOf(item);
        const prev = merged.get(key);
        merged.set(key, prev ? { ...prev, ...item } : item);
    }

    return Array.from(merged.values()).sort((a, b) => {
        const aTime = new Date((a as any).createdAt ?? 0).getTime();
        const bTime = new Date((b as any).createdAt ?? 0).getTime();
        return bTime - aTime;
    });
};

export const loadNotifications = createAsyncThunk<
    NotificationRecord[],
    { limit?: number }
>('notifications/load', async ({ limit = 50 } = {}) => {
    const list = await apiGet<NotificationRecord[]>('/notifications', {
        params: { limit }
    });
    return list as NotificationRecord[];
});

export const acknowledgeAll = createAsyncThunk<void>(
    'notifications/acknowledgeAll',
    async () => {
        await apiMutate('/notifications/mark-all-read', 'post');
    }
);

export const markNotificationActed = createAsyncThunk<number, number>(
    'notifications/markNotificationActed',
    async (notificationID) => {
        await apiMutate(`/notifications/${notificationID}/acted`, 'post');
        return notificationID;
    }
);

type NotificationsState = {
    items: NotificationRecord[];
    unread: number;
    loaded: boolean;
    error?: string;
};

const initialState: NotificationsState = {
    items: [],
    unread: 0,
    loaded: false
};

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        pushOne(state, action: PayloadAction<NotificationRecord>) {
            state.items = dedupe(state.items, [action.payload]);
            state.unread = state.items.filter((n) => !n.isRead).length;
        },
        setAll(state, action: PayloadAction<NotificationRecord[]>) {
            state.items = dedupe([], action.payload);
            state.loaded = true;
            state.unread = state.items.filter((n) => !n.isRead).length;
        },
        clearAll(state) {
            state.items = [];
            state.unread = 0;
            state.loaded = true;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadNotifications.fulfilled, (state, action) => {
                state.items = dedupe(state.items, action.payload);
                state.loaded = true;
                state.unread = state.items.filter((n) => !n.isRead).length;
                state.error = undefined;
            })
            .addCase(loadNotifications.rejected, (state, action) => {
                state.loaded = true;
                state.error = action.error.message;
            })
            .addCase(acknowledgeAll.fulfilled, (state) => {
                state.items = state.items.map((item) => ({ ...item, isRead: true }));
                state.unread = 0;
            })
            .addCase(markNotificationActed.fulfilled, (state, action) => {
                state.items = state.items.filter((item) => item.id !== action.payload);
                state.unread = state.items.filter((n) => !n.isRead).length;
            });
    }
});

export const { pushOne, setAll, clearAll } = notificationsSlice.actions;

export const selectNotifications = (s: RootState) => s.notifications.items;
export const selectNotificationsLoaded = (s: RootState) =>
    s.notifications.loaded;
export const selectNotificationsUnread = (s: RootState) =>
    s.notifications.unread;

export default notificationsSlice.reducer;
