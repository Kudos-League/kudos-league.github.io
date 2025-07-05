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
                        No conversations found.
                    </p>
                )}
                {filteredChannels.map((channel) => {
                    const user = channel.otherUser;
                    const isSelected = selectedChannel?.id === channel.id;
                    return (
                        <div
                            key={channel.id}
                            onClick={() => onSelect(channel)}
                            className={`flex items-center gap-3 p-2 rounded cursor-pointer ${
                                isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'
                            }`}
                        >
                            <AvatarComponent
                                avatar={user.avatar}
                                username={user.username}
                                size={36}
                            />
                            <div>
                                <p className='font-semibold'>{user.username}</p>
                                <p className='text-xs text-gray-500'>
                                    {channel.lastMessage?.content?.slice(
                                        0,
                                        32
                                    ) || 'No messages received yet'}
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
