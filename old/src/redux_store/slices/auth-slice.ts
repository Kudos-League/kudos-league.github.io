import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AUTH_TOKEN_LIFETIME_MS } from "shared/constants";

export type AuthState = {
  token: string|null;
  username: string|null;
  tokenTimestamp: number|null; // In milliseconds since UTC Epoch, i.e. January 1, 1970, 00:00:00 GMT
}

export function isValidAuthState(authState: AuthState|null) {
  return authState?.token && Date.now() - (authState.tokenTimestamp ?? 0) < AUTH_TOKEN_LIFETIME_MS;
}

const initialState = { token: null, username: null, tokenTimestamp: null };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    updateAuth(state: AuthState, action: PayloadAction<AuthState>) {
      state.token = action.payload.token;
      state.username = action.payload.username;
      state.tokenTimestamp = action.payload.tokenTimestamp;
    },
    resetAuthState: () => initialState
  }
})

export const {updateAuth, resetAuthState} = authSlice.actions;
export default authSlice.reducer;