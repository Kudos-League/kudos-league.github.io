import React, { useMemo, useState, useEffect } from 'react';
import { ChannelDTO } from '@/shared/api/types';
import UserCard from '../users/UserCard';
import { useLatestChannelMessage, qk } from '@/shared/api/queries/messages';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/useAuth';

interface Props {
    channels: ChannelDTO[];
    publicChannels?: ChannelDTO[];
    searchQuery: string;
    onSelect: (channel: ChannelDTO) => void;
    selectedChannel: ChannelDTO | null;
    isMobile?: boolean;
    isLoading?: boolean;
}

interface DMItemProps {
    channel: ChannelDTO;
    onSelect: (channel: ChannelDTO) => void;
    isSelected: boolean;
    isMobile: boolean;
    unreadCount: number;
}

const DMItem: React.FC<DMItemProps> = ({
    channel,
    onSelect,
    isSelected,
    isMobile,
    unreadCount
}) => {
    const { latestMessage, isLoading, isFetched } = useLatestChannelMessage(
        channel.id
    );
    const user = channel.otherUser;
    const { user: currentUser } = useAuth();
    const hasUnread = unreadCount > 0;
    const [isAnimating, setIsAnimating] = useState(false);
    const prevMessageRef = React.useRef<string | null>(null);
    const [displayedMessage, setDisplayedMessage] = useState<string>('');

    // Helper function to safely format message content if it exists
    const formatMessageContent = (message: any): string => {
        // Use optional chaining (?.) to safely access .content and .trim()
        const content = message?.content?.trim();

        if (!content) {
            // Handle cases where the message exists but has no readable content (e.g., attachment-only message)
            return 'No messages yet';
        }

        // Determine sender prefix
        const isCurrentUser = message.authorID === currentUser?.id;
        const senderPrefix = isCurrentUser ? 'You: ' : `${user?.username}: `;
        const maxContentLength = 32 - senderPrefix.length;

        const truncatedContent =
            content.length <= maxContentLength
                ? content
                : content.substring(0, maxContentLength) + '...';

        return senderPrefix + truncatedContent;
    };

    // Calculate the text to display in the list item
    const lastMessageText = useMemo(() => {
        if (isLoading) {
            return 'Loading...';
        }
        if (isFetched && !latestMessage) {
            return 'No messages yet';
        }
        if (latestMessage) {
            // Use the safe formatting function
            return formatMessageContent(latestMessage);
        }
        // Fallback for an unexpected state
        return '';
    }, [isLoading, isFetched, latestMessage]);

    // Initialize displayedMessage on first render
    useEffect(() => {
        if (!displayedMessage && lastMessageText) {
            setDisplayedMessage(lastMessageText);
        }
    }, [lastMessageText, displayedMessage]);

    // Trigger animation when message text changes
    useEffect(() => {
        if (
            prevMessageRef.current !== null &&
            prevMessageRef.current !== lastMessageText &&
            lastMessageText !== 'Loading...'
        ) {
            // First, make the message fainter immediately
            setIsAnimating(true);

            // Then update the content and fade back in
            const timer = setTimeout(() => {
                setDisplayedMessage(lastMessageText);
                setIsAnimating(false);
            }, 150); // Update content mid-animation

            return () => clearTimeout(timer);
        }
        prevMessageRef.current = lastMessageText;
    }, [lastMessageText]);

    const getMessageTimestamp = (lastMessage: any) => {
        if (!lastMessage) return null;

        const date = new Date(lastMessage.createdAt || lastMessage.updatedAt);
        if (isNaN(date.getTime())) return null;

        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor(diffInHours * 60);
            return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
        }
        else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        }
        else {
            return date.toLocaleDateString();
        }
    };

    const timestamp = getMessageTimestamp(latestMessage);

    return (
        <div
            className={`flex items-center gap-3 rounded-lg transition-all cursor-pointer ${
                isMobile ? 'p-4' : 'p-3'
            } ${
                isSelected
                    ? 'bg-brand-100 dark:bg-brand-800 text-brand-900 dark:text-brand-100'
                    : hasUnread
                        ? 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-l-4 border-brand-500 dark:border-brand-400 shadow-sm'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            onClick={() => onSelect(channel)} // Make the whole item clickable
        >
            <div className='flex-1 min-w-0'>
                <div className='flex justify-between items-baseline'>
                    {/* UserCard is clickable for profile */}
                    <div
                        className={`truncate ${
                            hasUnread
                                ? 'font-extrabold text-brand-900 dark:text-brand-100'
                                : 'font-semibold text-zinc-900 dark:text-zinc-100'
                        } ${isMobile ? 'text-base' : 'text-sm'}`}
                    >
                        <UserCard user={user} />
                    </div>
                    <div className='flex items-center gap-2 ml-2 flex-shrink-0'>
                        {timestamp && (
                            <span
                                className={`text-zinc-400 dark:text-zinc-500 ${
                                    isMobile ? 'text-sm' : 'text-xs'
                                }`}
                            >
                                {timestamp}
                            </span>
                        )}
                        {hasUnread && (
                            <span className='inline-flex items-center justify-center min-w-[22px] h-6 px-2 rounded-full bg-brand-600 dark:bg-brand-500 text-white text-xs font-bold shadow-md ring-2 ring-white dark:ring-zinc-900 animate-pulse'>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                </div>
                {/* Last message area */}
                <p
                    className={`truncate transition-all duration-300 ${
                        hasUnread
                            ? 'font-bold text-zinc-800 dark:text-zinc-200'
                            : 'text-zinc-600 dark:text-zinc-400'
                    } ${
                        !latestMessage?.content &&
                        'text-zinc-400 dark:text-zinc-500 italic'
                    } ${isMobile ? 'text-sm' : 'text-sm'} ${
                        isAnimating
                            ? 'opacity-0 scale-95'
                            : 'opacity-100 scale-100'
                    }`}
                >
                    {displayedMessage}
                </p>
            </div>
        </div>
    );
};

const GroupChatItem: React.FC<{
    channel: ChannelDTO;
    onSelect: (channel: ChannelDTO) => void;
    isSelected: boolean;
    isMobile: boolean;
}> = ({ channel, onSelect, isSelected, isMobile }) => {
    return (
        <div
            onClick={() => onSelect(channel)}
            className={`flex items-center gap-3 rounded-lg transition-colors cursor-pointer ${
                isMobile ? 'p-4' : 'p-3'
            } ${
                isSelected
                    ? 'bg-brand-100 dark:bg-brand-800 text-brand-900 dark:text-brand-100'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
        >
            <div className='flex-1 min-w-0'>
                <div
                    className={`truncate font-semibold text-zinc-900 dark:text-zinc-100 ${
                        isMobile ? 'text-base' : 'text-sm'
                    }`}
                >
                    {channel.name || 'Forum'}
                </div>
                <p
                    className={`truncate text-zinc-600 dark:text-zinc-400 ${
                        isMobile ? 'text-sm' : 'text-xs'
                    }`}
                >
                    Talk to other users!
                </p>
            </div>
        </div>
    );
};

const DMList: React.FC<Props> = ({
    channels,
    publicChannels = [],
    searchQuery,
    onSelect,
    selectedChannel,
    isMobile = false,
    isLoading = false
}) => {
    const { state: notificationsState } = useNotifications();
    const { messages } = useWebSocketContext();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'dms' | 'groups'>('dms');

    // Refetch latest messages when a new message is received
    useEffect(() => {
        if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];

            // Invalidate queries for all DM channels to update latest messages
            channels.forEach((channel) => {
                queryClient.invalidateQueries({
                    queryKey: qk.channelMessages(channel.id)
                });
            });
        }
    }, [messages, channels, queryClient]);

    // Sort channels by most recent message first
    const sortedChannels = useMemo(() => {
        return [...channels].sort((a, b) => {
            const dateA = a.lastMessage
                ? new Date(
                    a.lastMessage.createdAt || a.lastMessage.updatedAt || 0
                ).getTime()
                : 0;
            const dateB = b.lastMessage
                ? new Date(
                    b.lastMessage.createdAt || b.lastMessage.updatedAt || 0
                ).getTime()
                : 0;
            return dateB - dateA; // Most recent first
        });
    }, [channels]);

    const filteredChannels = sortedChannels.filter((c) =>
        c.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPublicChannels = publicChannels.filter((c) =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate unread message counts for each channel
    const unreadCounts = useMemo(() => {
        const counts = new Map<number, number>();

        notificationsState.items.forEach((notification) => {
            if (
                notification.type === 'direct-message' &&
                !notification.isActedOn
            ) {
                // Assuming `notification.message.author.id` is the ID of the user who sent the message
                // which corresponds to the `otherUser.id` in a ChannelDTO for unread counts.
                const authorId = notification.message?.author?.id;
                if (authorId) {
                    counts.set(authorId, (counts.get(authorId) || 0) + 1);
                }
            }
        });

        return counts;
    }, [notificationsState.items]);

    const displayChannels =
        activeTab === 'dms' ? filteredChannels : filteredPublicChannels;

    return (
        <div
            className={`${
                isMobile ? 'w-full' : 'w-1/3'
            } border-r border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 h-full flex flex-col ${
                isMobile ? 'p-4' : 'p-4'
            }`}
        >
            {/* Tabs */}
            <div className='flex border-b border-zinc-200 dark:border-zinc-700 mb-4'>
                <button
                    onClick={() => setActiveTab('dms')}
                    className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                        activeTab === 'dms'
                            ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                >
                    DMs
                </button>
                <button
                    onClick={() => setActiveTab('groups')}
                    className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                        activeTab === 'groups'
                            ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                >
                    Group chats
                </button>
            </div>

            <div className='overflow-y-auto flex-1 space-y-2'>
                {isLoading ? (
                    <div className='flex flex-col items-center justify-center h-32'>
                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 dark:border-brand-300'></div>
                        <p className='text-sm text-gray-500 dark:text-gray-400 mt-3'>
                            Loading conversations...
                        </p>
                    </div>
                ) : displayChannels.length === 0 ? (
                    <p
                        className={`text-gray-500 ${isMobile ? 'text-center text-base' : 'text-sm'}`}
                    >
                        {activeTab === 'dms'
                            ? channels.length === 0
                                ? 'No conversations found.'
                                : 'No matches found.'
                            : publicChannels.length === 0
                                ? 'No group chats found.'
                                : 'No matches found.'}
                    </p>
                ) : activeTab === 'dms' ? (
                    displayChannels.map((channel) => (
                        <DMItem
                            key={channel.id}
                            channel={channel}
                            onSelect={onSelect}
                            isSelected={selectedChannel?.id === channel.id}
                            isMobile={isMobile}
                            unreadCount={
                                unreadCounts.get(channel.otherUser?.id || 0) ||
                                0
                            }
                        />
                    ))
                ) : (
                    displayChannels.map((channel) => (
                        <GroupChatItem
                            key={channel.id}
                            channel={channel}
                            onSelect={onSelect}
                            isSelected={selectedChannel?.id === channel.id}
                            isMobile={isMobile}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default DMList;
