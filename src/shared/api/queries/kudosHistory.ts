import { useInfiniteQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import type { UserDTO } from '@/shared/api/types';

export type KudosHistorySourceFilter =
    | 'all'
    | 'donation'
    | 'feedback'
    | 'report'
    | 'reward-offer';

export type KudosHistoryDTO = {
    id: number;
    delta: number;
    total?: number | null;
    createdAt: string;
    source: 'donation' | 'feedback' | 'report' | 'reward-offer' | 'other';
    metadata?: Record<string, unknown> | null;
    actor?: UserDTO | null;
};

export const qk = {
    kudosHistoryInfinite: (
        userID?: number,
        source: KudosHistorySourceFilter = 'all'
    ) => ['kudos-history', 'infinite', userID, source] as const
};

export function useKudosHistoryInfinite(
    userID?: number,
    source: KudosHistorySourceFilter = 'all',
    pageSize = 10
) {
    return useInfiniteQuery({
        queryKey: qk.kudosHistoryInfinite(userID, source),
        queryFn: async ({ pageParam }) =>
            apiGet<{
                data: KudosHistoryDTO[];
                nextCursor?: number;
                limit: number;
            }>('/kudos/history', {
                params: {
                    userID,
                    source: source === 'all' ? undefined : source,
                    cursor: pageParam,
                    limit: pageSize
                }
            }),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        enabled: !!userID,
        staleTime: 60_000
    });
}
