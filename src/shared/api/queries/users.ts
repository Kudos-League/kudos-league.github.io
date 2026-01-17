import { useQuery, useQueries } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import type { UserDTO, ChannelDTO } from '@/shared/api/types';

export const qkUsers = {
    search: (query: string) => ['userSearch', query] as const,
    all: () => ['allUsers'] as const,
    user: (id: number | string) => ['user', id] as const,
    me: () => ['user', 'me'] as const,
    dmChannels: (id: number | string) => ['user', id, 'dmChannels'] as const
};

export function useUserQuery(userId: number | string | undefined, options?: { enabled?: boolean; settings?: boolean }) {
    return useQuery<UserDTO>({
        queryKey: qkUsers.user(userId!),
        queryFn: () => apiGet<UserDTO>(`/users/${userId}`, {
            params: options?.settings ? { settings: true } : undefined
        }),
        enabled: userId !== undefined && options?.enabled !== false,
        staleTime: 30_000
    });
}

export function useUserDMChannelsQuery(userId: number | string | undefined) {
    return useQuery<{ dmChannels: ChannelDTO[] }>({
        queryKey: qkUsers.dmChannels(userId!),
        queryFn: () => apiGet<{ dmChannels: ChannelDTO[] }>(`/users/${userId}`, {
            params: { dmChannels: true }
        }),
        enabled: userId !== undefined,
        staleTime: 30_000
    });
}

export function useBlockedUsersQuery(userIds: number[] | undefined) {
    const queries = useQueries({
        queries: (userIds ?? []).map((id) => ({
            queryKey: qkUsers.user(id),
            queryFn: () => apiGet<UserDTO>(`/users/${id}`),
            enabled: !!userIds?.length,
            staleTime: 30_000
        }))
    });

    const isLoading = queries.some((q) => q.isLoading);
    const data = queries
        .map((q) => q.data)
        .filter((d): d is UserDTO => d !== undefined);

    return { data, isLoading };
}

export function useSearchUsersQuery(query: string) {
    return useQuery<UserDTO[]>({
        queryKey: qkUsers.search(query),
        queryFn: () =>
            apiGet<UserDTO[]>('/users/search', {
                params: { query }
            }),
        enabled: query.length >= 2,
        staleTime: 0,
        gcTime: 60_000
    });
}

export function useAllUsersQuery() {
    return useQuery<UserDTO[]>({
        queryKey: qkUsers.all(),
        queryFn: async () => {
            const response = await apiGet<{
                data: UserDTO[];
                nextCursor?: number;
                limit: number;
            }>('/users');
            return response.data;
        }
    });
}
