import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMutate } from '@/shared/api/apiClient';
import type { CreateMessageDTO, MessageDTO } from '@/shared/api/types';

const channelKey = (id: number | string) => ['channel', id, 'messages'] as const;

export function useSendMessage(channelId?: number) {
    const qc = useQueryClient();
    return useMutation<MessageDTO, any, CreateMessageDTO>({
        mutationFn: (payload) => apiMutate<MessageDTO, CreateMessageDTO>('/messages', 'post', payload),
        onSuccess: () => {
            if (channelId) qc.invalidateQueries({ queryKey: channelKey(channelId) });
        }
    });
}

export function useUpdateMessage() {
    const qc = useQueryClient();
    return useMutation<MessageDTO, any, { id: number; content: string }>({
        mutationFn: ({ id, content }) => apiMutate<MessageDTO, { content: string }>(`/messages/${id}`, 'put', { content }),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: channelKey(data.channelID ?? 'unknown') });
        }
    });
}

export function useDeleteMessage() {
    const qc = useQueryClient();
    return useMutation<void, any, number>({
        mutationFn: (id) => apiMutate<void, void>(`/messages/${id}`, 'delete'),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['channel'] });
        }
    });
}

export function useSendDirectMessage(recipientId?: number) {
    const qc = useQueryClient();
    return useMutation<MessageDTO, any, CreateMessageDTO>({
        mutationFn: (payload) => apiMutate<MessageDTO, CreateMessageDTO>(`/users/${recipientId}/dm`, 'post', payload),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ['channels'] });
            if (data.channelID) qc.invalidateQueries({ queryKey: ['channel', data.channelID, 'messages'] });
        }
    });
}
