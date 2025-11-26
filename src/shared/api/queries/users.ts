import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import type { UserDTO } from '@/shared/api/types';

export const qkUsers = {
    search: (query: string) => ['userSearch', query] as const
};

export function useSearchUsersQuery(query: string) {
    return useQuery<UserDTO[]>({
        queryKey: qkUsers.search(query),
        queryFn: () =>
            apiGet<UserDTO[]>('/users/search', {
                params: { query }
            }),
        enabled: query.length >= 2
    });
}
