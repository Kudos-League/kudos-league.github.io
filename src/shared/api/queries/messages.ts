import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import type { ChannelDTO, MessageDTO } from '@/shared/api/types';
import React from 'react';

export const qk = {
    channels: ['channels'] as const,
    channelMessages: (channelId: number) =>
        ['channel', channelId, 'messages'] as const
};

export function usePublicChannels() {
    return useQuery<ChannelDTO[]>({
        queryKey: qk.channels,
        queryFn: () => apiGet<ChannelDTO[]>('/channels')
    });
}

export function useChannelMessages(channelId?: number) {
    return useQuery<MessageDTO[] | null>({
        queryKey: channelId
            ? qk.channelMessages(channelId)
            : ['channel', 'none', 'messages'],
        queryFn: () => apiGet<MessageDTO[]>(`/channels/${channelId}/messages`),
        enabled: !!channelId
    });
}

// Assuming your message object has a timestamp field like 'createdAt' (or 'updatedAt')
// and that it is a valid date string or Date object.

export function useLatestChannelMessage(channelId?: number) {
    const query = useChannelMessages(channelId);

    // Use a useMemo hook to safely calculate the latest message
    const latestMessage = React.useMemo(() => {
        const messages = query.data;

        if (!messages || messages.length === 0) {
            return null;
        }

        // 1. Create a shallow copy to avoid modifying the cached data
        const sortedMessages = [...messages].sort((a, b) => {
            // Convert timestamps (assuming they are strings) to numbers for comparison
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();

            // Sort in ascending order (Oldest -> Newest)
            // If timeA is older (smaller number), it goes first (returns negative number)
            return timeA - timeB;
        });

        // 2. The latest message is now the last element in the sorted array
        return sortedMessages[sortedMessages.length - 1] ?? null;
    }, [query.data]); // Recalculate only when the message data changes

    return {
        latestMessage: latestMessage, // Use the safely calculated latest message
        isLoading: query.isLoading,
        isFetched: query.isFetched,
        isError: query.isError
    };
}
