import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUserDetails, getMessages } from '@/shared/api/actions';
import { useAuth } from '@/contexts/useAuth';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { ChannelDTO } from '@/shared/api/types';
import DMList from './DMList';
import ChatWindow from './ChatWindow';
import { useNotifications } from '@/contexts/NotificationsContext';

export default function DMChat() {
    const { id: targetUserId } = useParams<{ id: string }>();
    const { user, token } = useAuth();
    const [channels, setChannels] = useState<ChannelDTO[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(
        null
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);
    const { state: notifState } = useNotifications();

    const { messages, setMessages, joinChannel, leaveChannel, send } =
        useWebSocketContext();

    useEffect(() => {
        const n = notifState.items[0];
        if (!n) return;

        if (n.type === 'direct-message') {
            setChannels((prev) =>
                prev.map((c) =>
                    c.id === n.channelID ? { ...c, lastMessage: n.message } : c
                )
            );

            if (selectedChannel?.id === n.channelID) {
                const msg = n.message;
                setMessages((prev) =>
                    prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
                );
            }
        }
    }, [notifState.items, selectedChannel?.id, setMessages]);

    useEffect(() => {
        if (user && token) {
            getUserDetails(user.id, token, { dmChannels: true }).then(
                async (res) => {
                    const formatted = res.dmChannels
                        .map((channel) => {
                            const otherUser = channel.users.find(
                                (u) => u.id !== user.id
                            );
                            return otherUser ? { ...channel, otherUser } : null;
                        })
                        .filter(Boolean) as ChannelDTO[];

                    const channelsWithLastMessage = await Promise.all(
                        formatted.map(async (channel) => {
                            try {
                                const channelMessages = await getMessages(
                                    channel.id,
                                    token
                                );
                                const lastMessage =
                                    channelMessages &&
                                    channelMessages.length > 0
                                        ? channelMessages[
                                            channelMessages.length - 1
                                        ]
                                        : null;
                                return { ...channel, lastMessage };
                            }
                            catch (error) {
                                console.error(
                                    `Error fetching messages for channel ${channel.id}:`,
                                    error
                                );
                                return channel;
                            }
                        })
                    );

                    setChannels(channelsWithLastMessage);

                    if (targetUserId) {
                        const matchedChannel = channelsWithLastMessage.find(
                            (channel) =>
                                channel.users.some(
                                    (u) => u.id === +targetUserId
                                )
                        );

                        if (matchedChannel) {
                            joinChannel(matchedChannel.id);
                            setSelectedChannel(matchedChannel);
                            setShowChatOnMobile(true);
                        }
                    }
                }
            );
        }
    }, [user, token, targetUserId, joinChannel]);

    useEffect(() => {
        if (messages.length > 0 && selectedChannel) {
            const lastMessage = messages[messages.length - 1];
            setChannels((prevChannels) =>
                prevChannels.map((channel) =>
                    channel.id === selectedChannel.id
                        ? { ...channel, lastMessage }
                        : channel
                )
            );
        }
    }, [messages, selectedChannel]);

    const openChat = async (channel: ChannelDTO) => {
        if (selectedChannel) leaveChannel(selectedChannel.id);
        joinChannel(channel.id);
        setSelectedChannel(channel);
        setShowChatOnMobile(true);
    };

    const handleSend = async (content: string) => {
        if (!selectedChannel || !user) return;
        const receiver = selectedChannel.users.find((u) => u.id !== user.id);
        if (!receiver) return;

        await send({ receiverID: receiver.id, content });
    };

    const handleBackToList = () => {
        setShowChatOnMobile(false);
        setSelectedChannel(null);
        if (selectedChannel) {
            leaveChannel(selectedChannel.id);
        }
    };

    return (
        <div className='flex h-full bg-white dark:bg-zinc-900 overflow-hidden'>
            {/* Mobile Layout - Show list OR chat */}
            <div className='md:hidden w-full h-full'>
                {!showChatOnMobile ? (
                    <DMList
                        channels={channels}
                        onSearch={setSearchQuery}
                        onSelect={openChat}
                        searchQuery={searchQuery}
                        selectedChannel={selectedChannel}
                        isMobile={true}
                    />
                ) : (
                    <ChatWindow
                        user={user}
                        channel={selectedChannel}
                        messages={messages}
                        onSend={handleSend}
                        onBack={handleBackToList}
                        isMobile={true}
                    />
                )}
            </div>

            {/* Desktop Layout - Show both side by side */}
            <div className='hidden md:flex w-full h-full'>
                <DMList
                    channels={channels}
                    onSearch={setSearchQuery}
                    onSelect={openChat}
                    searchQuery={searchQuery}
                    selectedChannel={selectedChannel}
                    isMobile={false}
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
                    isMobile={false}
                />
            </div>
        </div>
    );
}
