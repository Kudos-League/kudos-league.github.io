import React from 'react';
import { ChannelDTO } from '@/shared/api/types';
import UserCard from '../users/UserCard';
import { useLatestChannelMessage } from '@/shared/api/queries/messages';

interface Props {
    channels: ChannelDTO[];
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
}

const DMItem: React.FC<DMItemProps> = ({ channel, onSelect, isSelected, isMobile }) => {
    const { data: latestMessage, isLoading } = useLatestChannelMessage(channel.id);
    const user = channel.otherUser;

    const formatLastMessage = (lastMessage: any) => {
        if (!lastMessage || !lastMessage.content) {
            return 'No messages yet';
        }

        const content = lastMessage.content.trim();
        if (content.length <= 32) {
            return content;
        }

        return content.substring(0, 32) + '...';
    };

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

    const lastMessageText = formatLastMessage(latestMessage);
    const timestamp = getMessageTimestamp(latestMessage);

    return (
        <div
            className={`flex items-center gap-3 rounded-lg transition-colors ${
                isMobile ? 'p-4' : 'p-3'
            } ${
                isSelected
                    ? 'bg-brand-100 dark:bg-brand-800 text-brand-900 dark:text-brand-100'
                    : ''
            }`}
        >
            <div className='flex-1 min-w-0'>
                <div className='flex justify-between items-baseline'>
                    {/* UserCard is clickable for profile */}
                    <div className={`font-semibold text-zinc-900 dark:text-zinc-100 truncate ${
                        isMobile ? 'text-base' : 'text-sm'
                    }`}>
                        <UserCard user={user} />
                    </div>
                    {timestamp && (
                        <span className={`text-zinc-400 dark:text-zinc-500 ml-2 flex-shrink-0 ${
                            isMobile ? 'text-sm' : 'text-xs'
                        }`}>
                            {timestamp}
                        </span>
                    )}
                </div>
                {/* Last message area - clickable for selecting conversation */}
                <p
                    onClick={() => onSelect(channel)}
                    className={`truncate cursor-pointer hover:underline ${
                        latestMessage?.content
                            ? 'text-zinc-600 dark:text-zinc-400'
                            : 'text-zinc-400 dark:text-zinc-500 italic'
                    } ${isMobile ? 'text-sm' : 'text-sm'}`}
                >
                    {isLoading ? 'Loading...' : lastMessageText}
                </p>
            </div>
        </div>
    );
};

const DMList: React.FC<Props> = ({
    channels,
    searchQuery,
    onSelect,
    selectedChannel,
    isMobile = false,
    isLoading = false
}) => {
    const filteredChannels = channels.filter((c) =>
        c.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={`${
            isMobile ? 'w-full' : 'w-1/3'
        } border-r border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 h-full flex flex-col ${
            isMobile ? 'p-4' : 'p-4'
        }`}>
            {!isMobile && (<h2 className={`font-bold text-zinc-900 dark:text-zinc-100 mb-4 ${
                isMobile ? 'text-xl text-center' : 'text-xl'
            }`}>
                Direct Messages
            </h2>)
            }

            <div className='overflow-y-auto flex-1 space-y-2'>
                {isLoading ? (
                    <div className='flex flex-col items-center justify-center h-32'>
                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 dark:border-brand-300'></div>
                        <p className='text-sm text-gray-500 dark:text-gray-400 mt-3'>Loading conversations...</p>
                    </div>
                ) : filteredChannels.length === 0 ? (
                    <p className={`text-gray-500 ${isMobile ? 'text-center text-base' : 'text-sm'}`}>
                        {channels.length === 0
                            ? 'No conversations found.'
                            : 'No matches found.'}
                    </p>
                ) : (
                    filteredChannels.map((channel) => (
                        <DMItem
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
