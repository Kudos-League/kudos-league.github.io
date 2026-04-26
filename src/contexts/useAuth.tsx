import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthState, updateAuth } from '@/redux_store/slices/auth-slice';
import { useAppDispatch } from 'redux_store/hooks';
import { UserDTO } from '@/shared/api/types';
import { isJwt } from '@/shared/constants';
import { setAuthToken } from '@/shared/api/httpClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiMutate, apiGet } from '@/shared/api/apiClient';
import { clearAlerts } from '@/components/common/alertBus';

const AUTH_STORAGE_KEY = 'web_auth_state';

type AuthContextType = {
    token: string | null;
    authState: AuthState | null;
    masquerade: AuthState['masquerade'] | null;
    user: UserDTO | null;
    name: string;
    isLoggedIn: boolean;
    loading: boolean;
    login: (credentials: {
        username: string;
        password: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
    startMasquerade: (targetUserID: number, reason?: string) => Promise<void>;
    stopMasquerade: () => Promise<void>;
    register: (
        username: string,
        email: string,
        password: string,
        inviteToken: string,
        emailToken?: string
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

    const clearSessionCaches = React.useCallback(async () => {
        try {
            await qc.cancelQueries({ predicate: () => true });
            qc.removeQueries({ predicate: () => true });
        }
        catch (err) {
            console.warn('Failed to clear session cache:', err);
        }
    }, [qc]);

    type LoginData = { token: string; user?: { username?: string } };
    type MasqueradeStartResponse = {
        token: string;
        user: UserDTO;
        masquerade: {
            adminUserID: number;
            targetUserID: number;
            auditID: number;
            startedAt?: string;
        };
    };
    type LoginPayload = {
        username?: string;
        password?: string;
        token?: string;
    };

    const loginMutation = useMutation<LoginData, any, LoginPayload>({
        mutationFn: (payload: LoginPayload) => {
            if (payload.token && isJwt(payload.token)) {
                return Promise.resolve({
                    token: payload.token,
                    user: { username: '' }
                });
            }

            if (payload.token) {
                return apiMutate<LoginData, { token: string }>(
                    '/users/login',
                    'post',
                    { token: payload.token }
                );
            }

            return apiMutate<
                LoginData,
                { username?: string; password?: string }
            >('/users/login', 'post', {
                username: payload.username,
                password: payload.password
            });
        }
    });

    const registerMutation = useMutation<
        any,
        any,
        {
            username: string;
            email: string;
            password: string;
            inviteToken: string;
            emailToken?: string;
        }
    >({
        mutationFn: (payload) => apiMutate('/users/register', 'post', payload)
    });

    const loginHandler = async ({
        username,
        password,
        token
    }: {
        username?: string;
        password?: string;
        token?: string;
    }) => {
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
            const response = await loginMutation.mutateAsync({
                username,
                password,
                token
            });
            const newAuthState: AuthState = {
                token: response.token,
                username: response.user?.username ?? '',
                tokenTimestamp: Date.now(),
                masquerade: null
            };
            setAuthState(newAuthState);
            dispatch(updateAuth(newAuthState));
            localStorage.setItem(
                AUTH_STORAGE_KEY,
                JSON.stringify(newAuthState)
            );
            setAuthToken(newAuthState.token);
            await clearSessionCaches();
            try {
                await qc.fetchQuery({
                    queryKey: ['user', 'me'],
                    queryFn: () => apiGet<UserDTO>('/users/me')
                });
                const cached = qc.getQueryData<UserDTO>(['user', 'me']);
                if (cached) setUserProfile(cached);
            }
            catch (e) {
                console.warn('Failed to fetch profile after login:', e);
                setUserProfile(null);
            }
        }
        catch (error: any) {
            let message = 'Login failed. Please try again.';
            if (Array.isArray(error) && error.length)
                message = String(error[0]);
            else if (typeof error === 'string') message = error;
            else if (error?.response?.data?.message)
                message = error.response.data.message;
            else if (error?.message) message = error.message;

            setErrorMessage(message);
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
            console.log('[AUTH DEBUG] Bootstrap starting...');
            setLoading(true);
            try {
                const url = new URL(window.location.href);
                const tokenFromQuery = url.searchParams.get('token');
                const pathName = url.pathname;

                const isPasswordFlow =
                    pathName === '/reset-password' ||
                    pathName === '/forgot-password';

                if (tokenFromQuery && !isPasswordFlow) {
                    console.log('[AUTH DEBUG] Found token in query params');
                    try {
                        await loginHandler({ token: tokenFromQuery });
                        url.searchParams.delete('token');
                        const remainingSearch = url.searchParams.toString();
                        const nextUrl = remainingSearch
                            ? `${pathName}?${remainingSearch}`
                            : pathName;
                        window.history.replaceState({}, '', nextUrl);
                    }
                    catch (err) {
                        console.error('Token login failed:', err);
                    }
                }

                const stored = localStorage.getItem(AUTH_STORAGE_KEY);
                console.log(
                    '[AUTH DEBUG] Checking localStorage, found:',
                    !!stored
                );
                if (stored) {
                    const cached = JSON.parse(stored) as AuthState;
                    if (cached.token) {
                        console.log(
                            '[AUTH DEBUG] Setting auth state from localStorage'
                        );
                        setAuthState(cached);
                        dispatch(updateAuth(cached));
                    }
                }

                if (isJwt(authState?.token ?? '')) {
                    if (!authState?.username && userQuery.data) {
                        const usernameFromData =
                            (userQuery.data as UserDTO).username || '';
                        const patched = {
                            ...authState,
                            username: usernameFromData
                        } as AuthState;
                        setAuthState(patched);
                        dispatch(updateAuth(patched));
                        localStorage.setItem(
                            AUTH_STORAGE_KEY,
                            JSON.stringify(patched)
                        );
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
                console.log(
                    '[AUTH DEBUG] Bootstrap finished, setting loading to false'
                );
                setLoading(false);
            }
        };

        bootstrap();
    }, []);

    const logoutHandler = async () => {
        if (authState?.masquerade?.active) {
            try {
                await apiMutate<{ success: boolean }, undefined>(
                    '/users/masquerade/stop',
                    'post'
                );
            }
            catch (err) {
                console.warn('Failed to record masquerade stop:', err);
            }
        }

        setAuthState(null);
        setUserProfile(null);
        dispatch(updateAuth({} as any));
        localStorage.removeItem(AUTH_STORAGE_KEY);
        await clearSessionCaches();
        clearAlerts();
    };

    const signUpHandler = async (
        username: string,
        email: string,
        password: string,
        inviteToken: string,
        emailToken?: string
    ) => {
        if (!inviteToken) {
            throw new Error('Invite token is required.');
        }
        try {
            const payload: any = { username, email, password, inviteToken };
            if (emailToken) {
                payload.emailToken = emailToken;
            }
            const res = await registerMutation.mutateAsync(payload);

            if (res?.token) {
                return loginHandler({ username, password });
            }
            else {
                return 'Sign-up successful. Awaiting email verification.';
            }
        }
        catch (error: any) {
            let msg = 'Sign-up failed.';
            if (Array.isArray(error) && error.length) msg = String(error[0]);
            else if (typeof error === 'string') msg = error;
            else if (error?.response?.data?.message)
                msg = error.response.data.message;
            else if (error?.message) msg = error.message;

            throw new Error(msg);
        }
    };

    const startMasquerade = async (targetUserID: number, reason?: string) => {
        if (!token || !userProfile?.admin) {
            throw new Error('Admin session required.');
        }

        const response = await apiMutate<
            MasqueradeStartResponse,
            { targetUserID: number; reason?: string }
        >('/admin/masquerade/start', 'post', { targetUserID, reason });

        const newAuthState: AuthState = {
            token: response.token,
            username: response.user?.username ?? '',
            tokenTimestamp: Date.now(),
            masquerade: {
                active: true,
                originalToken: token,
                originalAdmin: userProfile,
                targetUser: response.user,
                startedAt: response.masquerade?.startedAt,
                auditID: response.masquerade.auditID
            }
        };

        setAuthState(newAuthState);
        dispatch(updateAuth(newAuthState));
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuthState));
        setAuthToken(newAuthState.token);
        await clearSessionCaches();

        try {
            const fetched = await qc.fetchQuery({
                queryKey: ['user', 'me'],
                queryFn: () => apiGet<UserDTO>('/users/me')
            });
            setUserProfile(fetched ?? response.user);
        }
        catch (err) {
            console.warn('Failed to fetch masquerade profile:', err);
            setUserProfile(response.user);
        }
    };

    const stopMasquerade = async () => {
        const currentMasquerade = authState?.masquerade;
        if (!currentMasquerade?.active) return;

        try {
            await apiMutate<{ success: boolean }, undefined>(
                '/users/masquerade/stop',
                'post'
            );
        }
        catch (err) {
            console.warn('Failed to record masquerade stop:', err);
        }

        const restoredAuthState: AuthState = {
            token: currentMasquerade.originalToken,
            username: currentMasquerade.originalAdmin?.username ?? '',
            tokenTimestamp: Date.now(),
            masquerade: null
        };

        setAuthState(restoredAuthState);
        dispatch(updateAuth(restoredAuthState));
        localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify(restoredAuthState)
        );
        setAuthToken(restoredAuthState.token);
        await clearSessionCaches();

        try {
            const fetched = await qc.fetchQuery({
                queryKey: ['user', 'me'],
                queryFn: () => apiGet<UserDTO>('/users/me')
            });
            setUserProfile(fetched ?? currentMasquerade.originalAdmin);
        }
        catch (err) {
            console.warn('Failed to fetch restored admin profile:', err);
            setUserProfile(currentMasquerade.originalAdmin);
        }
    };

    const updateUser = (updated: Partial<UserDTO>) => {
        setUserProfile((prev) => (prev ? { ...prev, ...updated } : prev));
    };

    // Keep loading true until we have both token AND user profile (or confirmed no token)
    const isActuallyLoading =
        loading || (!!token && (!userProfile || userQuery.isLoading));

    // Debug logging
    useEffect(() => {
        console.log('[AUTH DEBUG]', {
            loading,
            isActuallyLoading,
            hasToken: !!token,
            hasUserProfile: !!userProfile,
            isLoggedIn: !!userProfile,
            userQueryIsLoading: userQuery.isLoading,
            userQueryIsError: userQuery.isError,
            userQueryData: !!userQuery.data
        });
    }, [
        loading,
        isActuallyLoading,
        token,
        userProfile,
        userQuery.isLoading,
        userQuery.isError,
        userQuery.data
    ]);

    return (
        <AuthContext.Provider
            value={{
                token,
                authState,
                masquerade: authState?.masquerade ?? null,
                isLoggedIn: !!userProfile,
                user: userProfile,
                name: userProfile?.displayName ?? userProfile?.username ?? '',
                loading: isActuallyLoading,
                login: loginHandler,
                logout: logoutHandler,
                startMasquerade,
                stopMasquerade,
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
