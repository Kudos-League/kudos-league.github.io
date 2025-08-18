import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { NotificationPayload, NotificationType } from '@/shared/api/types';
import { fetchNotifications, markAllNotificationsRead } from '@/shared/api/actions';

type Key = string;
const keyOf = (n: NotificationPayload): Key => {
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

const dedupe = (existing: NotificationPayload[], incoming: NotificationPayload[]) => {
    const seen = new Set(existing.map(keyOf));
    const fresh = incoming.filter(n => !seen.has(keyOf(n)));
    return [...fresh, ...existing];
};

export const loadNotifications = createAsyncThunk<
  NotificationPayload[],
  { token: string; limit?: number }
>('notifications/load', async ({ token, limit = 50 }) => {
    const list = await fetchNotifications(token, limit);
    return list as NotificationPayload[];
});

export const markAllRead = createAsyncThunk<void, { token: string }>(
    'notifications/markAllRead',
    async ({ token }) => {
        await markAllNotificationsRead(token);
    }
);

type NotificationsState = {
  items: NotificationPayload[];
  unread: number;
  loaded: boolean;
  error?: string;
};

const initialState: NotificationsState = {
    items: [],
    unread: 0,
    loaded: false,
};

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        pushOne(state, action: PayloadAction<NotificationPayload>) {
            state.items = dedupe(state.items, [action.payload]);
            state.unread += 1;
        },
        setAll(state, action: PayloadAction<NotificationPayload[]>) {
            state.items = action.payload;
            state.loaded = true;
            state.unread = action.payload.length;
        },
        clearAll(state) {
            state.items = [];
            state.unread = 0;
            state.loaded = true;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(loadNotifications.fulfilled, (state, action) => {
                state.items = dedupe(state.items, action.payload);
                state.loaded = true;
                state.unread = state.items.length;
                state.error = undefined;
            })
            .addCase(loadNotifications.rejected, (state, action) => {
                state.loaded = true;
                state.error = action.error.message;
            })
            .addCase(markAllRead.fulfilled, state => {
                state.items = [];
                state.unread = 0;
            });
    },
});

export const { pushOne, setAll, clearAll } = notificationsSlice.actions;

export const selectNotifications = (s: RootState) => s.notifications.items;
export const selectNotificationsLoaded = (s: RootState) => s.notifications.loaded;
export const selectNotificationsUnread = (s: RootState) => s.notifications.unread;

export default notificationsSlice.reducer;