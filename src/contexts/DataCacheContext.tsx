import React, { createContext, useContext, useRef, useCallback, ReactNode } from 'react';
import { apiGet } from '@/shared/api/apiClient';
import type { HandshakeDTO, UserDTO, PostDTO } from '@/shared/api/types';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

interface DataCacheContextType {
    getCachedHandshake: (id: number) => Promise<HandshakeDTO>;
    getCachedUser: (id: number) => Promise<UserDTO>;
    getCachedPost: (id: number) => Promise<PostDTO>;
    clearCache: () => void;
    invalidateHandshake: (id: number) => void;
    invalidatePost: (id: number) => void;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function DataCacheProvider({ children }: { children: ReactNode }) {
    // Use refs instead of state to prevent getCached* functions from being recreated
    const handshakeCacheRef = useRef<Map<number, CacheEntry<HandshakeDTO>>>(new Map());
    const userCacheRef = useRef<Map<number, CacheEntry<UserDTO>>>(new Map());
    const postCacheRef = useRef<Map<number, CacheEntry<PostDTO>>>(new Map());
    const fetchingHandshakesRef = useRef<Map<number, Promise<HandshakeDTO>>>(new Map());
    const fetchingUsersRef = useRef<Map<number, Promise<UserDTO>>>(new Map());
    const fetchingPostsRef = useRef<Map<number, Promise<PostDTO>>>(new Map());

    const getCachedHandshake = useCallback(async (id: number): Promise<HandshakeDTO> => {
        const now = Date.now();
        const cached = handshakeCacheRef.current.get(id);

        // Return cached data if it's still fresh
        if (cached && now - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }

        // If already fetching, return the existing promise to avoid duplicate requests
        const existingFetch = fetchingHandshakesRef.current.get(id);
        if (existingFetch) {
            return existingFetch;
        }

        // Create new fetch promise
        const fetchPromise = apiGet<HandshakeDTO>(`/handshakes/${id}`)
            .then((data) => {
                handshakeCacheRef.current.set(id, { data, timestamp: Date.now() });
                fetchingHandshakesRef.current.delete(id);
                return data;
            })
            .catch((err) => {
                fetchingHandshakesRef.current.delete(id);
                throw err;
            });

        fetchingHandshakesRef.current.set(id, fetchPromise);

        return fetchPromise;
    }, []);

    const getCachedUser = useCallback(async (id: number): Promise<UserDTO> => {
        const now = Date.now();
        const cached = userCacheRef.current.get(id);

        // Return cached data if it's still fresh
        if (cached && now - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }

        // If already fetching, return the existing promise to avoid duplicate requests
        const existingFetch = fetchingUsersRef.current.get(id);
        if (existingFetch) {
            return existingFetch;
        }

        // Create new fetch promise
        const fetchPromise = apiGet<UserDTO>(`/users/${id}`)
            .then((data) => {
                userCacheRef.current.set(id, { data, timestamp: Date.now() });
                fetchingUsersRef.current.delete(id);
                return data;
            })
            .catch((err) => {
                fetchingUsersRef.current.delete(id);
                throw err;
            });

        fetchingUsersRef.current.set(id, fetchPromise);

        return fetchPromise;
    }, []);

    const getCachedPost = useCallback(async (id: number): Promise<PostDTO> => {
        const now = Date.now();
        const cached = postCacheRef.current.get(id);

        // Return cached data if it's still fresh
        if (cached && now - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }

        // If already fetching, return the existing promise to avoid duplicate requests
        const existingFetch = fetchingPostsRef.current.get(id);
        if (existingFetch) {
            return existingFetch;
        }

        // Create new fetch promise
        const fetchPromise = apiGet<PostDTO>(`/posts/${id}`)
            .then((data) => {
                postCacheRef.current.set(id, { data, timestamp: Date.now() });
                fetchingPostsRef.current.delete(id);
                return data;
            })
            .catch((err) => {
                fetchingPostsRef.current.delete(id);
                throw err;
            });

        fetchingPostsRef.current.set(id, fetchPromise);

        return fetchPromise;
    }, []);

    const clearCache = useCallback(() => {
        handshakeCacheRef.current = new Map();
        userCacheRef.current = new Map();
        postCacheRef.current = new Map();
        fetchingHandshakesRef.current = new Map();
        fetchingUsersRef.current = new Map();
        fetchingPostsRef.current = new Map();
    }, []);

    const invalidateHandshake = useCallback((id: number) => {
        handshakeCacheRef.current.delete(id);
        fetchingHandshakesRef.current.delete(id);
    }, []);

    const invalidatePost = useCallback((id: number) => {
        postCacheRef.current.delete(id);
        fetchingPostsRef.current.delete(id);
    }, []);

    return (
        <DataCacheContext.Provider value={{ getCachedHandshake, getCachedUser, getCachedPost, clearCache, invalidateHandshake, invalidatePost }}>
            {children}
        </DataCacheContext.Provider>
    );
}

export function useDataCache() {
    const context = useContext(DataCacheContext);
    if (!context) {
        throw new Error('useDataCache must be used within a DataCacheProvider');
    }
    return context;
}

// Custom hooks for easier use
export function useCachedHandshake(id: number | undefined) {
    const { getCachedHandshake } = useDataCache();
    const [handshake, setHandshake] = React.useState<HandshakeDTO | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);
    const prevIdRef = React.useRef<number | undefined>(undefined);
    const hasDataRef = React.useRef(false);

    React.useEffect(() => {
        if (!id) {
            setLoading(false);
            setHandshake(null);
            hasDataRef.current = false;
            prevIdRef.current = undefined;
            return;
        }

        // Only show loading state if:
        // 1. We don't have any data yet (initial load), OR
        // 2. The ID changed (different handshake)
        const isIdChange = prevIdRef.current !== undefined && prevIdRef.current !== id;

        if (isIdChange) {
            // ID changed, reset everything and show loading
            setLoading(true);
            setHandshake(null);
            setError(false);
            hasDataRef.current = false;
        }
        else if (!hasDataRef.current) {
            // First load, show loading
            setLoading(true);
        }
        // Otherwise, keep existing data visible during refetch

        prevIdRef.current = id;

        getCachedHandshake(id)
            .then((data) => {
                setHandshake(data);
                setError(false);
                setLoading(false);
                hasDataRef.current = true;
            })
            .catch((err) => {
                console.error('Failed to fetch handshake:', err);
                setError(true);
                setLoading(false);
            });
    }, [id, getCachedHandshake]);

    return { handshake, loading, error };
}

export function useCachedUser(id: number | undefined) {
    const { getCachedUser } = useDataCache();
    const [user, setUser] = React.useState<UserDTO | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);
    const prevIdRef = React.useRef<number | undefined>(undefined);
    const hasDataRef = React.useRef(false);

    React.useEffect(() => {
        if (!id) {
            setLoading(false);
            setUser(null);
            hasDataRef.current = false;
            prevIdRef.current = undefined;
            return;
        }

        // Only show loading state if:
        // 1. We don't have any data yet (initial load), OR
        // 2. The ID changed (different user)
        const isIdChange = prevIdRef.current !== undefined && prevIdRef.current !== id;

        if (isIdChange) {
            // ID changed, reset everything and show loading
            setLoading(true);
            setUser(null);
            setError(false);
            hasDataRef.current = false;
        }
        else if (!hasDataRef.current) {
            // First load, show loading
            setLoading(true);
        }
        // Otherwise, keep existing data visible during refetch

        prevIdRef.current = id;

        getCachedUser(id)
            .then((data) => {
                setUser(data);
                setError(false);
                setLoading(false);
                hasDataRef.current = true;
            })
            .catch((err) => {
                console.error('Failed to fetch user:', err);
                setError(true);
                setLoading(false);
            });
    }, [id, getCachedUser]);

    return { user, loading, error };
}

export function useCachedPost(id: number | undefined) {
    const { getCachedPost } = useDataCache();
    const [post, setPost] = React.useState<PostDTO | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);
    const prevIdRef = React.useRef<number | undefined>(undefined);
    const hasDataRef = React.useRef(false);

    React.useEffect(() => {
        if (!id) {
            setLoading(false);
            setPost(null);
            hasDataRef.current = false;
            prevIdRef.current = undefined;
            return;
        }

        // Only show loading state if:
        // 1. We don't have any data yet (initial load), OR
        // 2. The ID changed (different post)
        const isIdChange = prevIdRef.current !== undefined && prevIdRef.current !== id;

        if (isIdChange) {
            // ID changed, reset everything and show loading
            setLoading(true);
            setPost(null);
            setError(false);
            hasDataRef.current = false;
        }
        else if (!hasDataRef.current) {
            // First load, show loading
            setLoading(true);
        }
        // Otherwise, keep existing data visible during refetch

        prevIdRef.current = id;

        getCachedPost(id)
            .then((data) => {
                setPost(data);
                setError(false);
                setLoading(false);
                hasDataRef.current = true;
            })
            .catch((err) => {
                console.error('Failed to fetch post:', err);
                setError(true);
                setLoading(false);
            });
    }, [id, getCachedPost]);

    return { post, loading, error };
}
