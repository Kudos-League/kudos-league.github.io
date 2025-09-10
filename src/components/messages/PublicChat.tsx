import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getMessages, getPublicChannels } from '@/shared/api/actions';
import { useAuth } from '@/contexts/useAuth';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { ChannelDTO, MessageDTO } from '@/shared/api/types';
import MessageGroup from './MessageGroup';
import SlideInOnScroll from '../common/SlideInOnScroll';
import { groupMessagesByAuthor } from '@/shared/groupMessagesByAuthor';
import Button from '../common/Button';

export default function PublicChat() {
    const { token, user } = useAuth();
    const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(
        null
    );
    const [channels, setChannels] = useState<ChannelDTO[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [replyTo, setReplyTo] = useState<MessageDTO | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { messages, setMessages, joinChannel, leaveChannel, send } =
        useWebSocketContext();

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
    }, [token]);

    const selectChannel = async (channel: ChannelDTO) => {
        setSelectedChannel(channel);
        setLoading(true);
        if (!token) return;

        try {
            const messagesData = await getMessages(channel.id, token);
            if (messagesData) setMessages(messagesData);

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
        await send({
            channel: selectedChannel,
            content: messageInput,
            replyToMessageID: replyTo?.id
        });
        setMessageInput('');
        setReplyTo(null);
    };

    return (
        <div className='flex h-full bg-white dark:bg-zinc-900 overflow-hidden'>
            <div className='w-48 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto bg-zinc-100 dark:bg-zinc-800 p-3'>
                {channels.map((channel) => (
                    <Button
                        key={channel.id}
                        onClick={() => selectChannel(channel)}
                        className={`block w-full text-left px-3 py-2 mb-1 rounded ${
                            selectedChannel?.id === channel.id
                                ? 'bg-blue-100 font-semibold text-blue-800 dark:text-blue-100'
                                : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100'
                        }`}
                    >
                        {channel.name}
                    </Button>
                ))}
            </div>

            <div className='flex-1 flex flex-col'>
                <div className='border-b border-zinc-200 dark:border-zinc-800 p-4 text-center font-bold text-lg text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900'>
                    {selectedChannel
                        ? selectedChannel.name
                        : 'Select a Chat Room'}
                </div>

                <div
                    ref={scrollRef}
                    className='flex-1 overflow-y-auto p-4 space-y-2 bg-zinc-50 dark:bg-zinc-900'
                >
                    {loading ? (
                        <div className='text-center text-zinc-500 mt-4'>
                            Loading...
                        </div>
                    ) : messages.length === 0 ? (
                        <p className='text-center text-zinc-400 italic'>
                            No messages in this channel.
                        </p>
                    ) : (
                        groupedMessages.map((group, idx) => (
                            <SlideInOnScroll key={group[0].id} index={idx}>
                                <MessageGroup
                                    messages={group}
                                    isOwn={group[0].author?.id === user?.id}
                                    compact
                                    isPublic
                                    onReply={(m) => setReplyTo(m)}
                                    findMessageById={(id) =>
                                        messages.find((mm) => mm.id === id)
                                    }
                                />
                            </SlideInOnScroll>
                        ))
                    )}
                </div>

                {selectedChannel && (
                    <div className='border-t border-zinc-200 dark:border-zinc-800 p-3 flex flex-col gap-2 bg-white dark:bg-zinc-900'>
                        {replyTo && (
                            <div className='flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded'>
                                <span className='truncate'>
                                    Replying to: {replyTo.content.slice(0, 80)}
                                </span>
                                <button
                                    className='text-blue-600 dark:text-blue-400 hover:underline ml-2 shrink-0'
                                    onClick={() => setReplyTo(null)}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                        <div className='flex items-center'>
                            <input
                                type='text'
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder='Type a message...'
                                className='flex-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded px-3 py-2'
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') sendMessage();
                                    if (e.key === 'Escape') setReplyTo(null);
                                }}
                            />
                            <Button
                                onClick={sendMessage}
                                className='ml-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
                            >
                                Send
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
