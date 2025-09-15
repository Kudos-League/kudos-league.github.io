import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthState, updateAuth } from '@/redux_store/slices/auth-slice';
import { useAppDispatch } from 'redux_store/hooks';
import { UserDTO } from '@/shared/api/types';
import { isJwt } from '@/shared/constants';
import { setAuthToken } from '@/shared/api/httpClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiMutate, apiGet } from '@/shared/api/apiClient';

const AUTH_STORAGE_KEY = 'web_auth_state';

type AuthContextType = {
    token: string | null;
    authState: AuthState | null;
    user: UserDTO | null;
    name: string;
    isLoggedIn: boolean;
    loading: boolean;
    login: (credentials: {
        username: string;
        password: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
    register: (
        username: string,
        email: string,
        password: string
    ) => Promise<any>;
    updateUser: (updated: Partial<UserDTO>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [authState, setAuthState] = useState<AuthState | null>(null);
    const [userProfile, setUserProfile] = useState<UserDTO | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const dispatch = useAppDispatch();

    const token = authState?.token || null;

    useEffect(() => {
        setAuthToken(token ?? undefined);
    }, [token]);

    const qc = useQueryClient();

    type LoginData = { token: string; user?: { username?: string } };
    type LoginPayload = { username?: string; password?: string; token?: string };

    const loginMutation = useMutation<LoginData, any, LoginPayload>({
        mutationFn: (payload: LoginPayload) => {
            if (payload.token && isJwt(payload.token)) {
                return Promise.resolve({ token: payload.token, user: { username: '' } });
            }
            return apiMutate<LoginData, { username?: string; password?: string }>('/users/login', 'post', { username: payload.username, password: payload.password });
        }
    });

    const registerMutation = useMutation<any, any, { username: string; email: string; password: string }>({
        mutationFn: (payload) => apiMutate('/users/register', 'post', payload)
    });

    const loginHandler = async ({ username, password, token }: { username?: string; password?: string; token?: string; }) => {
        setErrorMessage(null);

        if (!token && (!username || !password)) {
            setErrorMessage('Username and password are required for login.');
            throw new Error('Username and password are required for login.');
        }

        if (token && (username || password)) {
            setErrorMessage('Cannot provide both token and username/password.');
            throw new Error('Cannot provide both token and username/password.');
        }

        try {
            const response = await loginMutation.mutateAsync({ username, password, token });
            const newAuthState: AuthState = {
                token: response.token,
                username: response.user?.username ?? '',
                tokenTimestamp: Date.now()
            };
            setAuthState(newAuthState);
            dispatch(updateAuth(newAuthState));
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuthState));
            setAuthToken(newAuthState.token);
            qc.invalidateQueries({ queryKey: ['user', 'me'] });
        }
        catch (error: any) {
            const message = error?.message || error?.response?.data?.message;
            setErrorMessage(typeof message === 'string' ? message : 'Login failed. Please try again.');
            console.error('Login failed:', error);
            localStorage.removeItem(AUTH_STORAGE_KEY);
            setAuthState(null);
            dispatch(updateAuth({} as any));
            throw error;
        }
    };

    const userQuery = useQuery<UserDTO, any>({
        queryKey: ['user', 'me'],
        queryFn: () => apiGet<UserDTO>('/users/me'),
        enabled: !!token,
        retry: false
    });

    useEffect(() => {
        if (userQuery.data) {
            setUserProfile(userQuery.data);
        }
    }, [userQuery.data]);

    useEffect(() => {
        if (userQuery.isError) {
            console.error('Failed to fetch user profile:', userQuery.error);
            localStorage.removeItem(AUTH_STORAGE_KEY);
            setAuthState(null);
            dispatch(updateAuth({} as any));
        }
    }, [userQuery.isError, userQuery.error]);

    useEffect(() => {
        const bootstrap = async () => {
            setLoading(true);
            try {
                const url = new URL(window.location.href);
                const tok = url.searchParams.get('token');
                const path = url.pathname;

                const isPasswordFlow =
                    path === '/reset-password' || path === '/forgot-password';

                if (tok && !isPasswordFlow) {
                    window.history.replaceState({}, '', path);
                    await loginHandler({ token: tok });
                }

                const stored = localStorage.getItem(AUTH_STORAGE_KEY);
                if (stored && !tok) {
                    const cached = JSON.parse(stored) as AuthState;
                    if (cached.token) {
                        setAuthState(cached);
                        dispatch(updateAuth(cached));
                    }
                }

                if (isJwt(authState?.token ?? '')) {
                    if (!authState?.username && userQuery.data) {
                        const usernameFromData = (userQuery.data as UserDTO).username || '';
                        const patched = { ...authState, username: usernameFromData } as AuthState;
                        setAuthState(patched);
                        dispatch(updateAuth(patched));
                        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(patched));
                    }
                }
            }
            catch (e) {
                console.error('Auth bootstrap failed:', e);
                localStorage.removeItem(AUTH_STORAGE_KEY);
                setAuthState(null);
                dispatch(updateAuth({} as any));
            }
            finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, []);

    const logoutHandler = async () => {
        setAuthState(null);
        setUserProfile(null);
        dispatch(updateAuth({} as any));
        localStorage.removeItem(AUTH_STORAGE_KEY);
    };

    const signUpHandler = async (
        username: string,
        email: string,
        password: string
    ) => {
        try {
            const res = await registerMutation.mutateAsync({ username, email, password });

            if (res?.token) {
                return loginHandler({ username, password });
            }
            else {
                return 'Sign-up successful. Awaiting email verification.';
            }
        }
        catch (error: any) {
            const msg = error?.response?.data?.message || 'Sign-up failed.';
            throw new Error(msg);
        }
    };

    const updateUser = (updated: Partial<UserDTO>) => {
        setUserProfile((prev) => (prev ? { ...prev, ...updated } : prev));
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                authState,
                isLoggedIn: !!userProfile,
                user: userProfile,
                name: userProfile?.displayName ?? userProfile?.username ?? '',
                loading,
                login: loginHandler,
                logout: logoutHandler,
                register: signUpHandler,
                updateUser
            }}
        >
            {children}
            {errorMessage && (
                <div className='fixed bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded shadow'>
                    {errorMessage}
                </div>
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
