import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMutate } from '@/shared/api/apiClient';
import type { ChannelDTO } from '@/shared/api/types';
import { useDataCache } from '@/contexts/DataCacheContext';

export function useCreateChannel() {
    const qc = useQueryClient();
    return useMutation<
        ChannelDTO,
        any,
        { name: string; channelType: string; userIDs: number[] }
    >({
        mutationFn: (payload) =>
            apiMutate<ChannelDTO, any>('/channels', 'post', payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['channels'] });
        }
    });
}

export function useAcceptHandshake() {
    const qc = useQueryClient();
    const { invalidateHandshake } = useDataCache();
    return useMutation<any, any, number>({
        mutationFn: (handshakeID) => {
            if (typeof handshakeID !== 'number') {
                throw new Error('handshakeID is required');
            }
            return apiMutate(`/handshakes/${handshakeID}`, 'patch', {
                status: 'accepted'
            });
        },
        onSuccess: (_, handshakeID) => {
            qc.invalidateQueries({ queryKey: ['posts'] });
            qc.invalidateQueries({ queryKey: ['handshakes'] });
            qc.invalidateQueries({ queryKey: ['notifications', 'history'] });
            invalidateHandshake(handshakeID);
        }
    });
}

export function useCompleteHandshake() {
    const qc = useQueryClient();
    const { invalidateHandshake } = useDataCache();
    return useMutation<any, any, number>({
        mutationFn: (handshakeID) => {
            if (typeof handshakeID !== 'number') {
                throw new Error('handshakeID is required');
            }
            return apiMutate(`/handshakes/${handshakeID}`, 'patch', {
                status: 'completed'
            });
        },
        onSuccess: (_, handshakeID) => {
            qc.invalidateQueries({ queryKey: ['posts'] });
            qc.invalidateQueries({ queryKey: ['handshakes'] });
            qc.invalidateQueries({ queryKey: ['notifications', 'history'] });
            invalidateHandshake(handshakeID);
        }
    });
}

export function useDeleteHandshake() {
    const qc = useQueryClient();
    const { invalidateHandshake } = useDataCache();
    return useMutation<void, any, number>({
        mutationFn: (handshakeID) => {
            if (typeof handshakeID !== 'number') {
                throw new Error('handshakeID is required');
            }
            return apiMutate(`/handshakes/${handshakeID}`, 'delete');
        },
        onSuccess: (_, handshakeID) => {
            qc.invalidateQueries({ queryKey: ['posts'] });
            qc.invalidateQueries({ queryKey: ['handshakes'] });
            qc.invalidateQueries({ queryKey: ['notifications', 'history'] });
            invalidateHandshake(handshakeID);
        }
    });
}

export function useUndoAcceptHandshake() {
    const qc = useQueryClient();
    const { invalidateHandshake, invalidatePost } = useDataCache();
    return useMutation<any, any, { handshakeID: number; postID?: number }>({
        mutationFn: ({ handshakeID }) => {
            if (typeof handshakeID !== 'number') {
                throw new Error('handshakeID is required');
            }
            return apiMutate(`/handshakes/${handshakeID}`, 'patch', {
                status: 'new'
            });
        },
        onSuccess: (_, { handshakeID, postID }) => {
            qc.invalidateQueries({ queryKey: ['posts'] });
            qc.invalidateQueries({ queryKey: ['handshakes'] });
            qc.invalidateQueries({ queryKey: ['notifications', 'history'] });
            invalidateHandshake(handshakeID);
            if (postID) invalidatePost(postID);
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
