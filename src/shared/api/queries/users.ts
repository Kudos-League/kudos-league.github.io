import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import type { UserDTO } from '@/shared/api/types';

export const qkUsers = {
    search: (query: string) => ['userSearch', query] as const,
    all: () => ['allUsers'] as const
};

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
