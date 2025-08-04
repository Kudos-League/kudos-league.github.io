import React from 'react';
import AvatarComponent from '../users/Avatar';
import { ChannelDTO } from '@/shared/api/types';

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
        <div className='w-1/3 border-r bg-white h-full flex flex-col p-4'>
            <h2 className='text-xl font-bold mb-3'>Direct Messages</h2>

            <input
                type='text'
                placeholder='Search by username...'
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className='border rounded px-3 py-2 mb-4'
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
                    const lastMessageText = formatLastMessage(channel.lastMessage);
                    const timestamp = getMessageTimestamp(channel.lastMessage);
                    
                    return (
                        <div
                            key={channel.id}
                            onClick={() => onSelect(channel)}
                            className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'
                            }`}
                        >
                            <AvatarComponent
                                avatar={user.avatar}
                                username={user.username}
                                size={40}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <p className='font-semibold text-gray-900 truncate'>
                                        {user.username}
                                    </p>
                                    {timestamp && (
                                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                            {timestamp}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-sm truncate ${
                                    channel.lastMessage?.content 
                                        ? 'text-gray-600' 
                                        : 'text-gray-400 italic'
                                }`}>
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
