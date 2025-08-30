import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthState, updateAuth } from '@/redux_store/slices/auth-slice';
import { useAppDispatch } from 'redux_store/hooks';
import { getUserDetails, login, register } from '@/shared/api/actions';
import { UserDTO } from '@/shared/api/types';
import { isJwt } from '@/shared/constants';
import { setAuthToken } from '@/shared/api/httpClient';

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

    setAuthToken(token);

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
            if (token && isJwt(token)) {
                const auth: AuthState = {
                    token,
                    username: '',
                    tokenTimestamp: Date.now()
                };
                setAuthState(auth);
                dispatch(updateAuth(auth));
                localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
                return;
            }

            const response = await login({ username, password, token });
            const newAuthState: AuthState = {
                token: response.data.token,
                username: response.data.user.username,
                tokenTimestamp: Date.now()
            };
            setAuthState(newAuthState);
            dispatch(updateAuth(newAuthState));
            localStorage.setItem(
                AUTH_STORAGE_KEY,
                JSON.stringify(newAuthState)
            );
        }
        catch (error: any) {
            const message = error?.response?.data?.message;
            setErrorMessage(
                typeof message === 'string'
                    ? message
                    : 'Login failed. Please try again.'
            );
            console.error('Login failed:', error);
            localStorage.removeItem(AUTH_STORAGE_KEY);
            setAuthState(null);
            dispatch(updateAuth({} as any));
            throw error;
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                try {
                    const profile = await getUserDetails('me', token);
                    setUserProfile(profile);
                }
                catch (error) {
                    console.error('Failed to fetch user profile:', error);
                    localStorage.removeItem(AUTH_STORAGE_KEY);
                    setAuthState(null);
                    dispatch(updateAuth({} as any));
                }
            }
        };

        fetchUser();
    }, [token]);

    useEffect(() => {
        const bootstrap = async () => {
            setLoading(true);
            try {
                const url = new URL(window.location.href);
                const tok = url.searchParams.get('token');

                if (tok) {
                    window.history.replaceState({}, '', url.pathname);
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
                    const profile = await getUserDetails(
                        'me',
                        authState!.token
                    );
                    setUserProfile(profile);
                    if (!authState!.username) {
                        const patched = {
                            ...authState!,
                            username: profile.username
                        };
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
            const res = await register({ username, email, password });

            if (res.data?.token) {
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
