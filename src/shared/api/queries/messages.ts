import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import type { ChannelDTO, MessageDTO } from '@/shared/api/types';

export const qk = {
    channels: ['channels'] as const,
    channelMessages: (channelId: number) => ['channel', channelId, 'messages'] as const
};

export function usePublicChannels() {
    return useQuery<ChannelDTO[]>({
        queryKey: qk.channels,
        queryFn: () => apiGet<ChannelDTO[]>('/channels')
    });
}

export function useChannelMessages(channelId?: number) {
    return useQuery<MessageDTO[]>({
        queryKey: channelId ? qk.channelMessages(channelId) : ['channel', 'none', 'messages'],
        queryFn: () => apiGet<MessageDTO[]>(`/channels/${channelId}/messages`),
        enabled: !!channelId
    });
}
