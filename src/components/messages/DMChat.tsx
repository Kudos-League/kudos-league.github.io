import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUserDetails } from '@/shared/api/actions';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ChannelDTO, MessageDTO } from '@/shared/api/types';
import DMList from './DMList';
import ChatWindow from './ChatWindow';

export default function DMChat() {
    const { id: targetUserId } = useParams<{ id: string }>();
    const { user, token } = useAuth();
    const [channels, setChannels] = useState<ChannelDTO[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(null);
    const [messages, setMessages] = useState<MessageDTO[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const { joinChannel, leaveChannel, send } = useWebSocket(
        token,
        messages,
        setMessages
    );

    useEffect(() => {
        if (user && token) {
            getUserDetails(user.id, token, { dmChannels: true }).then((res) => {
                const formatted = res.dmChannels
                    .map((channel) => {
                        const otherUser = channel.users.find((u) => u.id !== user.id);
                        return otherUser ? { ...channel, otherUser } : null;
                    })
                    .filter(Boolean) as ChannelDTO[];

                setChannels(formatted);

                if (targetUserId) {
                    const matchedChannel = formatted.find((channel) =>
                        channel.users.some((u) => u.id === +targetUserId)
                    );

                    if (matchedChannel) {
                        joinChannel(matchedChannel.id);
                        setSelectedChannel(matchedChannel);
                    }
                }
            });
        }
    }, [user, token, targetUserId]);

    const openChat = async (channel: ChannelDTO) => {
        if (selectedChannel) leaveChannel(selectedChannel.id);
        joinChannel(channel.id);
        setSelectedChannel(channel);
    };

    const handleSend = async (content: string) => {
        if (!selectedChannel) return;
        const receiver = selectedChannel.users.find((u) => u.id !== user.id);
        if (!receiver) return;

        await send({ receiverID: receiver.id, content });
    };

    return (
        <div className='flex h-full'>
            <DMList
                channels={channels}
                onSearch={setSearchQuery}
                onSelect={openChat}
                searchQuery={searchQuery}
                selectedChannel={selectedChannel}
            />
            <ChatWindow
                user={user}
                channel={selectedChannel}
                messages={messages}
                onSend={handleSend}
                onBack={() => {
                    if (selectedChannel) leaveChannel(selectedChannel.id);
                    setSelectedChannel(null);
                }}
            />
        </div>
    );
}
