import { useInfiniteQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import type { UserDTO } from '@/shared/api/types';

export type LeaderboardFilters = {
    local?: boolean;
    time?: 'all' | 'month' | 'week';
    limit?: number;
};

export type LeaderboardResponse = {
    data: (UserDTO & { rank?: number })[];
    nextCursor?: number;
    total?: number;
};

export const qkLeaderboard = {
    list: (filters?: LeaderboardFilters) => ['leaderboard', filters] as const
};

export function useLeaderboardInfiniteQuery(filters?: LeaderboardFilters) {
    return useInfiniteQuery({
        queryKey: qkLeaderboard.list(filters),
        queryFn: ({ pageParam }) =>
            apiGet<LeaderboardResponse>('/leaderboard', {
                params: {
                    local: filters?.local,
                    time: filters?.time,
                    limit: filters?.limit ?? 20,
                    cursor: pageParam ?? undefined
                }
            }),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        staleTime: 30_000
    });
}
