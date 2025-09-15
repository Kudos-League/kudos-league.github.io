import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMutate } from '@/shared/api/apiClient';
import type { ChannelDTO } from '@/shared/api/types';

export function useCreateChannel() {
    const qc = useQueryClient();
    return useMutation<ChannelDTO, any, { name: string; channelType: string; userIDs: number[] }>({
        mutationFn: (payload) => apiMutate<ChannelDTO, any>('/channels', 'post', payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['channels'] });
        }
    });
}

export function useAcceptHandshake(handshakeId?: number) {
    const qc = useQueryClient();
    return useMutation<any, any, void>({
        mutationFn: () => apiMutate(`/handshakes/${handshakeId}`, 'patch', { status: 'accepted' }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['posts'] });
            qc.invalidateQueries({ queryKey: ['handshakes'] });
        }
    });
}

export function useCompleteHandshake(handshakeId?: number) {
    const qc = useQueryClient();
    return useMutation<any, any, void>({
        mutationFn: () => apiMutate(`/handshakes/${handshakeId}`, 'patch', { status: 'completed' }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['posts'] });
            qc.invalidateQueries({ queryKey: ['handshakes'] });
        }
    });
}

export function useDeleteHandshake(handshakeId?: number) {
    const qc = useQueryClient();
    return useMutation<void, any, void>({
        mutationFn: () => apiMutate(`/handshakes/${handshakeId}`, 'delete'),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['posts'] });
            qc.invalidateQueries({ queryKey: ['handshakes'] });
        }
    });
}

export function useCreateOffer() {
    const qc = useQueryClient();
    return useMutation<any, any, any>({
        mutationFn: (payload) => apiMutate('/offers', 'post', payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['posts'] });
        }
    });
}
