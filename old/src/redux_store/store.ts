import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/auth-slice";
import postsReducer from "./slices/posts-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
  },
});

export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
