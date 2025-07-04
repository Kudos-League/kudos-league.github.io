import React, { useEffect, useRef, useState } from 'react';
import {
    getMessages,
    getUserDetails,
    sendDirectMessage
} from 'shared/api/actions';
import { useAppSelector } from 'redux_store/hooks';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ChannelDTO, CreateMessageDTO, MessageDTO } from '@/shared/api/types';

interface ChatModalProps {
    isChatOpen: boolean;
    setIsChatOpen: (open: boolean) => void;
    recipientID?: number;
    selectedChannel?: ChannelDTO | null;
    onChannelCreated?: (channel: ChannelDTO) => void;
    initialMessage?: string;
    onMessageSent?: () => void;
}

export default function ChatModal({
    isChatOpen,
    setIsChatOpen,
    recipientID = 0,
    selectedChannel: initialSelected,
    onChannelCreated,
    initialMessage = "Hello! I'm interested in your post.",
    onMessageSent
}: ChatModalProps) {
    const [messageInput, setMessageInput] = useState(initialMessage);
    const [messages, setMessages] = useState<MessageDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(
        initialSelected || null
    );

    const token = useAppSelector((s) => s.auth.token);
    const { user } = useAuth();
    const { joinChannel, leaveChannel } = useWebSocket(
        token,
        messages,
        setMessages
    );
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (isChatOpen) {
            if (recipientID !== 0) fetchExistingChannel(recipientID);
            else if (initialSelected) {
                setSelectedChannel(initialSelected);
                fetchMessages(initialSelected.id);
            }
        }
    }, [isChatOpen]);

    useEffect(() => {
        if (selectedChannel && selectedChannel.id !== -1) {
            joinChannel(selectedChannel.id);
            return () => leaveChannel(selectedChannel.id);
        }
    }, [selectedChannel]);

    const fetchExistingChannel = async (recipientId: number) => {
        if (!token) return;
        setLoading(true);
        try {
            const userDetails = await getUserDetails('me', token, {
                dmChannels: true
            });
            let channel = userDetails.dmChannels.find((ch) =>
                ch.users.some((u) => u.id === recipientId)
            );
            if (channel) {
                const otherUser = channel.users.find((u) => u.id !== user?.id);
                channel = { ...channel, otherUser };
                setSelectedChannel(channel);
                fetchMessages(channel.id);
            }
            else {
                setSelectedChannel({
                    id: -1,
                    name: 'Pending Channel',
                    type: 'direct',
                    users: [user!, { id: recipientId }],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                } as any);
                setLoading(false);
            }
        }
        catch (err) {
            console.error('Failed to fetch DM channel:', err);
            setLoading(false);
        }
    };

    const fetchMessages = async (channelId: number) => {
        if (!token) return;
        setLoading(true);
        try {
            const msgs = await getMessages(channelId, token);
            setMessages(msgs);
        }
        catch (err) {
            console.error('Error fetching messages:', err);
        }
        finally {
            setLoading(false);
        }
    };

    const validateMessage = (msg: string) =>
        msg.trim().length > 0 && msg.trim().length <= 1000;

    const sendMessage = async () => {
        if (!token || !validateMessage(messageInput)) return;
        try {
            setLoading(true);

            const msg: CreateMessageDTO = { content: messageInput };
            let response;

            if (!selectedChannel || selectedChannel.id === -1) {
                if (!recipientID || recipientID === 0) return;
                response = await sendDirectMessage(+recipientID, msg, token);
                if (response.channel) {
                    const newChannel = {
                        ...response.channel,
                        otherUser: response.channel.users.find(
                            (u) => u.id !== user?.id
                        )
                    };
                    setSelectedChannel(newChannel);
                    joinChannel(newChannel.id);
                    onChannelCreated?.(newChannel);
                }
            }
            else {
                const receiver = selectedChannel.users.find(
                    (u) => u.id !== user?.id
                );
                if (!receiver) return;
                response = await sendDirectMessage(receiver.id, msg, token);
            }

            const fullMessage = {
                ...response,
                author: response.author || user,
                status: 'sent'
            };

            setMessages((prev) => [...prev, fullMessage]);
            setMessageInput('');
            onMessageSent?.();
        }
        catch (err) {
            console.error('Send failed:', err);
        }
        finally {
            setLoading(false);
        }
    };

    if (!isChatOpen) return null;

    return (
        <div className='fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center'>
            <div className='bg-white rounded-lg shadow-lg w-full max-w-lg p-4 max-h-[90vh] flex flex-col'>
                {/* Header */}
                <div className='flex justify-between items-center border-b pb-2 mb-3'>
                    <h2 className='text-lg font-semibold'>
                        {selectedChannel?.otherUser?.username ||
                            'Direct Message'}
                    </h2>
                    <button
                        className='text-sm text-red-500 hover:underline'
                        onClick={() => {
                            if (selectedChannel && selectedChannel.id !== -1) {
                                leaveChannel(selectedChannel.id);
                            }
                            setIsChatOpen(false);
                            setMessages([]);
                            setSelectedChannel(null);
                        }}
                    >
                        Close
                    </button>
                </div>

                {/* Messages */}
                <div
                    ref={scrollRef}
                    className='flex-1 overflow-y-auto space-y-2 border rounded p-3 bg-gray-50 mb-3'
                >
                    {loading && (
                        <p className='text-center text-gray-400'>
                            Loading messages...
                        </p>
                    )}
                    {!loading && messages.length === 0 && (
                        <p className='text-center text-gray-400'>
                            No messages yet.
                        </p>
                    )}
                    {messages.map((msg, i) => {
                        const isOwn = msg.author?.id === user?.id;
                        return (
                            <div
                                key={i}
                                className={`max-w-xs p-2 rounded-lg text-sm ${
                                    isOwn
                                        ? 'bg-blue-600 text-white self-end ml-auto'
                                        : 'bg-white border self-start'
                                }`}
                            >
                                <p>{msg.content}</p>
                                <div className='text-xs text-right text-gray-400 mt-1'>
                                    {new Date(
                                        msg.createdAt
                                    ).toLocaleTimeString()}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Input */}
                <div className='flex items-center gap-2'>
                    <textarea
                        rows={2}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className='flex-1 border rounded px-3 py-2'
                        placeholder='Type your message...'
                    />
                    <button
                        disabled={!validateMessage(messageInput) || loading}
                        onClick={sendMessage}
                        className={`px-4 py-2 rounded text-white ${
                            validateMessage(messageInput) && !loading
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-gray-400 cursor-not-allowed'
                        }`}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
