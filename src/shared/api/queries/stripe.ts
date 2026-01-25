import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';

export const qkStripe = {
    publishableKey: () => ['stripe', 'publishableKey'] as const,
    sessionStatus: (sessionId: string) => ['stripe', 'sessionStatus', sessionId] as const
};

export function useStripePublishableKeyQuery() {
    return useQuery<{ publishableKey: string }>({
        queryKey: qkStripe.publishableKey(),
        queryFn: () => apiGet<{ publishableKey: string }>('/stripe/publishable-key'),
        staleTime: Infinity,
        gcTime: Infinity
    });
}

export function useStripeSessionStatusQuery(sessionId: string | null, options?: { enabled?: boolean }) {
    return useQuery<{ status: string; customerEmail?: string; amount?: number; kudosAwarded?: number }>({
        queryKey: qkStripe.sessionStatus(sessionId!),
        queryFn: () => apiGet<{ status: string; customerEmail?: string; amount?: number; kudosAwarded?: number }>(
            '/stripe/session-status',
            { params: { session_id: sessionId } }
        ),
        enabled: !!sessionId && options?.enabled !== false,
        staleTime: 0,
        refetchInterval: (query) => {
            // Stop polling once we get a final status
            const status = query.state.data?.status;
            if (status === 'complete' || status === 'expired') return false;
            return 2000; // Poll every 2 seconds
        }
    });
}
