import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthState, updateAuth } from '@/redux_store/slices/auth-slice';
import { useAppDispatch } from 'redux_store/hooks';
import { getUserDetails, login, register } from '@/shared/api/actions';
import { UserDTO } from '@/shared/api/types';

// Web storage key
const AUTH_STORAGE_KEY = 'web_auth_state';

type AuthContextType = {
    token: string | null;
    authState: AuthState | null;
    user: UserDTO | null;
    isLoggedIn: boolean;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (
        username: string,
        email: string,
        password: string
    ) => Promise<void>;
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

    const storeTokenAndFetchProfile = async (token: string) => {
        const newAuthState: AuthState = {
            token,
            tokenTimestamp: Date.now(),
            username: ''
        };

        setAuthState(newAuthState);
        dispatch(updateAuth(newAuthState));
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuthState));

        const profile = await getUserDetails(undefined, token);
        setUserProfile(profile);
    };

    const loginHandler = async (username: string, password: string) => {
        setErrorMessage(null);
        if (!username || !password) return null;
        try {
            const response = await login({ username, password });
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
        const initializeAuth = async () => {
            try {
                // Grab token from query param
                const url = new URL(window.location.href);
                let token = url.searchParams.get('token');

                if (token) {
                    window.history.replaceState(
                        {},
                        '',
                        window.location.pathname
                    ); // Clean up URL
                }
                else {
                    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
                    if (stored) {
                        const parsed: AuthState = JSON.parse(stored);
                        token = parsed.token;
                    }
                }

                if (token) {
                    await storeTokenAndFetchProfile(token);
                }
            }
            catch (err) {
                console.error('Failed to initialize auth:', err);
            }
            finally {
                setLoading(false);
            }
        };

        initializeAuth();
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
            await register({ username, email, password });
            await loginHandler(username, password);
        }
        catch (error) {
            throw new Error('Sign-up failed. Please try again.');
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
