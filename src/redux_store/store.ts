import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/auth-slice';
import notificationsReducer from './slices/notifications.slice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        notifications: notificationsReducer
    }
});

export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
