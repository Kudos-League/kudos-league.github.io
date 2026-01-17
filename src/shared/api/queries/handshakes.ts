import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import type { HandshakeDTO } from '@/shared/api/types';

export const qk = {
    bySender: (userId: number | undefined) =>
        ['handshakes', 'sender', userId] as const,
    byReceiver: (userId: number | undefined) =>
        ['handshakes', 'receiver', userId] as const,
    userHandshakes: (userId: number | undefined) =>
        ['handshakes', 'user', userId] as const
};

export function useHandshakesBySenderQuery(userId: number | undefined) {
    return useQuery<HandshakeDTO[]>({
        queryKey: qk.bySender(userId),
        queryFn: () => apiGet<HandshakeDTO[]>(`/handshakes/by-sender/${userId}`),
        enabled: !!userId,
        staleTime: 60_000
    });
}

export function useHandshakesByReceiverQuery(userId: number | undefined) {
    return useQuery<HandshakeDTO[]>({
        queryKey: qk.byReceiver(userId),
        queryFn: () =>
            apiGet<HandshakeDTO[]>(`/handshakes/by-receiver/${userId}`),
        enabled: !!userId,
        staleTime: 60_000
    });
}

/**
 * Combined hook that fetches both sent and received handshakes for a user,
 * deduplicates them, and returns a single array.
 */
export function useUserHandshakesQuery(userId: number | undefined) {
    const sentQuery = useHandshakesBySenderQuery(userId);
    const receivedQuery = useHandshakesByReceiverQuery(userId);

    const isLoading = sentQuery.isLoading || receivedQuery.isLoading;
    const isError = sentQuery.isError || receivedQuery.isError;
    const error = sentQuery.error || receivedQuery.error;

    // Combine and deduplicate handshakes
    const data =
        sentQuery.data && receivedQuery.data
            ? Array.from(
                new Map(
                    [...sentQuery.data, ...receivedQuery.data].map((h) => [
                        h.id,
                        h
                    ])
                ).values()
            )
            : undefined;

    return {
        data,
        isLoading,
        isError,
        error,
        refetch: () => {
            sentQuery.refetch();
            receivedQuery.refetch();
        }
    };
}
