import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AUTH_TOKEN_LIFETIME_MS } from '@/shared/constants';

export type AuthState = {
    token: string | null;
    username: string | null;
    tokenTimestamp: number | null;
    masquerade?: {
        active: true;
        originalToken: string;
        originalAdmin: any;
        targetUser: any;
        startedAt?: string;
        auditID: number;
    } | null;
};

export function isValidAuthState(authState: AuthState | null) {
    return (
        authState?.token &&
        Date.now() - (authState.tokenTimestamp ?? 0) < AUTH_TOKEN_LIFETIME_MS
    );
}

const initialState: AuthState = {
    token: null,
    username: null,
    tokenTimestamp: null,
    masquerade: null
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        updateAuth(state: AuthState, action: PayloadAction<AuthState>) {
            state.token = action.payload.token;
            state.username = action.payload.username;
            state.tokenTimestamp = action.payload.tokenTimestamp;
            state.masquerade = action.payload.masquerade ?? null;
        },
        resetAuthState: () => initialState
    }
});

export const { updateAuth, resetAuthState } = authSlice.actions;
export default authSlice.reducer;
