import React from 'react';
import { useAuth } from '@/contexts/useAuth';
import { apiGet, apiMutate } from '@/shared/api/apiClient';
import queryClient from '@/shared/api/client';
import { UserSettingsDTO } from '@/shared/api/types';

type UseBlockedUsersContext = {
    blockedUsers: number[] | null;
    loading: boolean;
    refresh: () => Promise<void>;
    block: (userId: number) => Promise<void>;
    unblock: (userId: number) => Promise<void>;
};

const Context = React.createContext<UseBlockedUsersContext | null>(null);

export const BlockedUsersProvider: React.FC<
    React.PropsWithChildren<object>
> = ({ children }) => {
    const { user } = useAuth();
    const [blockedUsers, setBlockedUsers] = React.useState<number[]>([]);
    const [loading, setLoading] = React.useState<boolean>(false);

    const refresh = React.useCallback(async () => {
        if (!user) {
            setBlockedUsers([]);
            return;
        }
        setLoading(true);
        try {
            const res = await apiGet<UserSettingsDTO>('/usersettings/me');
            const list = res?.blockedUsers ?? [];
            setBlockedUsers(Array.isArray(list) ? list : []);
        }
        catch (err) {
            setBlockedUsers([]);
        }
        finally {
            setLoading(false);
        }
    }, [user]);

    React.useEffect(() => {
        let mounted = true;
        if (!user) {
            setBlockedUsers([]);
            return;
        }
        (async () => {
            setLoading(true);
            try {
                const res = await apiGet<UserSettingsDTO>('/usersettings/me');
                if (!mounted) return;
                const list = res?.blockedUsers ?? [];
                setBlockedUsers(Array.isArray(list) ? list : []);
            }
            catch (err) {
                if (!mounted) return;
                setBlockedUsers([]);
            }
            finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [user]);

    const block = React.useCallback(
        async (userId: number) => {
            if (!user) throw new Error('Not authenticated');
            setBlockedUsers((prev) =>
                prev
                    ? prev.includes(userId)
                        ? prev
                        : [...prev, userId]
                    : [userId]
            );
            try {
                await apiMutate(`/usersettings/${userId}/block`, 'patch');
                try {
                    queryClient.removeQueries({
                        predicate: (query) => {
                            const k = query.queryKey;
                            if (!Array.isArray(k) || k.length === 0)
                                return false;
                            const first = k[0];
                            if (typeof first !== 'string') return false;
                            return [
                                'posts',
                                'events',
                                'channels',
                                'channel',
                                'kudos-history',
                                'handshakes'
                            ].includes(first);
                        }
                    });
                }
                catch (err) {
                    console.warn('Failed to clear caches after block:', err);
                }
            }
            catch (err) {
                setBlockedUsers((prev) =>
                    prev ? prev.filter((id) => id !== userId) : []
                );
                throw err;
            }
        },
        [user]
    );

    const unblock = React.useCallback(
        async (userId: number) => {
            if (!user) throw new Error('Not authenticated');
            setBlockedUsers((prev) =>
                prev ? prev.filter((id) => id !== userId) : []
            );
            try {
                await apiMutate(`/usersettings/${userId}/unblock`, 'patch');
                try {
                    queryClient.removeQueries({
                        predicate: (query) => {
                            const k = query.queryKey;
                            if (!Array.isArray(k) || k.length === 0)
                                return false;
                            const first = k[0];
                            if (typeof first !== 'string') return false;
                            return [
                                'posts',
                                'events',
                                'channels',
                                'channel',
                                'kudos-history',
                                'handshakes'
                            ].includes(first);
                        }
                    });
                }
                catch (err) {
                    console.warn('Failed to clear caches after unblock:', err);
                }
            }
            catch (err) {
                setBlockedUsers((prev) =>
                    prev ? [...prev, userId] : [userId]
                );
                throw err;
            }
        },
        [user]
    );

    const value = React.useMemo(
        () => ({ blockedUsers, loading, refresh, block, unblock }),
        [blockedUsers, loading, refresh, block, unblock]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useBlockedUsers = (): UseBlockedUsersContext => {
    const ctx = React.useContext(Context);
    if (ctx) return ctx;

    return {
        blockedUsers: [],
        loading: false,
        refresh: async () => {
            // noop
        },
        block: async (userId: number) => {
            await apiMutate(`/usersettings/${userId}/block`, 'patch');
        },
        unblock: async (userId: number) => {
            return apiMutate(`/usersettings/${userId}/unblock`, 'patch');
        }
    } as UseBlockedUsersContext;
};
