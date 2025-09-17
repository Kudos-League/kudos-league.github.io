import { useInfiniteQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';

type DonationDTO = {
    invoiceID: string;
    amount?: number | null;
    interval?: string | null;
    kudos?: number | null;
    createdAt?: string | null;
};

export const qk = {
    donationsInfinite: (userID?: number) => ['donations', 'infinite', userID] as const
};

export function useDonationsInfinite(userID?: number, pageSize = 10) {
    return useInfiniteQuery({
        queryKey: qk.donationsInfinite(userID),
        queryFn: async ({ pageParam }) =>
            apiGet<{ data: DonationDTO[]; nextCursor?: number; limit: number }>('/stripe/donations', {
                params: { userID, cursor: pageParam, limit: pageSize }
            }),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        enabled: !!userID,
        staleTime: 60_000
    });
}
