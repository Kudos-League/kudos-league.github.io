import React from 'react';
import AvatarComponent from '../users/Avatar';
import { ChannelDTO } from '@/shared/api/types';
import UserCard from '../users/UserCard';

interface Props {
    channels: ChannelDTO[];
    searchQuery: string;
    onSearch: (value: string) => void;
    onSelect: (channel: ChannelDTO) => void;
    selectedChannel: ChannelDTO | null;
}

const DMList: React.FC<Props> = ({
    channels,
    searchQuery,
    onSearch,
    onSelect,
    selectedChannel
}) => {
    const filteredChannels = channels.filter((c) =>
        c.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    return (
        <div className='w-1/3 border-r border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 h-full flex flex-col p-4'>
            <h2 className='text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4'>
                Direct Messages
            </h2>

            <input
                type='text'
                placeholder='Search by username...'
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className='border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 mb-4 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors'
            />

            <div className='overflow-y-auto flex-1 space-y-2'>
                {filteredChannels.length === 0 && (
                    <p className='text-sm text-gray-500'>
                        {channels.length === 0
                            ? 'No conversations found.'
                            : 'No matches found.'}
                    </p>
                )}
                {filteredChannels.map((channel) => {
                    const user = channel.otherUser;
                    const isSelected = selectedChannel?.id === channel.id;
                    const lastMessageText = formatLastMessage(
                        channel.lastMessage
                    );
                    const timestamp = getMessageTimestamp(channel.lastMessage);

                    return (
                        <div
                            key={channel.id}
                            onClick={() => onSelect(channel)}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                    ? 'bg-teal-100 dark:bg-teal-800 text-teal-900 dark:text-teal-100'
                                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <div className='flex-1 min-w-0'>
                                <div className='flex justify-between items-baseline'>
                                    <p className='font-semibold text-zinc-900 dark:text-zinc-100 truncate'>
                                        <UserCard user={user} />
                                    </p>
                                    {timestamp && (
                                        <span className='text-xs text-zinc-400 dark:text-zinc-500 ml-2 flex-shrink-0'>
                                            {timestamp}
                                        </span>
                                    )}
                                </div>
                                <p
                                    className={`text-sm truncate ${
                                        channel.lastMessage?.content
                                            ? 'text-zinc-600 dark:text-zinc-400'
                                            : 'text-zinc-400 dark:text-zinc-500 italic'
                                    }`}
                                >
                                    {lastMessageText}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DMList;
