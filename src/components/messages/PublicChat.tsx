import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getMessages, getPublicChannels } from '@/shared/api/actions';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ChannelDTO, MessageDTO } from '@/shared/api/types';
import MessageGroup from './MessageGroup';
import { groupMessagesByAuthor } from '@/shared/groupMessagesByAuthor';

export default function PublicChat() {
    const { token, user } = useAuth();
    const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(
        null
    );
    const [channels, setChannels] = useState<ChannelDTO[]>([]);
    const [messages, setMessages] = useState<MessageDTO[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { joinChannel, leaveChannel, send } = useWebSocket(
        {
            messages,
            setMessages
        }
    );

    const groupedMessages = useMemo(
        () => groupMessagesByAuthor(messages),
        [messages]
    );

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const fetchChannels = async () => {
            if (!token) return;

            try {
                const publicChannels = await getPublicChannels(token);
                setChannels(publicChannels);
                if (publicChannels.length > 0 && !selectedChannel) {
                    selectChannel(publicChannels[0]);
                }
            }
            catch (error) {
                console.error('Error fetching public channels:', error);
            }
        };

        fetchChannels();
    }, []);

    const selectChannel = async (channel: ChannelDTO) => {
        setSelectedChannel(channel);
        setLoading(true);
        if (!token) return;

        try {
            const messagesData = await getMessages(channel.id, token);
            setMessages(messagesData);

            if (selectedChannel && selectedChannel.id !== channel.id) {
                leaveChannel(selectedChannel.id);
            }

            joinChannel(channel.id);
        }
        catch (error) {
            console.error('Error selecting channel:', error);
        }
        finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!messageInput.trim() || !selectedChannel) return;

        await send({ channel: selectedChannel, content: messageInput });
        setMessageInput('');
    };

    return (
        <div className='flex h-full bg-white overflow-hidden'>
            {/* Left: Channel List */}
            <div className='w-48 border-r overflow-y-auto bg-gray-100 p-3'>
                {channels.map((channel) => (
                    <button
                        key={channel.id}
                        onClick={() => selectChannel(channel)}
                        className={`block w-full text-left px-3 py-2 mb-1 rounded ${
                            selectedChannel?.id === channel.id
                                ? 'bg-blue-100 font-semibold text-blue-800'
                                : 'hover:bg-gray-200'
                        }`}
                    >
                        {channel.name}
                    </button>
                ))}
            </div>

            {/* Right: Chat Window */}
            <div className='flex-1 flex flex-col'>
                {/* Header */}
                <div className='border-b p-4 text-center font-bold text-lg'>
                    {selectedChannel
                        ? selectedChannel.name
                        : 'Select a Chat Room'}
                </div>

                {/* Message List */}
                <div
                    ref={scrollRef}
                    className='flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50'
                >
                    {loading ? (
                        <div className='text-center text-gray-500 mt-4'>
                            Loading...
                        </div>
                    ) : messages.length === 0 ? (
                        <p className='text-center text-gray-400 italic'>
                            No messages in this channel.
                        </p>
                    ) : (
                        groupedMessages.map((group) => (
                            <MessageGroup
                                key={group[0].id}
                                messages={group}
                                isOwn={group[0].author?.id === user?.id}
                                compact
                                isPublic
                            />
                        ))
                    )}
                </div>

                {/* Message Input */}
                {selectedChannel && (
                    <div className='border-t p-3 flex items-center'>
                        <input
                            type='text'
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder='Type a message...'
                            className='flex-1 border rounded px-3 py-2'
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') sendMessage();
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            className='ml-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
                        >
                            Send
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
