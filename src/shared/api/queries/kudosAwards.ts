import { useInfiniteQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import type { UserDTO } from '@/shared/api/types';

export type KudosAwardStatusFilter =
    | 'pending'
    | 'verified'
    | 'rejected'
    | 'all';

export type KudosAwardDTO = {
    id: number;
    giftID: string;
    amount: number;
    title?: string | null;
    description?: string | null;
    attachments: string[];
    verificationStatus: 'pending' | 'verified' | 'rejected' | null;
    verifiedByID: number | null;
    createdAt: string;
    recipient?: Pick<UserDTO, 'id' | 'username' | 'avatar' | 'kudos'> | null;
    giver?: Pick<UserDTO, 'id' | 'username' | 'avatar' | 'kudos'> | null;
};

export const qkKudosAwards = {
    infinite: (status: KudosAwardStatusFilter = 'pending') =>
        ['kudos-awards', 'infinite', status] as const
};

export function useKudosAwardsInfinite(
    status: KudosAwardStatusFilter = 'pending',
    pageSize = 25
) {
    return useInfiniteQuery({
        queryKey: qkKudosAwards.infinite(status),
        queryFn: async ({ pageParam }) =>
            apiGet<{
                data: KudosAwardDTO[];
                nextCursor?: number;
                limit: number;
            }>('/kudos/awards', {
                params: {
                    status,
                    cursor: pageParam,
                    limit: pageSize
                }
            }),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
    });
}
