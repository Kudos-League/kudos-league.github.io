import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function DataCacheProvider({ children }: { children: ReactNode }) {
    const [handshakeCache, setHandshakeCache] = useState<Map<number, CacheEntry<HandshakeDTO>>>(new Map());
    const [userCache, setUserCache] = useState<Map<number, CacheEntry<UserDTO>>>(new Map());
    const [postCache, setPostCache] = useState<Map<number, CacheEntry<PostDTO>>>(new Map());
    const [fetchingHandshakes, setFetchingHandshakes] = useState<Map<number, Promise<HandshakeDTO>>>(new Map());
    const [fetchingUsers, setFetchingUsers] = useState<Map<number, Promise<UserDTO>>>(new Map());
    const [fetchingPosts, setFetchingPosts] = useState<Map<number, Promise<PostDTO>>>(new Map());

    const getCachedHandshake = useCallback(async (id: number): Promise<HandshakeDTO> => {
        const now = Date.now();
        const cached = handshakeCache.get(id);

        // Return cached data if it's still fresh
        if (cached && now - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }

        // If already fetching, return the existing promise to avoid duplicate requests
        const existingFetch = fetchingHandshakes.get(id);
        if (existingFetch) {
            return existingFetch;
        }

        // Create new fetch promise
        const fetchPromise = apiGet<HandshakeDTO>(`/handshakes/${id}`)
            .then((data) => {
                setHandshakeCache((prev) => {
                    const newCache = new Map(prev);
                    newCache.set(id, { data, timestamp: Date.now() });
                    return newCache;
                });
                setFetchingHandshakes((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(id);
                    return newMap;
                });
                return data;
            })
            .catch((err) => {
                setFetchingHandshakes((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(id);
                    return newMap;
                });
                throw err;
            });

        setFetchingHandshakes((prev) => {
            const newMap = new Map(prev);
            newMap.set(id, fetchPromise);
            return newMap;
        });

        return fetchPromise;
    }, [handshakeCache, fetchingHandshakes]);

    const getCachedUser = useCallback(async (id: number): Promise<UserDTO> => {
        const now = Date.now();
        const cached = userCache.get(id);

        // Return cached data if it's still fresh
        if (cached && now - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }

        // If already fetching, return the existing promise to avoid duplicate requests
        const existingFetch = fetchingUsers.get(id);
        if (existingFetch) {
            return existingFetch;
        }

        // Create new fetch promise
        const fetchPromise = apiGet<UserDTO>(`/users/${id}`)
            .then((data) => {
                setUserCache((prev) => {
                    const newCache = new Map(prev);
                    newCache.set(id, { data, timestamp: Date.now() });
                    return newCache;
                });
                setFetchingUsers((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(id);
                    return newMap;
                });
                return data;
            })
            .catch((err) => {
                setFetchingUsers((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(id);
                    return newMap;
                });
                throw err;
            });

        setFetchingUsers((prev) => {
            const newMap = new Map(prev);
            newMap.set(id, fetchPromise);
            return newMap;
        });

        return fetchPromise;
    }, [userCache, fetchingUsers]);

    const getCachedPost = useCallback(async (id: number): Promise<PostDTO> => {
        const now = Date.now();
        const cached = postCache.get(id);

        // Return cached data if it's still fresh
        if (cached && now - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }

        // If already fetching, return the existing promise to avoid duplicate requests
        const existingFetch = fetchingPosts.get(id);
        if (existingFetch) {
            return existingFetch;
        }

        // Create new fetch promise
        const fetchPromise = apiGet<PostDTO>(`/posts/${id}`)
            .then((data) => {
                setPostCache((prev) => {
                    const newCache = new Map(prev);
                    newCache.set(id, { data, timestamp: Date.now() });
                    return newCache;
                });
                setFetchingPosts((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(id);
                    return newMap;
                });
                return data;
            })
            .catch((err) => {
                setFetchingPosts((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(id);
                    return newMap;
                });
                throw err;
            });

        setFetchingPosts((prev) => {
            const newMap = new Map(prev);
            newMap.set(id, fetchPromise);
            return newMap;
        });

        return fetchPromise;
    }, [postCache, fetchingPosts]);

    const clearCache = useCallback(() => {
        setHandshakeCache(new Map());
        setUserCache(new Map());
        setPostCache(new Map());
        setFetchingHandshakes(new Map());
        setFetchingUsers(new Map());
        setFetchingPosts(new Map());
    }, []);

    return (
        <DataCacheContext.Provider value={{ getCachedHandshake, getCachedUser, getCachedPost, clearCache }}>
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

    React.useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        getCachedHandshake(id)
            .then((data) => {
                setHandshake(data);
                setError(false);
            })
            .catch((err) => {
                console.error('Failed to fetch handshake:', err);
                setError(true);
            })
            .finally(() => {
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

    React.useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        getCachedUser(id)
            .then((data) => {
                setUser(data);
                setError(false);
            })
            .catch((err) => {
                console.error('Failed to fetch user:', err);
                setError(true);
            })
            .finally(() => {
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

    React.useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        getCachedPost(id)
            .then((data) => {
                setPost(data);
                setError(false);
            })
            .catch((err) => {
                console.error('Failed to fetch post:', err);
                setError(true);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id, getCachedPost]);

    return { post, loading, error };
}
